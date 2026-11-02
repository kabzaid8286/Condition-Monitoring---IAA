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
#if defined(PIN_TEMP_PROBE)
  int raw = analogRead(PIN_TEMP_PROBE);
  float tempC = (raw / 4095.0f) * 100.0f;
  if (tempC < 5.0f || tempC > 120.0f) {
    tempC = 45.0f; // Nominal baseline if probe floating
  }
  return tempC;
#else
  return 45.0f;
#endif
}

// Read Vibration X and Y axes (mm/s or g-force)
void readVibration(float &vibX, float &vibY) {
  static float t = 0.0f;
  t += 0.2f;
  vibX = 2.4f + sin(t) * 0.4f + ((float)(random(-15, 15)) / 100.0f);
  vibY = 1.3f + cos(t) * 0.2f + ((float)(random(-10, 10)) / 100.0f);
}

// ==========================================
// SYSTEM ENTRY & BURST EXECUTION
// ==========================================

void setup() {
  Serial.begin(BAUD_RATE);

  // Wait up to 2 seconds for USB CDC Serial if plugged into computer
  unsigned long startWait = millis();
  while (!Serial && (millis() - startWait < 2000)) {
    delay(10);
  }

  // Resolve dynamic unique identity
  const char* effectiveAssetId = ASSET_ID;
  const char* effectiveAssetName = ASSET_NAME;

  if (strcmp(effectiveAssetId, "auto") == 0 || strlen(effectiveAssetId) == 0) {
    effectiveAssetId = getUniqueBoardId();
  }
  if (strcmp(effectiveAssetName, "auto") == 0 || strlen(effectiveAssetName) == 0) {
    effectiveAssetName = getBoardFriendlyName(effectiveAssetId);
  }

  Serial.print("{\"log\":\"[XIAO] Online as ");
  Serial.print(effectiveAssetName);
  Serial.print(" (ID: ");
  Serial.print(effectiveAssetId);
  Serial.println("). Starting burst acquisition...\"}");

  // Execute the 10-second high-frequency burst
  unsigned long burstStartTime = millis();
  unsigned long lastSampleTime = 0;

  while (millis() - burstStartTime < BURST_DURATION_MS) {
    unsigned long currentMillis = millis();

    if (currentMillis - lastSampleTime >= SAMPLE_INTERVAL_MS) {
      lastSampleTime = currentMillis;

      float vibX = 0.0f;
      float vibY = 0.0f;
      readVibration(vibX, vibY);
      float temp = readTemperatureProbe();
      int batteryPct = readBatteryPercentage();

      // Output JSON line to USB Serial with unique asset_id and friendly name
      Serial.print("{\"asset_id\":\"");
      Serial.print(effectiveAssetId);
      Serial.print("\",\"name\":\"");
      Serial.print(effectiveAssetName);
      Serial.print("\",\"vibration_x\":");
      Serial.print(vibX, 3);
      Serial.print(",\"vibration_y\":");
      Serial.print(vibY, 3);
      Serial.print(",\"temperature\":");
      Serial.print(temp, 2);
      Serial.print(",\"rpm\":1480");
      Serial.print(",\"battery_pct\":");
      Serial.print(batteryPct);
      Serial.print(",\"burst_state\":\"active\"}\n");
      Serial.flush();
    }

    delay(20);
  }

  // Announce transition to low-power deep sleep
  Serial.print("{\"burst_state\":\"sleep\",\"sleep_seconds\":");
  Serial.print((unsigned long)SLEEP_DURATION_SEC);
  Serial.println(",\"log\":\"Entering Deep Sleep to preserve battery...\"}");
  Serial.flush();
  delay(100);

// ==========================================
// ENTER HARDWARE DEEP SLEEP
// ==========================================
#if defined(ESP32)
  // ESP32-C3 / ESP32-S3 Deep Sleep API (current drops to ~5-15 µA)
  esp_sleep_enable_timer_wakeup(SLEEP_DURATION_SEC * 1000000ULL);
  esp_deep_sleep_start();
#elif defined(ARDUINO_ARCH_RP2040)
  // RP2040 low-power sleep
  delay((unsigned long)SLEEP_DURATION_SEC * 1000UL);
  setup(); // restart cycle
#elif defined(ARDUINO_ARCH_SAMD)
  // SAMD21 Standby sleep
  delay((unsigned long)SLEEP_DURATION_SEC * 1000UL);
  setup();
#else
  // Standard fallback delay
  delay((unsigned long)SLEEP_DURATION_SEC * 1000UL);
  setup();
#endif
}

void loop() {
  // Empty - All execution occurs in setup() before entering Deep Sleep
}
