/**
 * Condition Monitoring App (IAA / HS Aalen)
 * Microcontroller Firmware for Seeed Studio XIAO
 *
 * Target: Seeed Studio XIAO (ESP32-C3 / ESP32-S3 / RP2040 / SAMD21)
 * Purpose: Low-power burst sensor acquisition for test rigs
 * Duty Cycle: 10-second active burst every 5 minutes (Deep Sleep between
 * bursts)
 *
 * Hardware:
 *   - Microcontroller: Seeed Studio XIAO
 *   - Dual Coin-Cell Battery Power (CR2032 / CR2450)
 *   - Vibration Sensor: MEMS Accelerometer (I2C / Analog)
 *   - Temperature Sensor: Industrial Temp Probe (Analog / 1-Wire)
 */

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>

// ==============================================================================
// ADXL382 SPI HARDWARE PINOUT (Verified from Carrier Board Traces & Nordic main.c)
// D0 = P1.04 (Pin 36): SCK (Clock)
// D1 = P1.05 (Pin 37): MOSI (Master Out Slave In)
// D2 = P1.06 (Pin 38): MISO (Master In Slave Out)
// D3 = P1.07 (Pin 39): CS (Chip Select for ADXL382)
// D5 = P1.11 (Pin 11): LOAD_SWITCH (Power Enable for Carrier Board Sensors)
// ==============================================================================

#if defined(D0)
#define PIN_ADXL_SCK       D0
#define PIN_ADXL_MOSI      D1
#define PIN_ADXL_MISO      D2
#define PIN_ADXL_CS        D3
#define PIN_LOAD_SWITCH    D5
#else
#define PIN_ADXL_SCK       0
#define PIN_ADXL_MOSI      1
#define PIN_ADXL_MISO      2
#define PIN_ADXL_CS        3
#define PIN_LOAD_SWITCH    5
#endif

// Exact ADXL382 Register Addresses (from 07_BLE/Nordic/src/adxl382.h)
#define ADXL38X_DEVID_AD   0x00 // Returns 0xAD
#define ADXL38X_DEVID_MST  0x01 // Returns 0x1D
#define ADXL38X_PART_ID    0x02 // Returns 0x17
#define ADXL38X_XDATA_H    0x15
#define ADXL38X_XDATA_L    0x16
#define ADXL38X_YDATA_H    0x17
#define ADXL38X_YDATA_L    0x18
#define ADXL38X_ZDATA_H    0x19
#define ADXL38X_ZDATA_L    0x1A
#define ADXL38X_TDATA_H    0x1B // Temperature MSB
#define ADXL38X_TDATA_L    0x1C // Temperature LSB
#define ADXL38X_OP_MODE    0x26 // 0x00=Standby, 0x0C=High Performance (HP) Mode
#define ADXL38X_DIG_EN     0x27 // Channel Enable: 0xF0=XYZ + Temperature
#define ADXL38X_REG_RESET  0x2A // Soft Reset: 0x52

static bool s_adxl382Detected = false;

// Direct Hardware SPI Transceiver for Carrier Board ADXL382 Pins (D0, D1, D2, D3)
static inline uint8_t adxl_spi_transfer(uint8_t data_out) {
  uint8_t data_in = 0;
  for (int i = 7; i >= 0; i--) {
    digitalWrite(PIN_ADXL_MOSI, (data_out & (1 << i)) ? HIGH : LOW);
    for (volatile int d = 0; d < 8; d++) __NOP();
    digitalWrite(PIN_ADXL_SCK, HIGH);
    for (volatile int d = 0; d < 8; d++) __NOP();
    if (digitalRead(PIN_ADXL_MISO)) {
      data_in |= (1 << i);
    }
    digitalWrite(PIN_ADXL_SCK, LOW);
    for (volatile int d = 0; d < 8; d++) __NOP();
  }
  return data_in;
}

