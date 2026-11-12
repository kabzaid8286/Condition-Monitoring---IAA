
/**
 * Condition Monitoring App (IAA / HS Aalen)
 * Seeed Studio XIAO nRF54L15
 *
 * Hardware:
 *   - ADXL382 accelerometer via bit-banged SPI
 *   - ADS1220 24-bit ADC with PT100 3-wire RTD via SPI
 *   - BLE Nordic UART Service (NUS)
 *   - Sensor power switch on D5
 *
 * Battery:
 *   - VBAT_EN: P1.15
 *   - VBAT_READ: A7 / P1.14
 *   - XIAO nRF54L15 Arduino core 1.0.22
 *
 * ADS1220:
 *   CONFIG0 = 0x66
 *   CONFIG1 = 0x04
 *   CONFIG2 = 0x55
 *   CONFIG3 = 0x70
 *
 * PT100:
 *   RREF1 = 1650 ohms
 *   IEC 60751 Callendar-Van Dusen conversion
 *
 * NOTE:
 *   PT100 temperature conversion assumes that the physical PCB wiring
 *   matches the configured ADS1220 three-wire RTD measurement circuit.
 */

#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include <math.h>
#include <string.h>
#include <stdio.h>

#if defined(ARDUINO_ARCH_NRF54L15CLEAN)
#include <nrf54l15_hal_ficr.h>
#endif

// ============================================================================
// BLE CONFIGURATION
// Define HAS_BLE before telemetry functions use it.
// ============================================================================

#if defined(ARDUINO_ARCH_NRF54L15CLEAN) || defined(NRF52_SERIES)

#define HAS_BLE 1
#include <bluefruit.h>

static BLEUart bleuart;

#else

#define HAS_BLE 0

#endif

// ============================================================================
// HARDWARE PINOUT
// ============================================================================

#if defined(D5)
#define PIN_LOAD_SWITCH D5
#else
#define PIN_LOAD_SWITCH 5
#endif

#if defined(D0)
#define PIN_ADXL_SCK D0
#define PIN_ADXL_MOSI D1
#define PIN_ADXL_MISO D2
#define PIN_ADXL_CS D3
#else
#define PIN_ADXL_SCK 0
#define PIN_ADXL_MOSI 1
#define PIN_ADXL_MISO 2
#define PIN_ADXL_CS 3
#endif

#if defined(D7)
#define PIN_ADS_CS D7
#define PIN_ADS_SCK PIN_ADXL_SCK
#define PIN_ADS_MISO PIN_ADXL_MISO
#define PIN_ADS_MOSI PIN_ADXL_MOSI
#else
#define PIN_ADS_CS 7
#define PIN_ADS_SCK 0
#define PIN_ADS_MISO 2
#define PIN_ADS_MOSI 1
#endif

// ============================================================================
// SENSOR CONFIGURATION
// ============================================================================

#define BAUD_RATE 115200
#define SAMPLE_INTERVAL_MS 500UL

#define ASSET_ID "auto"
#define ASSET_NAME "auto"

static const float PT100_RREF_OHMS = 1650.0f;
static const float ADS1220_GAIN = 8.0f;
static const float PT100_R0 = 100.0f;

static const float PT100_A = 3.9083e-3f;
static const float PT100_B = -5.775e-7f;
static const float PT100_C = -4.183e-12f;

static const float TEMP_FILTER_ALPHA = 0.25f;

static bool s_adxl382Detected = false;
static bool s_ads1220Detected = false;

// ============================================================================
// ADXL382 REGISTERS
// ============================================================================

#define ADXL38X_DEVID_AD 0x00
#define ADXL38X_DEVID_MST 0x01
#define ADXL38X_PART_ID 0x02

#define ADXL38X_XDATA_H 0x15
#define ADXL38X_XDATA_L 0x16
#define ADXL38X_YDATA_H 0x17
#define ADXL38X_YDATA_L 0x18
#define ADXL38X_ZDATA_H 0x19
#define ADXL38X_ZDATA_L 0x1A
#define ADXL38X_TDATA_H 0x1B
#define ADXL38X_TDATA_L 0x1C

