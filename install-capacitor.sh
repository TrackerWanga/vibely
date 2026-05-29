#!/bin/bash
cd ~/vibely

# Install Capacitor core
npm install @capacitor/core@5 @capacitor/cli@5 @capacitor/android@5

# Plugins for offline, background, network detection
npm install @capacitor/filesystem@5 @capacitor/preferences@5 @capacitor/share@5
npm install @capacitor/network@5 @capacitor/app@5 @capacitor/status-bar@5
npm install @capacitor/haptics@5 @capacitor/device@5 @capacitor/local-notifications@5
npm install @capacitor/splash-screen@5

echo "✅ Capacitor plugins installed"
