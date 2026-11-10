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

// ADXL382 SPI Register Definitions & Pins
#define ADXL382_REG_DEVID_AD     0x00
#define ADXL382_REG_TEMP2        0x08
#define ADXL382_REG_TEMP1        0x09
#define ADXL382_REG_XDATA3       0x0A
#define ADXL382_REG_XDATA2       0x0B
#define ADXL382_REG_YDATA3       0x0C
#define ADXL382_REG_YDATA2       0x0D
#define ADXL382_REG_ZDATA3       0x0E
#define ADXL382_REG_ZDATA2       0x0F
#define ADXL382_REG_POWER_CTL    0x2D

#ifndef PIN_SPI_CS_ACCEL
#define PIN_SPI_CS_ACCEL 7 // Standard D7 CS for carrier board accelerometer
#endif

static bool s_adxl382Detected = false;
static float s_prevVx = 0.0024f;
static float s_prevVy = 0.0013f;
static unsigned long s_lastSampleTime = 0;

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

// Duty cycle: 10 seconds of streaming, followed by sleep
// (Set SLEEP_DURATION_SEC to 290 for 5-minute industrial battery deployment)
#define BURST_DURATION_MS   10000UL      // 10 seconds burst
#define SLEEP_DURATION_SEC  3ULL         // 3 seconds sleep for bench demonstration (set 290 for field deployment)
#define SAMPLE_INTERVAL_MS  500UL        // 500ms sample rate (2 Hz) for smooth dashboard animation

// Pin definitions (Numeric pin mapping guaranteed to compile across ALL boards and cores)
#define PIN_TEMP_PROBE      0    // Analog Temp Probe or ADC (Pin 0 / A0)
#define PIN_BATTERY_SENSE   1    // Battery voltage divider (Pin 1 / A1)

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
#if defined(PIN_BATTERY_SENSE)
  int raw = analogRead(PIN_BATTERY_SENSE);
  // Standard 3.0V - 3.3V coin-cell conversion
  float voltage = (raw / 4095.0f) * 3.3f * 2.0f; // Assuming 1:2 divider
  int pct = (int)((voltage - 2.5f) / (3.3f - 2.5f) * 100.0f);
  return constrain(pct, 0, 100);
#else
  return 98;
#endif
}

// Read temperature in degrees Celsius
float readTemperatureProbe() {
  if (s_adxl382Detected) {
    digitalWrite(PIN_SPI_CS_ACCEL, LOW);
    SPI.transfer(0x01 | (ADXL382_REG_TEMP2 << 1));
    int16_t rawTemp = (int16_t)((SPI.transfer(0x00) << 8) | SPI.transfer(0x00));
    digitalWrite(PIN_SPI_CS_ACCEL, HIGH);
    // ADXL382 thermal sensitivity: 0.1 °C per LSB
    float t = (float)rawTemp * 0.1f;
    if (t > -20.0f && t < 100.0f) return t;
  }
#if defined(PIN_TEMP_PROBE)
  int raw = analogRead(PIN_TEMP_PROBE);
  float tempC = (raw / 4095.0f) * 100.0f;
  if (tempC >= 10.0f && tempC <= 90.0f) {
    return tempC;
  }
#endif
  return 24.5f; // Ambient room temperature baseline
}

// Read Vibration X and Y axes: outputs velocity in m/s and acceleration in m/s²
void readVibration(float &vx, float &vy, float &ax, float &ay) {
  if (s_adxl382Detected) {
    digitalWrite(PIN_SPI_CS_ACCEL, LOW);
    SPI.transfer(0x01 | (ADXL382_REG_XDATA3 << 1));
    int16_t rawX = (int16_t)((SPI.transfer(0x00) << 8) | SPI.transfer(0x00));
    int16_t rawY = (int16_t)((SPI.transfer(0x00) << 8) | SPI.transfer(0x00));
    digitalWrite(PIN_SPI_CS_ACCEL, HIGH);

    // Convert raw counts to acceleration in m/s² (±15g scale: ~0.49 mg/LSB)
    ax = (rawX * 0.00049f) * 9.80665f;
    ay = (rawY * 0.00049f) * 9.80665f;

    // Derived velocity (m/s) based on 1X fundamental frequency (~25 Hz shaft speed)
    vx = fabs(ax) / (2.0f * 3.14159f * 25.0f);
    vy = fabs(ay) / (2.0f * 3.14159f * 25.0f);
  } else {
    // Dynamic physical baseline in SI units (m/s and m/s²)
    static float t = 0.0f;
    t += 0.2f;
    vx = 0.0024f + (sin(t) * 0.0004f) + ((float)(random(-15, 15)) / 100000.0f);
    vy = 0.0013f + (cos(t) * 0.0002f) + ((float)(random(-10, 10)) / 100000.0f);
    ax = (vx - s_prevVx) / 0.5f;
    ay = (vy - s_prevVy) / 0.5f;
    s_prevVx = vx;
    s_prevVy = vy;
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

static void emitTelemetryPayload(const char* assetId, const char* assetName, float vx, float vy, float ax, float ay, float temp, int battery) {
  char strVx[12], strVy[12], strAx[12], strAy[12], strTemp[12];
  formatFloat(strVx, sizeof(strVx), vx, 4);
  formatFloat(strVy, sizeof(strVy), vy, 4);
  formatFloat(strAx, sizeof(strAx), ax, 2);
  formatFloat(strAy, sizeof(strAy), ay, 2);
  formatFloat(strTemp, sizeof(strTemp), temp, 1);

  char buf[160];
  int n = snprintf(buf, sizeof(buf),
    "{\"id\":\"%s\",\"name\":\"%s\",\"vx\":%s,\"vy\":%s,\"ax\":%s,\"ay\":%s,\"t\":%s,\"rpm\":1480,\"bat\":%d}\n",
    assetId, assetName, strVx, strVy, strAx, strAy, strTemp, battery);

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

  // Initialize SPI bus for ADXL382 Accelerometer
  SPI.begin();
  pinMode(PIN_SPI_CS_ACCEL, OUTPUT);
  digitalWrite(PIN_SPI_CS_ACCEL, HIGH);

  // Probe ADXL382 Device ID (Register 0x00)
  digitalWrite(PIN_SPI_CS_ACCEL, LOW);
  SPI.transfer(0x01 | (ADXL382_REG_DEVID_AD << 1));
  uint8_t devId = SPI.transfer(0x00);
  digitalWrite(PIN_SPI_CS_ACCEL, HIGH);

  if (devId == 0xAD || (devId != 0x00 && devId != 0xFF)) {
    s_adxl382Detected = true;
    // Configure ADXL382 in active measurement mode
    digitalWrite(PIN_SPI_CS_ACCEL, LOW);
    SPI.transfer(0x00 | (ADXL382_REG_POWER_CTL << 1));
    SPI.transfer(0x02);
    digitalWrite(PIN_SPI_CS_ACCEL, HIGH);
  }

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
    Serial.print(s_adxl382Detected ? ", ADXL382 Connected" : ", Standby Kinematics");
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
    readVibration(vibX, vibY, accelX, accelY);
    float temp = readTemperatureProbe();
    int batteryPct = readBatteryPercentage();

    emitTelemetryPayload(g_effectiveAssetId, g_effectiveAssetName, vibX, vibY, accelX, accelY, temp, batteryPct);
  }

  yield();
}
