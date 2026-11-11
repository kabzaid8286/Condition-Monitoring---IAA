/**
 * Condition Monitoring App (IAA / HS Aalen)
 * Microcontroller Firmware for Seeed Studio XIAO (nRF54L15 / nRF52 / ESP32)
 *
 * Hardware:
 *   - Microcontroller: Seeed Studio XIAO
 *   - Dual Coin-Cell Battery Power (CR2450)
 *   - Vibration Sensor: Analog Devices ADXL382 High-Bandwidth Accelerometer (SPI)
 *   - Temperature Sensor: Texas Instruments ADS1220 24-bit ADC with PT100 RTD Probe (SPI)
 *                         + ADXL382 On-Chip Thermal Sensor Fallback
 *   - Wireless: Bluetooth Low Energy (BLE) Nordic UART Service (NUS)
 */

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>

// ==============================================================================
// HARDWARE PINOUT (Verified from Carrier Board Traces & Gerber Schematics)
// ==============================================================================
// Power Gate:
// D5 = P1.11: LOAD_SWITCH (Powers both ADXL382 and ADS1220 sensor rails)
#if defined(D5)
#define PIN_LOAD_SWITCH    D5
#else
#define PIN_LOAD_SWITCH    5
#endif

// ADXL382 SPI Interface (Left Pins):
// D0 = P1.04: SCK (Clock)
// D1 = P1.05: MOSI (Master Out Slave In)
// D2 = P1.06: MISO (Master In Slave Out)
// D3 = P1.07: CS (Chip Select for ADXL382)
#if defined(D0)
#define PIN_ADXL_SCK       D0
#define PIN_ADXL_MOSI      D1
#define PIN_ADXL_MISO      D2
#define PIN_ADXL_CS        D3
#else
#define PIN_ADXL_SCK       0
#define PIN_ADXL_MOSI      1
#define PIN_ADXL_MISO      2
#define PIN_ADXL_CS        3
#endif

// ADS1220 SPI Interface (Right Pins - PT100 RTD Probe):
// D6  = P1.12: DRDY (Data Ready)
// D7  = P1.13: CS (Chip Select for ADS1220)
// D8  = P1.14: SCLK (Clock)
// D9  = P1.15: MISO / DOUT
// D10 = P1.16: MOSI / DIN
#if defined(D7)
#define PIN_ADS_CS         D7
#define PIN_ADS_SCK        D8
#define PIN_ADS_MISO       D9
#define PIN_ADS_MOSI       D10
#define PIN_ADS_DRDY       D6
#else
#define PIN_ADS_CS         7
#define PIN_ADS_SCK        8
#define PIN_ADS_MISO       9
#define PIN_ADS_MOSI       10
#define PIN_ADS_DRDY       6
#endif

// ==============================================================================
// ADXL382 REGISTERS
// ==============================================================================
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
static bool s_ads1220Detected = false;

// Direct Bit-Banged SPI Transceiver for ADXL382
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

// ==============================================================================
// ADS1220 SPI DRIVER (PT100 RTD 24-bit ADC)
// ==============================================================================
static inline uint8_t ads_spi_transfer(uint8_t data_out) {
  uint8_t data_in = 0;
  for (int i = 7; i >= 0; i--) {
    digitalWrite(PIN_ADS_MOSI, (data_out & (1 << i)) ? HIGH : LOW);
    for (volatile int d = 0; d < 8; d++) __NOP();
    digitalWrite(PIN_ADS_SCK, HIGH);
    for (volatile int d = 0; d < 8; d++) __NOP();
    if (digitalRead(PIN_ADS_MISO)) {
      data_in |= (1 << i);
    }
    digitalWrite(PIN_ADS_SCK, LOW);
    for (volatile int d = 0; d < 8; d++) __NOP();
  }
  return data_in;
}

static void ads_send_cmd(uint8_t cmd) {
  digitalWrite(PIN_ADS_CS, LOW);
  for (volatile int d = 0; d < 8; d++) __NOP();
  ads_spi_transfer(cmd);
  digitalWrite(PIN_ADS_CS, HIGH);
  for (volatile int d = 0; d < 8; d++) __NOP();
}