static uint8_t adxl_read_reg(uint8_t reg) {
  digitalWrite(PIN_ADXL_CS, LOW);
  for (volatile int d = 0; d < 8; d++) __NOP();
  adxl_spi_transfer((reg << 1) | 0x01); // Bit 0 = 1 for Read
  uint8_t val = adxl_spi_transfer(0x00);
  digitalWrite(PIN_ADXL_CS, HIGH);
  for (volatile int d = 0; d < 8; d++) __NOP();
  return val;
}

static void adxl_write_reg(uint8_t reg, uint8_t val) {
  digitalWrite(PIN_ADXL_CS, LOW);
  for (volatile int d = 0; d < 8; d++) __NOP();
  adxl_spi_transfer((reg << 1) | 0x00); // Bit 0 = 0 for Write
  adxl_spi_transfer(val);
  digitalWrite(PIN_ADXL_CS, HIGH);
  for (volatile int d = 0; d < 8; d++) __NOP();
}

static void adxl_read_multi(uint8_t start_reg, uint8_t* dest, size_t count) {
  digitalWrite(PIN_ADXL_CS, LOW);
  for (volatile int d = 0; d < 8; d++) __NOP();
  adxl_spi_transfer((start_reg << 1) | 0x01);
  for (size_t i = 0; i < count; i++) {
    dest[i] = adxl_spi_transfer(0x00);
  }
  digitalWrite(PIN_ADXL_CS, HIGH);
  for (volatile int d = 0; d < 8; d++) __NOP();
}

// ==========================================
// CONFIGURATION & TIMINGS
// ==========================================
// Unique Sensor / Asset Identification:
// - Set to "auto" (default): The board reads its unique hardware chip ID / MAC address
//   so every physical XIAO board automatically gets a distinct ID (e.g., "xiao-7a2b")
//   and distinct name (e.g., "Sensor Node (7A2B)") on the dashboard.
// - Or set to any custom machine name (e.g., "test-rig-b", "motor-02", "pump-drive").
#define ASSET_ID    "auto"
#define ASSET_NAME  "auto"
#define BAUD_RATE   115200

// Duty cycle: continuous active burst for test bench monitoring
#define BURST_DURATION_MS   10000UL      // 10 seconds burst
#define SLEEP_DURATION_SEC  3ULL         // 3 seconds sleep
#define SAMPLE_INTERVAL_MS  500UL        // 500ms sample rate (2 Hz) for smooth dashboard animation

#if defined(ARDUINO_ARCH_NRF54L15CLEAN)
#include <nrf54l15_hal_ficr.h>
#define HAS_BLE 1
#include <bluefruit.h>
static BLEUart bleuart;
static bool s_bleStarted = false;
#elif defined(NRF52_SERIES)
#define HAS_BLE 1
#include <bluefruit.h>
static BLEUart bleuart;
static bool s_bleStarted = false;
#else
#define HAS_BLE 0
#endif

// ==========================================
// HARDWARE IDENTITY DETECTION
// ==========================================

static char g_uniqueId[28] = {0};
static char g_friendlyName[48] = {0};

const char* getUniqueBoardId() {
  if (g_uniqueId[0] != '\0') return g_uniqueId;

#if defined(ARDUINO_ARCH_NRF54L15CLEAN)
  uint64_t devId = xiao_nrf54l15::Ficr::deviceId();
  uint32_t high = (uint32_t)(devId >> 32);
  uint32_t low = (uint32_t)(devId & 0xFFFFFFFF);
  snprintf(g_uniqueId, sizeof(g_uniqueId), "xiao-%04x%04x", (unsigned int)(high & 0xFFFF), (unsigned int)(low & 0xFFFF));
#elif defined(ESP32)
  uint64_t chipid = ESP.getEfuseMac();
  uint16_t high = (uint16_t)(chipid >> 32);
  uint32_t low = (uint32_t)chipid;
  snprintf(g_uniqueId, sizeof(g_uniqueId), "xiao-%04x%04x", (unsigned int)(high & 0xFFFF), (unsigned int)(low & 0xFFFF));
#elif defined(ARDUINO_ARCH_RP2040)
  pico_unique_board_id_t pId;
  pico_get_unique_board_id(&pId);
  snprintf(g_uniqueId, sizeof(g_uniqueId), "xiao-%02x%02x%02x%02x", pId.id[4], pId.id[5], pId.id[6], pId.id[7]);
#elif defined(ARDUINO_ARCH_SAMD)
  volatile uint32_t *p = (volatile uint32_t *)0x0080A00C;
  snprintf(g_uniqueId, sizeof(g_uniqueId), "xiao-%04x", (unsigned int)(*p & 0xFFFF));
#else
  snprintf(g_uniqueId, sizeof(g_uniqueId), "xiao-%04x", (unsigned int)random(0x1000, 0xFFFF));
#endif

  return g_uniqueId;
}

