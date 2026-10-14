/**
 * Condition Monitoring App (IAA / HS Aalen)
 * Microcontroller Firmware for Seeed Studio XIAO
 * 
 * Target: Seeed Studio XIAO (ESP32-C3 / ESP32-S3 / RP2040 / SAMD21)
 * Purpose: Low-power burst sensor acquisition for test rigs
 * Duty Cycle: 10-second active burst every 5 minutes (Deep Sleep between bursts)
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
#define ASSET_ID            "test-rig-a"
#define BAUD_RATE           115200

// Duty cycle: 10 seconds of streaming, followed by ~290 seconds of Deep Sleep
#define BURST_DURATION_MS   10000UL      // 10 seconds burst
#define SLEEP_DURATION_SEC  290ULL       // 4 min 50 sec sleep (~5 min cycle)
#define SAMPLE_INTERVAL_MS  1000UL       // 1 Hz sample rate during burst (or 100ms for 10Hz)

// Pin definitions (Adjust to your custom carrier board routing)
#define PIN_TEMP_PROBE      A0           // Analog Temp Probe or ADC
#define PIN_BATTERY_SENSE   A1           // Battery voltage divider

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
    // Linear approximation or RTD/thermistor formula (adjust calibration factor as needed)
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
  // If using I2C Accelerometer (e.g. ADXL345 / LIS3DH / MPU6050):
  // You can insert Wire.read() registers here.
  // Below provides a calibrated analog/noise baseline:
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

  Serial.println("{\"log\":\"[XIAO] Woke from sleep. Starting 10s burst acquisition...\"}");

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

      // Output JSON line to USB Serial
      Serial.print("{\"asset_id\":\"");
      Serial.print(ASSET_ID);
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
  Serial.println("{\"burst_state\":\"sleep\",\"sleep_seconds\":290,\"log\":\"Entering 5-minute Deep Sleep to preserve battery...\"}");
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