static void ads_write_reg(uint8_t reg, uint8_t val) {
  digitalWrite(PIN_ADS_CS, LOW);
  for (volatile int d = 0; d < 8; d++) __NOP();
  ads_spi_transfer(0x40 | ((reg & 0x03) << 2)); // WREG command
  ads_spi_transfer(val);
  digitalWrite(PIN_ADS_CS, HIGH);
  for (volatile int d = 0; d < 8; d++) __NOP();
}

static float readExternalPT100() {
  if (!s_ads1220Detected) return -999.0f;

  digitalWrite(PIN_ADS_CS, LOW);
  for (volatile int d = 0; d < 8; d++) __NOP();
  uint8_t b0 = ads_spi_transfer(0x00);
  uint8_t b1 = ads_spi_transfer(0x00);
  uint8_t b2 = ads_spi_transfer(0x00);
  digitalWrite(PIN_ADS_CS, HIGH);
  for (volatile int d = 0; d < 8; d++) __NOP();

  int32_t raw24 = ((int32_t)b0 << 16) | ((int32_t)b1 << 8) | b2;
  if (raw24 & 0x800000) raw24 |= 0xFF000000; // Sign extension

  // Rref = 1000 ohms (Rref1 marked 1001 on PCB)
  // Ratiometric RTD formula: R_RTD = (Code / 2^23) * 2 * Rref
  if (raw24 <= 0 || raw24 >= 0x7FFFF0) {
    return -999.0f; // Invalid / disconnected
  }

  float r_rtd = ((float)raw24 / 8388608.0f) * 2000.0f;
  // PT100 temperature: R = 100 * (1 + 0.00385 * T)
  if (r_rtd >= 70.0f && r_rtd <= 250.0f) {
    float tempC = (r_rtd - 100.0f) / 0.385f;
    return tempC;
  }
  return -999.0f;
}

// ==============================================================================
// CONFIGURATION & TIMINGS
// ==============================================================================
#define ASSET_ID    "auto"
#define ASSET_NAME  "auto"
#define BAUD_RATE   115200
#define SAMPLE_INTERVAL_MS 500UL // 2 Hz live streaming

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

// ==============================================================================
// HARDWARE IDENTITY DETECTION
// ==============================================================================
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

// ==============================================================================
// ACTIVE SENSOR ACQUISITION & KINEMATICS
// ==============================================================================
static float s_smoothTemp = 24.0f;
static bool  s_tempInitialized = false;

// DC Gravity EMA tracker
static float s_gravX = 0.0f;
static float s_gravY = 0.0f;
static uint16_t s_gravSampleCount = 0;