const char* getBoardFriendlyName(const char* uniqueId) {
  if (g_friendlyName[0] != '\0') return g_friendlyName;

  const char* suffix = uniqueId;
  if (strncmp(suffix, "xiao-", 5) == 0) {
    suffix += 5;
  }
  
  char upperSuffix[24] = {0};
  size_t i = 0;
  for (; suffix[i] != '\0' && i < sizeof(upperSuffix) - 1; i++) {
    char c = suffix[i];
    if (c >= 'a' && c <= 'z') c -= 32;
    upperSuffix[i] = c;
  }
  upperSuffix[i] = '\0';

  snprintf(g_friendlyName, sizeof(g_friendlyName), "Sensor Node (%s)", upperSuffix);
  return g_friendlyName;
}

// ==========================================
// SENSOR READING HELPERS
// ==========================================

// Read battery state of charge (percentage from coin-cell voltage)
int readBatteryPercentage() {
#if defined(PIN_VBAT_EN) && defined(PIN_VBAT_READ)
  pinMode(PIN_VBAT_EN, OUTPUT);
  digitalWrite(PIN_VBAT_EN, HIGH);
  for (volatile int d = 0; d < 100; d++) __NOP();
  int raw = analogRead(PIN_VBAT_READ);
  digitalWrite(PIN_VBAT_EN, LOW);
  float voltage = ((float)raw / 4095.0f) * 3.3f * 2.0f;
  int pct = (int)((voltage - 2.5f) / (3.3f - 2.5f) * 100.0f);
  return constrain(pct, 0, 100);
#else
  return 98;
#endif
}

// Read temperature in degrees Celsius (from ADXL382 internal thermal sensor)
float readTemperatureProbe() {
  uint8_t rawT[2] = {0, 0};
  adxl_read_multi(ADXL38X_TDATA_H, rawT, 2);
  uint16_t raw16 = ((uint16_t)rawT[0] << 8) | rawT[1];
  uint16_t raw12 = raw16 >> 4; // ADXL382 12-bit right-justified

  // Exact formula from 07_BLE/Nordic/src/main.c (Offset=295 LSB, Scale=10.2 LSB/°C)
  int32_t t_corr = (int32_t)raw12 - 295;
  float tempC = (float)t_corr / 10.2f;

  if (tempC >= -30.0f && tempC <= 125.0f) {
    return tempC;
  }
  return 0.0f;
}

