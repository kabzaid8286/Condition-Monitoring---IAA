#!/usr/bin/env bash
set -e

echo "=================================================="
echo "🍓 IAA Raspberry Pi 5 Gateway Auto-Setup Script"
echo "=================================================="

# Update and install system Bluetooth and Python libraries
echo "[1/4] Installing system dependencies (Bluetooth, Python venv, BlueZ)..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv bluez libbluetooth-dev

# Setup Python Virtual Environment
echo "[2/4] Setting up dedicated Python virtual environment..."
cd "$(dirname "$0")"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Install Python requirements
echo "[3/4] Installing Python libraries (bleak, paho-mqtt, pyserial)..."
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# Grant Python binary raw Bluetooth capabilities (non-root BLE scanning)
echo "[4/4] Granting non-root Bluetooth capabilities..."
sudo setcap 'cap_net_raw,cap_net_admin+eip' "$(readlink -f ./venv/bin/python3)"

echo "=================================================="
echo "✅ Raspberry Pi 5 Gateway setup complete!"
echo ""
echo "To test manually, run:"
echo "  ./venv/bin/python3 rpi_publisher.py --host <SERVER_IP> --port 1883 --mode auto"
echo ""
echo "To install as a background service on boot:"
echo "  sudo cp condition-monitor-gateway.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable --now condition-monitor-gateway"
echo "=================================================="