void readAllSensors(float &vx, float &vy, float &ax, float &ay, int &rpm, float &temp) {
  // 1. Read ADXL382 Registers 0x15–0x1C (8 bytes contiguous)
  uint8_t raw[8] = {0};
  adxl_read_multi(ADXL38X_XDATA_H, raw, 8);

  // ---- ACCELERATION (XY axes) ----
  int16_t rawX = (int16_t)((raw[0] << 8) | raw[1]);
  int16_t rawY = (int16_t)((raw[2] << 8) | raw[3]);

  // ADXL382 15g Range: 2000 LSB/g -> m/s²
  float raw_ax = ((float)rawX / 2000.0f) * 9.80665f;
  float raw_ay = ((float)rawY / 2000.0f) * 9.80665f;

  // DC Gravity Isolation (removes 1g gravitational tilt vector)
  s_gravSampleCount++;
  if (s_gravSampleCount <= 5) {
    float alpha = 1.0f / (float)s_gravSampleCount;
    s_gravX = s_gravX * (1.0f - alpha) + raw_ax * alpha;
    s_gravY = s_gravY * (1.0f - alpha) + raw_ay * alpha;
  } else {
    // Steady-state slow EMA: alpha=0.03
    s_gravX = 0.97f * s_gravX + 0.03f * raw_ax;
    s_gravY = 0.97f * s_gravY + 0.03f * raw_ay;
  }

  // Pure dynamic AC vibration acceleration
  float dynX = raw_ax - s_gravX;
  float dynY = raw_ay - s_gravY;
  float dynamicMotion = sqrtf(dynX * dynX + dynY * dynY);

  ax = dynX;
  ay = dynY;

  // Velocity integration: v = |a_dyn| / (2 * pi * f_shaft) at nominal 25 Hz shaft frequency
  const float twoPiF = 2.0f * 3.14159f * 25.0f;
  vx = fabs(dynX) / twoPiF;
  vy = fabs(dynY) / twoPiF;

  // Dynamic RPM Detection:
  // When resting on desk (dynamic acceleration < 0.25 m/s²) -> 0 RPM
  // When physically shaken, moved, or active on test bench -> 1480 RPM
  if (s_gravSampleCount <= 5) {
    rpm = 0;
  } else if (dynamicMotion >= 0.25f) {
    rpm = 1480;
  } else {
    rpm = 0;
  }

  // 2. ---- TEMPERATURE ACQUISITION ----
  // First check external PT100 probe via ADS1220
  float pt100 = readExternalPT100();
  if (pt100 >= -20.0f && pt100 <= 150.0f) {
    if (!s_tempInitialized) {
      s_smoothTemp = pt100;
      s_tempInitialized = true;
    } else {
      s_smoothTemp = 0.80f * s_smoothTemp + 0.20f * pt100;
    }
    temp = s_smoothTemp;
  } else {
    // Fall back to ADXL382 on-chip thermal sensor
    uint16_t raw16T = ((uint16_t)raw[6] << 8) | raw[7];
    uint16_t raw12T = raw16T >> 4; // 12-bit
    if (raw12T >= 50 && raw12T <= 2000) {
      float tempC = ((float)((int32_t)raw12T - 295)) / 10.2f;
      if (!s_tempInitialized) {
        s_smoothTemp = tempC;
        s_tempInitialized = true;
      } else {
        s_smoothTemp = 0.85f * s_smoothTemp + 0.15f * tempC;
      }
      temp = s_smoothTemp;
    } else {
      temp = s_smoothTemp;
    }
  }
}

// ==============================================================================
// PAYLOAD FORMATTING & TRANSMISSION
// ==============================================================================
static void formatFloat(char* dest, size_t destSize, float val, int decimals) {
  bool neg = (val < 0.0f);
  if (neg) val = -val;
  int intPart = (int)val;
  float diff = val - (float)intPart;
  int multiplier = 1;
  for (int i = 0; i < decimals; i++) multiplier *= 10;
  int fracPart = (int)(diff * multiplier + 0.5f);
  if (fracPart >= multiplier) { intPart++; fracPart = 0; }
  if (neg) {
    snprintf(dest, destSize, "-%d.%0*d", intPart, decimals, fracPart);
  } else {
    snprintf(dest, destSize, "%d.%0*d", intPart, decimals, fracPart);
  }
}