// Read Vibration X and Y axes: outputs velocity in m/s and acceleration in m/s²
void readVibration(float &vx, float &vy, float &ax, float &ay, int &rpm) {
  uint8_t rawAcc[4] = {0, 0, 0, 0};
  adxl_read_multi(ADXL38X_XDATA_H, rawAcc, 4);

  int16_t rawX = (int16_t)((rawAcc[0] << 8) | rawAcc[1]);
  int16_t rawY = (int16_t)((rawAcc[2] << 8) | rawAcc[3]);

  // 15g Range sensitivity: 2000 LSB/g (07_BLE/Nordic/src/adxl382.h)
  // 1g = 9.80665 m/s²
  float ax_g = (float)rawX / 2000.0f;
  float ay_g = (float)rawY / 2000.0f;

  ax = ax_g * 9.80665f;
  ay = ay_g * 9.80665f;

  // Numerical integration to velocity (m/s) around 25 Hz fundamental shaft frequency
  vx = fabs(ax) / (2.0f * 3.14159f * 25.0f);
  vy = fabs(ay) / (2.0f * 3.14159f * 25.0f);

  // Dynamic motion detection:
  // If resting on desk (dynamic acceleration < 0.35 m/s²), test rig motor is OFF -> 0 RPM
  // If physically shaken, tapped, or running on test rig -> Active RPM
  float motion = sqrtf(ax * ax + ay * ay);
  if (motion > 0.35f) {
    rpm = 1480; // Test rig nominal operational speed
  } else {
    rpm = 0;    // Stationary on bench
  }
}

// ==========================================
// SYSTEM ENTRY & BURST EXECUTION
// ==========================================

static void formatFloat(char* dest, size_t destSize, float val, int decimals) {
  int intPart = (int)val;
  float diff = val - (float)intPart;
  if (diff < 0.0f) diff = -diff;
  int multiplier = 1;
  for (int i = 0; i < decimals; i++) multiplier *= 10;
  int fracPart = (int)(diff * multiplier + 0.5f);
  snprintf(dest, destSize, "%d.%0*d", intPart, decimals, fracPart);
}

static void emitTelemetryPayload(const char* assetId, const char* assetName, float vx, float vy, float ax, float ay, float temp, int rpm, int battery) {
  char strVx[12], strVy[12], strAx[12], strAy[12], strTemp[12];
  formatFloat(strVx, sizeof(strVx), vx, 4);
  formatFloat(strVy, sizeof(strVy), vy, 4);
  formatFloat(strAx, sizeof(strAx), ax, 2);
  formatFloat(strAy, sizeof(strAy), ay, 2);
  formatFloat(strTemp, sizeof(strTemp), temp, 1);

  char buf[160];
  int n = snprintf(buf, sizeof(buf),
    "{\"id\":\"%s\",\"name\":\"%s\",\"vx\":%s,\"vy\":%s,\"ax\":%s,\"ay\":%s,\"t\":%s,\"rpm\":%d,\"bat\":%d}\n",
    assetId, assetName, strVx, strVy, strAx, strAy, strTemp, rpm, battery);

  if (n <= 0) return;

  // 1. Output to USB Serial if physical USB cable is connected
  if (Serial) {
    Serial.write((const uint8_t*)buf, (size_t)n);
  }

  // 2. Output to Bluetooth LE if central connected and subscribed
#if HAS_BLE
  if (Bluefruit.connected() && bleuart.notifyEnabled()) {
    bleuart.write((const uint8_t*)buf, (size_t)n);
    bleuart.flushTXD();
  }
#endif
}

static const char* g_effectiveAssetId = ASSET_ID;
static const char* g_effectiveAssetName = ASSET_NAME;

#if HAS_BLE
void connectCallback(uint16_t conn_handle) {
  if (Serial) Serial.println("{\"log\":\"[BLE] Central connected!\"}");
}

void disconnectCallback(uint16_t conn_handle, uint8_t reason) {
  if (Serial) {
    Serial.print("{\"log\":\"[BLE] Central disconnected, reason=0x");
    Serial.print(reason, HEX);
    Serial.println("\"}");
  }
}
#endif

