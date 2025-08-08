#!/usr/bin/env node

/**
 * Script to find your local IP address for mobile development
 * Run this with: node scripts/get-ip.js
 */

const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  console.log('\n🔍 Finding your local IP address for mobile development...\n');
  
  for (const interfaceName of Object.keys(interfaces)) {
    const networkInterface = interfaces[interfaceName];
    
    for (const connection of networkInterface) {
      // Skip internal (loopback) addresses and IPv6
      if (connection.family === 'IPv4' && !connection.internal) {
        console.log(`✅ Found IP address: ${connection.address}`);
        console.log(`   Interface: ${interfaceName}`);
        
        // This is likely your main IP address
        if (interfaceName.toLowerCase().includes('wi-fi') || 
            interfaceName.toLowerCase().includes('wifi') ||
            interfaceName.toLowerCase().includes('wireless') ||
            interfaceName.toLowerCase().includes('en0') ||
            interfaceName.toLowerCase().includes('wlan')) {
          console.log(`   👆 This is likely your WiFi IP address\n`);
          
          console.log('📝 To use this IP address:');
          console.log(`1. Update services/auth.ts line 61:`);
          console.log(`   this.baseUrl = 'http://${connection.address}:5090/api';`);
          console.log(`\n2. Make sure your Flask backend is running on: http://${connection.address}:5090`);
          console.log(`\n3. Test the connection by opening: http://${connection.address}:5090/api/auth/profile`);
          
          return connection.address;
        }
      }
    }
  }
  
  console.log('❌ Could not find a suitable IP address');
  console.log('💡 Make sure you\'re connected to WiFi and try running this script again');
  return null;
}

// Run the script
const ip = getLocalIPAddress();

if (!ip) {
  console.log('\n🔧 Manual method:');
  console.log('Run one of these commands in your terminal:');
  console.log('• macOS/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1');
  console.log('• Windows: ipconfig | findstr "IPv4"');
}