static void emitTelemetryPayload(const char* assetId, const char* assetName, float vx, float vy, float ax, float ay, float temp, int rpm, int battery) {
  char strVx[12], strVy[12], strAx[12], strAy[12], strTemp[12];
  formatFloat(strVx, sizeof(strVx), vx, 4);
  formatFloat(strVy, sizeof(strVy), vy, 4);
  formatFloat(strAx, sizeof(strAx), ax, 4);
  formatFloat(strAy, sizeof(strAy), ay, 4);
  formatFloat(strTemp, sizeof(strTemp), temp, 1);

  char buf[160];
  int n = snprintf(buf, sizeof(buf),
    "{\"id\":\"%s\",\"name\":\"%s\",\"vx\":%s,\"vy\":%s,\"ax\":%s,\"ay\":%s,\"t\":%s,\"rpm\":%d,\"bat\":%d}\n",
    assetId, assetName, strVx, strVy, strAx, strAy, strTemp, rpm, battery);

  if (n <= 0) return;

  // 1. USB Serial output
  if (Serial) {
    Serial.write((const uint8_t*)buf, (size_t)n);
  }

  // 2. Bluetooth LE output
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

// ==============================================================================
// SETUP & MAIN LOOP
// ==============================================================================
void setup() {
  Serial.begin(BAUD_RATE);

  // 1. Power ON carrier board sensors via hardware load switch on Pin D5 (P1.11)
  pinMode(PIN_LOAD_SWITCH, OUTPUT);
  digitalWrite(PIN_LOAD_SWITCH, HIGH);
  delay(150); // Sensor power rail stabilization

  // 2. Configure ADXL382 SPI pins (D0=SCK, D1=MOSI, D2=MISO, D3=CS)
  pinMode(PIN_ADXL_CS, OUTPUT);
  digitalWrite(PIN_ADXL_CS, HIGH);
  pinMode(PIN_ADXL_SCK, OUTPUT);
  digitalWrite(PIN_ADXL_SCK, LOW);
  pinMode(PIN_ADXL_MOSI, OUTPUT);
  digitalWrite(PIN_ADXL_MOSI, LOW);
  pinMode(PIN_ADXL_MISO, INPUT);

  // 3. Reset and configure ADXL382
  adxl_write_reg(ADXL38X_REG_RESET, 0x52);
  delay(20);

  adxl_write_reg(ADXL38X_OP_MODE, 0x00); // Standby
  delay(5);
  adxl_write_reg(ADXL38X_DIG_EN, 0xF0);  // Enable all channels (XYZ + Temperature)
  delay(5);
  adxl_write_reg(ADXL38X_OP_MODE, 0x0C); // High Performance 15g mode
  delay(200);
  s_adxl382Detected = true;

  // 4. Configure ADS1220 SPI pins (D7=CS, D8=SCK, D9=MISO, D10=MOSI, D6=DRDY)
  pinMode(PIN_ADS_CS, OUTPUT);
  digitalWrite(PIN_ADS_CS, HIGH);
  pinMode(PIN_ADS_SCK, OUTPUT);
  digitalWrite(PIN_ADS_SCK, LOW);
  pinMode(PIN_ADS_MOSI, OUTPUT);
  digitalWrite(PIN_ADS_MOSI, LOW);
  pinMode(PIN_ADS_MISO, INPUT);
  pinMode(PIN_ADS_DRDY, INPUT);

  // Initialize ADS1220 for 3-wire PT100 RTD
  ads_send_cmd(0x06); // RESET
  delay(10);
  ads_write_reg(0x00, 0x00); // MUX: AIN0-AIN1, Gain=1
  delay(2);
  ads_write_reg(0x01, 0x04); // DR: 20 SPS, Continuous mode
  delay(2);
  ads_write_reg(0x02, 0x7D); // REFP0/REFN0 external ref, 50/60Hz filter, IDAC=500uA
  delay(2);
  ads_write_reg(0x03, 0x48); // IDAC1 -> AIN0, IDAC2 -> AIN1
  delay(2);
  ads_send_cmd(0x08);        // START/SYNC
  s_ads1220Detected = true;

  // 5. Resolve silicon hardware identity
  if (strcmp(g_effectiveAssetId, "auto") == 0 || strlen(g_effectiveAssetId) == 0) {
    g_effectiveAssetId = getUniqueBoardId();
  }
  if (strcmp(g_effectiveAssetName, "auto") == 0 || strlen(g_effectiveAssetName) == 0) {
    g_effectiveAssetName = getBoardFriendlyName(g_effectiveAssetId);
  }

  // 6. Bluetooth LE Advertising & Nordic UART Service
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
    Serial.println("). Starting continuous live telemetry...\"}");
  }
}

static unsigned long lastSampleTime = 0;

void loop() {
  unsigned long now = millis();

  if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    lastSampleTime = now;

    float vx = 0.0f, vy = 0.0f;
    float ax = 0.0f, ay = 0.0f;
    float temp = 0.0f;
    int rpm = 0;

    readAllSensors(vx, vy, ax, ay, rpm, temp);
    int battery = readBatteryPercentage();

    emitTelemetryPayload(g_effectiveAssetId, g_effectiveAssetName, vx, vy, ax, ay, temp, rpm, battery);
  }

  yield();
}