#define ADXL38X_OP_MODE 0x26
#define ADXL38X_DIG_EN 0x27
#define ADXL38X_REG_RESET 0x2A

// ============================================================================
// ADXL382 BIT-BANGED SPI
// ============================================================================

static inline uint8_t adxl_spi_transfer(uint8_t data_out) {
  uint8_t data_in = 0;

  for (int i = 7; i >= 0; i--) {
    digitalWrite(PIN_ADXL_MOSI,
                 (data_out & (1 << i)) ? HIGH : LOW);

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

  adxl_spi_transfer((reg << 1) | 0x01);
  uint8_t val = adxl_spi_transfer(0x00);

  digitalWrite(PIN_ADXL_CS, HIGH);

  for (volatile int d = 0; d < 8; d++) __NOP();

  return val;
}

static void adxl_write_reg(uint8_t reg, uint8_t val) {
  digitalWrite(PIN_ADXL_CS, LOW);

  for (volatile int d = 0; d < 8; d++) __NOP();

  adxl_spi_transfer((reg << 1) | 0x00);
  adxl_spi_transfer(val);

  digitalWrite(PIN_ADXL_CS, HIGH);

  for (volatile int d = 0; d < 8; d++) __NOP();
}

static void adxl_read_multi(uint8_t start_reg,
                            uint8_t *dest,
                            size_t count) {
  digitalWrite(PIN_ADXL_CS, LOW);

  for (volatile int d = 0; d < 8; d++) __NOP();

  adxl_spi_transfer((start_reg << 1) | 0x01);

  for (size_t i = 0; i < count; i++) {
    dest[i] = adxl_spi_transfer(0x00);
  }

  digitalWrite(PIN_ADXL_CS, HIGH);

  for (volatile int d = 0; d < 8; d++) __NOP();
}

// ============================================================================
// ADS1220 SPI DRIVER
// ============================================================================

static inline uint8_t ads_spi_transfer(uint8_t data_out) {
  uint8_t data_in = 0;

  for (int i = 7; i >= 0; i--) {
    digitalWrite(PIN_ADS_MOSI,
                 (data_out & (1 << i)) ? HIGH : LOW);

    delayMicroseconds(4);

    digitalWrite(PIN_ADS_SCK, HIGH);

    delayMicroseconds(4);

    if (digitalRead(PIN_ADS_MISO)) {
      data_in |= (1 << i);
    }

    digitalWrite(PIN_ADS_SCK, LOW);

    delayMicroseconds(4);
  }

  return data_in;
}

static void ads_send_cmd(uint8_t cmd) {
  digitalWrite(PIN_ADS_CS, LOW);
  delayMicroseconds(10);

  ads_spi_transfer(cmd);

  delayMicroseconds(10);
  digitalWrite(PIN_ADS_CS, HIGH);
  delayMicroseconds(10);
}

static void ads_write_reg(uint8_t reg, uint8_t val) {
  digitalWrite(PIN_ADS_CS, LOW);
  delayMicroseconds(10);

  ads_spi_transfer(0x40 | ((reg & 0x03) << 2));
  ads_spi_transfer(val);

  delayMicroseconds(10);
  digitalWrite(PIN_ADS_CS, HIGH);
  delayMicroseconds(10);
}

static uint8_t ads_read_reg(uint8_t reg) {
  digitalWrite(PIN_ADS_CS, LOW);
  delayMicroseconds(10);

  ads_spi_transfer(0x20 | ((reg & 0x03) << 2));

  uint8_t val = ads_spi_transfer(0x00);

  delayMicroseconds(10);
  digitalWrite(PIN_ADS_CS, HIGH);
  delayMicroseconds(10);

  return val;
}

// ============================================================================
// PT100 RESISTANCE TO TEMPERATURE
// ============================================================================

static float pt100ResistanceToTemperature(float resistance) {
  if (!isfinite(resistance) ||
      resistance < 18.0f ||
      resistance > 400.0f) {
    return -999.0f;
  }

  float temperature = (resistance - PT100_R0) / 0.385f;

  for (int i = 0; i < 15; i++) {
    float t2 = temperature * temperature;
    float t3 = t2 * temperature;

    float calculatedResistance;
    float derivative;

    if (temperature >= 0.0f) {
      calculatedResistance =
          PT100_R0 *
          (1.0f + PT100_A * temperature + PT100_B * t2);

      derivative =
          PT100_R0 *
          (PT100_A + 2.0f * PT100_B * temperature);
    } else {
      calculatedResistance =
          PT100_R0 *
          (1.0f + PT100_A * temperature +
           PT100_B * t2 +
           PT100_C * (temperature - 100.0f) * t3);

      derivative =
          PT100_R0 *
          (PT100_A + 2.0f * PT100_B * temperature +
           PT100_C * (4.0f * t3 - 300.0f * t2));
    }

    if (!isfinite(derivative) ||
        fabsf(derivative) < 1e-9f) {
      return -999.0f;
    }

    float correction =
        (calculatedResistance - resistance) / derivative;

    temperature -= correction;

    if (fabsf(correction) < 0.0001f) break;
  }

  if (!isfinite(temperature) ||
      temperature < -200.0f ||
      temperature > 850.0f) {
    return -999.0f;
  }

  return temperature;
}

// ============================================================================
// ADS1220 RAW ACQUISITION
// ============================================================================

static int32_t readADS1220Raw() {
  ads_send_cmd(0x08);
  delay(60);

  digitalWrite(PIN_ADS_CS, LOW);
  delayMicroseconds(10);

  ads_spi_transfer(0x10);

  uint8_t b0 = ads_spi_transfer(0x00);
  uint8_t b1 = ads_spi_transfer(0x00);
  uint8_t b2 = ads_spi_transfer(0x00);

  digitalWrite(PIN_ADS_CS, HIGH);
  delayMicroseconds(10);

  int32_t raw =
      ((int32_t)b0 << 16) |
      ((int32_t)b1 << 8) |
      (int32_t)b2;

  if (raw & 0x800000) {
    raw |= 0xFF000000;
  }

  return raw;
}

// ============================================================================
// ADS1220 PT100 ACQUISITION AND CONVERSION
// ============================================================================

static float readExternalPT100() {
  if (!s_ads1220Detected) {
    Serial.println("{\"log\":\"[ADS] Not detected\"}");
    return -999.0f;
  }

  ads_write_reg(0x00, 0x66);
  ads_write_reg(0x01, 0x04);
  ads_write_reg(0x02, 0x55);
  ads_write_reg(0x03, 0x70);

  delay(2);

  int32_t raw = readADS1220Raw();

  uint8_t r0 = ads_read_reg(0x00);
  uint8_t r1 = ads_read_reg(0x01);
  uint8_t r2 = ads_read_reg(0x02);
  uint8_t r3 = ads_read_reg(0x03);

  if (raw <= 0 || raw >= 8388607) {
    Serial.print("{\"log\":\"[PT100] Invalid ADC RAW=");
    Serial.print(raw);
    Serial.println("\"}");
    return -999.0f;
  }

  const float denominator = 4194304.0f * ADS1220_GAIN;

  float rtdResistance =
      ((float)raw * PT100_RREF_OHMS) / denominator;

  float temperature =
      pt100ResistanceToTemperature(rtdResistance);

  Serial.print("{\"log\":\"[PT100] R0=0x");
  Serial.print(r0, HEX);
  Serial.print(" R1=0x");
  Serial.print(r1, HEX);
  Serial.print(" R2=0x");
  Serial.print(r2, HEX);
  Serial.print(" R3=0x");
  Serial.print(r3, HEX);
  Serial.print(" RAW=");
  Serial.print(raw);
  Serial.print(" RRTD=");
  Serial.print(rtdResistance, 4);
  Serial.print(" TEMP=");
  Serial.print(temperature, 2);
  Serial.println("\"}");

  return temperature;
}

// ============================================================================
// ADS1220 INTERNAL TEMPERATURE SENSOR
// ============================================================================

static float readADS1220InternalTemp() {
  if (!s_ads1220Detected) return -999.0f;

  ads_write_reg(0x01, 0x02);

  ads_send_cmd(0x08);
  delay(60);

  digitalWrite(PIN_ADS_CS, LOW);
  delayMicroseconds(10);

  ads_spi_transfer(0x10);

  uint8_t msb = ads_spi_transfer(0x00);
  uint8_t mid = ads_spi_transfer(0x00);

  ads_spi_transfer(0x00);

  digitalWrite(PIN_ADS_CS, HIGH);
  delayMicroseconds(10);

  ads_write_reg(0x01, 0x04);
  ads_send_cmd(0x08);

  int16_t raw14 =
      (int16_t)(((uint16_t)msb << 8) | mid) >> 2;

  if (raw14 & 0x2000) {
    raw14 |= 0xC000;
  }

  float tempInternal = (float)raw14 * 0.03125f;

  if (tempInternal >= -40.0f &&
      tempInternal <= 125.0f &&
      raw14 != 0 &&
      (raw14 & 0x3FFF) != 0x3FFF) {
    return tempInternal;
  }

  return -999.0f;
}

// ============================================================================
// HARDWARE IDENTITY DETECTION
// ============================================================================

static char g_uniqueId[28] = {0};
static char g_friendlyName[48] = {0};

const char *getUniqueBoardId() {
  if (g_uniqueId[0] != '\0') return g_uniqueId;

#if defined(ARDUINO_ARCH_NRF54L15CLEAN)

  uint64_t devId = xiao_nrf54l15::Ficr::deviceId();

  uint32_t high = (uint32_t)(devId >> 32);
  uint32_t low = (uint32_t)(devId & 0xFFFFFFFF);

  snprintf(g_uniqueId, sizeof(g_uniqueId),
           "xiao-%04x%04x",
           (unsigned int)(high & 0xFFFF),
           (unsigned int)(low & 0xFFFF));

#elif defined(ESP32)

  uint64_t chipid = ESP.getEfuseMac();

  uint16_t high = (uint16_t)(chipid >> 32);
  uint32_t low = (uint32_t)chipid;

  snprintf(g_uniqueId, sizeof(g_uniqueId),
           "xiao-%04x%04x",
           (unsigned int)(high & 0xFFFF),
           (unsigned int)(low & 0xFFFF));

#elif defined(ARDUINO_ARCH_RP2040)

  pico_unique_board_id_t pId;
  pico_get_unique_board_id(&pId);

  snprintf(g_uniqueId, sizeof(g_uniqueId),
           "xiao-%02x%02x%02x%02x",
           pId.id[4], pId.id[5], pId.id[6], pId.id[7]);

#elif defined(ARDUINO_ARCH_SAMD)

  volatile uint32_t *p = (volatile uint32_t *)0x0080A00C;

  snprintf(g_uniqueId, sizeof(g_uniqueId),
           "xiao-%04x",
           (unsigned int)(*p & 0xFFFF));

#else

  snprintf(g_uniqueId, sizeof(g_uniqueId),
           "xiao-%04x",
           (unsigned int)random(0x1000, 0xFFFF));

#endif

  return g_uniqueId;
}

const char *getBoardFriendlyName(const char *uniqueId) {
  if (g_friendlyName[0] != '\0') return g_friendlyName;

  const char *suffix = uniqueId;

  if (strncmp(suffix, "xiao-", 5) == 0) {
    suffix += 5;
  }

  char upperSuffix[24] = {0};
  size_t i = 0;

  for (; suffix[i] != '\0' &&
         i < sizeof(upperSuffix) - 1; i++) {
    char c = suffix[i];

    if (c >= 'a' && c <= 'z') c -= 32;

    upperSuffix[i] = c;
  }

  upperSuffix[i] = '\0';

  snprintf(g_friendlyName, sizeof(g_friendlyName),
           "Sensor Node (%s)", upperSuffix);

  return g_friendlyName;
}

// ============================================================================
// BATTERY MONITORING - XIAO nRF54L15 CORE 1.0.22
// Diagnostic version
// ============================================================================

static int g_batteryRaw = -1;
static float g_batteryDividerVolts = -1.0f;
static float g_batteryVoltage = -1.0f;

static float readBatteryVoltage() {

  // Enable battery divider control.
  pinMode(VBAT_EN, OUTPUT);

  // Disable divider before measurement.
  digitalWrite(VBAT_EN, LOW);

  // Enable divider.
  digitalWrite(VBAT_EN, HIGH);

  // Allow voltage to settle.
  delay(5);

  // Read battery ADC.
  g_batteryRaw = analogRead(VBAT_READ);

  // Disable divider after reading.
  digitalWrite(VBAT_EN, LOW);

  // The official example uses a 10-bit ADC scale (0-1023).
  // Do not treat values outside that range as valid measurements.
  if (g_batteryRaw < 0 || g_batteryRaw > 1023) {
    g_batteryDividerVolts = -1.0f;
    g_batteryVoltage = -1.0f;
    return -1.0f;
  }

  // Official XIAO example voltage conversion.
  g_batteryDividerVolts =
      (3.6f * (float)g_batteryRaw) / 1023.0f;

  // Board divider ratio is 2:1.
  g_batteryVoltage = g_batteryDividerVolts * 2.0f;

  return g_batteryVoltage;
}

int readBatteryPercentage() {

  float voltage = readBatteryVoltage();

  int pct = -1;

  if (voltage >= 0.0f) {

    // Approximate mapping, not a calibrated fuel gauge.
    pct = (int)(
        ((voltage - 2.5f) / (3.3f - 2.5f)) * 100.0f
    );

    pct = constrain(pct, 0, 100);
  }

  // Battery diagnostic log.
  Serial.print("{\"log\":\"[BATTERY] RAW=");
  Serial.print(g_batteryRaw);

  if (voltage >= 0.0f) {

    Serial.print(" ADC=");
    Serial.print(g_batteryDividerVolts, 3);

    Serial.print("V VBAT=");
    Serial.print(g_batteryVoltage, 3);

    Serial.print("V PERCENT=");
    Serial.print(pct);

  } else {

    Serial.print(" ADC=INVALID VBAT=INVALID PERCENT=-1");
  }

  Serial.println("\"}");

  return pct;
}

// ============================================================================
// SENSOR FILTERING AND ACQUISITION
// ============================================================================

static float s_smoothTemp = 0.0f;
static bool s_tempInitialized = false;

static float s_gravX = 0.0f;
static float s_gravY = 0.0f;

static uint16_t s_gravSampleCount = 0;

void readAllSensors(float &vx,
                    float &vy,
                    float &ax,
                    float &ay,
                    int &rpm,
                    float &temp) {

  uint8_t raw[8] = {0};

  adxl_read_multi(ADXL38X_XDATA_H, raw, 8);

  int16_t rawX = (int16_t)((raw[0] << 8) | raw[1]);
  int16_t rawY = (int16_t)((raw[2] << 8) | raw[3]);

  // ADXL382 15g range: 2000 LSB/g.
  float raw_ax = ((float)rawX / 2000.0f) * 9.80665f;
  float raw_ay = ((float)rawY / 2000.0f) * 9.80665f;

  // Gravity isolation.
  s_gravSampleCount++;

  if (s_gravSampleCount <= 5) {
    float alpha = 1.0f / (float)s_gravSampleCount;

    s_gravX = s_gravX * (1.0f - alpha) + raw_ax * alpha;
    s_gravY = s_gravY * (1.0f - alpha) + raw_ay * alpha;

  } else {

    s_gravX = 0.97f * s_gravX + 0.03f * raw_ax;
    s_gravY = 0.97f * s_gravY + 0.03f * raw_ay;
  }

  // Dynamic acceleration.
  float dynX = raw_ax - s_gravX;
  float dynY = raw_ay - s_gravY;

  float dynamicMotion = sqrtf(dynX * dynX + dynY * dynY);

  ax = dynX;
  ay = dynY;

  // Vibration velocity approximation at 25 Hz.
  const float twoPiF = 2.0f * 3.14159f * 25.0f;

  vx = fabsf(dynX) / twoPiF;
  vy = fabsf(dynY) / twoPiF;

  // RPM activity estimate (not a direct RPM measurement).
  if (s_gravSampleCount <= 5) {
    rpm = 0;
  } else if (dynamicMotion >= 0.25f) {
    rpm = 1480;
  } else {
    rpm = 0;
  }

  // PT100 temperature acquisition.
  float pt100 = readExternalPT100();

  if (pt100 >= -50.0f && pt100 <= 200.0f) {

    if (!s_tempInitialized) {
      s_smoothTemp = pt100;
      s_tempInitialized = true;
    } else {
      s_smoothTemp =
          (TEMP_FILTER_ALPHA * pt100) +
          ((1.0f - TEMP_FILTER_ALPHA) * s_smoothTemp);
    }

    temp = s_smoothTemp;

  } else {

    temp = -999.0f;
  }
}

// ============================================================================
// TELEMETRY FORMATTING
// ============================================================================

static void formatFloat(char *dest,
                        size_t destSize,
                        float val,
                        int decimals) {

  bool neg = (val < 0.0f);

  if (neg) val = -val;

  int intPart = (int)val;
  float diff = val - (float)intPart;

  int multiplier = 1;

  for (int i = 0; i < decimals; i++) {
    multiplier *= 10;
  }

  int fracPart = (int)(diff * multiplier + 0.5f);

  if (fracPart >= multiplier) {
    intPart++;
    fracPart = 0;
  }

  if (neg) {
    snprintf(dest, destSize, "-%d.%0*d",
             intPart, decimals, fracPart);
  } else {
    snprintf(dest, destSize, "%d.%0*d",
             intPart, decimals, fracPart);
  }
}

static void emitTelemetryPayload(const char *assetId,
                                 const char *assetName,
                                 float vx,
                                 float vy,
                                 float ax,
                                 float ay,
                                 float temp,
                                 int rpm,
                                 int battery) {

  char strVx[12];
  char strVy[12];
  char strAx[12];
  char strAy[12];
  char strTemp[12];

  formatFloat(strVx, sizeof(strVx), vx, 4);
  formatFloat(strVy, sizeof(strVy), vy, 4);
  formatFloat(strAx, sizeof(strAx), ax, 4);
  formatFloat(strAy, sizeof(strAy), ay, 4);
  formatFloat(strTemp, sizeof(strTemp), temp, 1);

  char buf[160];

  int n = snprintf(
      buf,
      sizeof(buf),
      "{\"id\":\"%s\",\"name\":\"%s\",\"vx\":%s,\"vy\":%s,"
      "\"ax\":%s,\"ay\":%s,\"t\":%s,\"rpm\":%d,\"bat\":%d}\n",
      assetId,
      assetName,
      strVx,
      strVy,
      strAx,
      strAy,
      strTemp,
      rpm,
      battery
  );

  if (n <= 0 || n >= (int)sizeof(buf)) return;

  // USB Serial telemetry.
  if (Serial) {
    Serial.write((const uint8_t *)buf, (size_t)n);
  }

  // BLE Nordic UART Service telemetry.
#if HAS_BLE
  if (Bluefruit.connected() && bleuart.notifyEnabled()) {
    bleuart.write((const uint8_t *)buf, (size_t)n);
    bleuart.flushTXD();
  }
#endif
}

// ============================================================================
// ASSET IDENTITY
// ============================================================================

static const char *g_effectiveAssetId = ASSET_ID;
static const char *g_effectiveAssetName = ASSET_NAME;

// ============================================================================
// BLE CALLBACKS
// ============================================================================

#if HAS_BLE

void connectCallback(uint16_t conn_handle) {
  if (Serial) {
    Serial.println("{\"log\":\"[BLE] Central connected!\"}");
  }
}

void disconnectCallback(uint16_t conn_handle, uint8_t reason) {
  if (Serial) {
    Serial.print("{\"log\":\"[BLE] Central disconnected, reason=0x");
    Serial.print(reason, HEX);
    Serial.println("\"}");
  }
}

#endif

// ============================================================================
// SETUP
// ============================================================================

void setup() {

  Serial.begin(BAUD_RATE);

  // 1. Power sensor rails.
  pinMode(PIN_LOAD_SWITCH, OUTPUT);
  digitalWrite(PIN_LOAD_SWITCH, HIGH);

  delay(150);

  // 2. Configure shared SPI pins.
  pinMode(PIN_ADXL_CS, OUTPUT);
  digitalWrite(PIN_ADXL_CS, HIGH);

  pinMode(PIN_ADS_CS, OUTPUT);
  digitalWrite(PIN_ADS_CS, HIGH);

  pinMode(PIN_ADXL_SCK, OUTPUT);
  digitalWrite(PIN_ADXL_SCK, LOW);

  pinMode(PIN_ADXL_MOSI, OUTPUT);
  digitalWrite(PIN_ADXL_MOSI, LOW);

  pinMode(PIN_ADXL_MISO, INPUT);

  // 3. Reset and configure ADXL382.
  adxl_write_reg(ADXL38X_REG_RESET, 0x52);
  delay(20);

  adxl_write_reg(ADXL38X_OP_MODE, 0x00);
  delay(5);

  adxl_write_reg(ADXL38X_DIG_EN, 0xF0);
  delay(5);

  adxl_write_reg(ADXL38X_OP_MODE, 0x0C);
  delay(200);

  s_adxl382Detected = true;

  // 4. Reset and configure ADS1220.
  ads_send_cmd(0x06);
  delay(15);

  ads_write_reg(0x00, 0x66);
  delay(2);

  ads_write_reg(0x01, 0x04);
  delay(2);

  ads_write_reg(0x02, 0x55);
  delay(2);

  ads_write_reg(0x03, 0x70);
  delay(2);

  ads_send_cmd(0x08);

  s_ads1220Detected = true;

  // 5. Resolve hardware identity.
  if (strcmp(g_effectiveAssetId, "auto") == 0 ||
      strlen(g_effectiveAssetId) == 0) {

    g_effectiveAssetId = getUniqueBoardId();
  }

  if (strcmp(g_effectiveAssetName, "auto") == 0 ||
      strlen(g_effectiveAssetName) == 0) {

    g_effectiveAssetName =
        getBoardFriendlyName(g_effectiveAssetId);
  }

  // 6. Initialize BLE.
#if HAS_BLE

  Bluefruit.begin();

  char bleAdvName[32];

  snprintf(bleAdvName, sizeof(bleAdvName),
           "IAA-%s", g_effectiveAssetId);

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

  Bluefruit.Advertising.addFlags(
      BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);

  Bluefruit.Advertising.addService(bleuart);
  Bluefruit.Advertising.addName();

  Bluefruit.ScanResponse.addName();

  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244);
  Bluefruit.Advertising.start(0);

#endif

  // 7. Startup message.
  if (Serial) {

    Serial.print("{\"log\":\"[XIAO] Online as ");
    Serial.print(g_effectiveAssetName);

    Serial.print(" (ID: ");
    Serial.print(g_effectiveAssetId);

    Serial.println(
        "). Starting continuous live telemetry...\""
    );
  }
}

// ============================================================================
// MAIN LOOP
// ============================================================================

static unsigned long lastSampleTime = 0;

void loop() {

  unsigned long now = millis();

  if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {

    lastSampleTime = now;

    float vx = 0.0f;
    float vy = 0.0f;

    float ax = 0.0f;
    float ay = 0.0f;

    float temp = -999.0f;

    int rpm = 0;

    // Read accelerometer and PT100.
    readAllSensors(vx, vy, ax, ay, rpm, temp);

    // Read battery and print diagnostic information.
    int battery = readBatteryPercentage();

    // Send telemetry to Serial and BLE.
    emitTelemetryPayload(
        g_effectiveAssetId,
        g_effectiveAssetName,
        vx,
        vy,
        ax,
        ay,
        temp,
        rpm,
        battery
    );
  }

  yield();
}