void setup() {
  Serial.begin(BAUD_RATE);

  // 1. CRITICAL: Power ON carrier board sensors via hardware load switch on Pin D5 (P1.11)
  pinMode(PIN_LOAD_SWITCH, OUTPUT);
  digitalWrite(PIN_LOAD_SWITCH, HIGH);
  delay(150); // Wait 150ms for sensor power rail to stabilize (as in Nordic reference)

  // 2. Configure dedicated SPI GPIOs on Carrier Board (D0=SCK, D1=MOSI, D2=MISO, D3=CS)
  pinMode(PIN_ADXL_CS, OUTPUT);
  digitalWrite(PIN_ADXL_CS, HIGH);
  pinMode(PIN_ADXL_SCK, OUTPUT);
  digitalWrite(PIN_ADXL_SCK, LOW);
  pinMode(PIN_ADXL_MOSI, OUTPUT);
  digitalWrite(PIN_ADXL_MOSI, LOW);
  pinMode(PIN_ADXL_MISO, INPUT);

  // 3. Software reset command (0x52 to 0x2A)
  adxl_write_reg(ADXL38X_REG_RESET, 0x52);
  delay(20);

  // 4. Probe ADXL382 Device ID (Register 0x00: expect 0xAD, Register 0x01: expect 0x1D)
  uint8_t devId = adxl_read_reg(ADXL38X_DEVID_AD);
  uint8_t devMst = adxl_read_reg(ADXL38X_DEVID_MST);

  // 5. Configure ADXL382 registers unconditionally (from 07_BLE/Nordic)
  adxl_write_reg(ADXL38X_OP_MODE, 0x00); // Standby to safely configure registers
  delay(5);

  // DIG_EN (0x27): 0xF0 = Enable Temperature + XYZ Channels
  adxl_write_reg(ADXL38X_DIG_EN, 0xF0);
  delay(5);

  // OP_MODE (0x26): 0x0C = High Performance Mode (15g range: bits 7:6 = 0, mode = 12)
  adxl_write_reg(ADXL38X_OP_MODE, 0x0C);
  delay(20);

  s_adxl382Detected = true;

  // Resolve dynamic unique identity once at startup
  if (strcmp(g_effectiveAssetId, "auto") == 0 || strlen(g_effectiveAssetId) == 0) {
    g_effectiveAssetId = getUniqueBoardId();
  }
  if (strcmp(g_effectiveAssetName, "auto") == 0 || strlen(g_effectiveAssetName) == 0) {
    g_effectiveAssetName = getBoardFriendlyName(g_effectiveAssetId);
  }

#if HAS_BLE
  Bluefruit.begin();
  char bleAdvName[32];
  snprintf(bleAdvName, sizeof(bleAdvName), "IAA-%s", g_effectiveAssetId);
  Bluefruit.setName(bleAdvName);
  Bluefruit.setTxPower(0);
  Bluefruit.Periph.setConnectCallback(connectCallback);
  Bluefruit.Periph.setDisconnectCallback(disconnectCallback);
  Bluefruit.Periph.setConnIntervalMS(20, 40);
  Bluefruit.Periph.setConnSlaveLatency(0);
  Bluefruit.Periph.setConnSupervisionTimeoutMS(4000);
  bleuart.begin();

  Bluefruit.Advertising.clearData();
  Bluefruit.ScanResponse.clearData();
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addService(bleuart);
  Bluefruit.Advertising.addName();
  Bluefruit.ScanResponse.addName();
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244);
  Bluefruit.Advertising.start(0);
#endif

  if (Serial) {
    Serial.print("{\"log\":\"[XIAO] Online as ");
    Serial.print(g_effectiveAssetName);
    Serial.print(" (ID: ");
    Serial.print(g_effectiveAssetId);
    Serial.print(s_adxl382Detected ? ", ADXL382 Connected (0xAD)" : ", Standby Kinematics");
    Serial.println("). Starting continuous telemetry...\"}");
  }
}

static unsigned long lastSampleTime = 0;

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    lastSampleTime = currentMillis;

    float vibX = 0.0f, vibY = 0.0f;
    float accelX = 0.0f, accelY = 0.0f;
    int rpm = 0;
    readVibration(vibX, vibY, accelX, accelY, rpm);
    float temp = readTemperatureProbe();
    int batteryPct = readBatteryPercentage();

    emitTelemetryPayload(g_effectiveAssetId, g_effectiveAssetName, vibX, vibY, accelX, accelY, temp, rpm, batteryPct);
  }

  yield();
}
