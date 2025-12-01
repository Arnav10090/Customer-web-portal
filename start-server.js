#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

// Get the local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
const port = process.env.PORT || 3000;

console.log('\n╔═══════════════════════════════════════════╗');
console.log('║   Customer Web Portal Starting...        ║');
console.log('╠═══════════════════════════════════════════╣');
console.log(`║   Local:     http://localhost:${port}`.padEnd(43) + '║');
console.log(`║   Network:   http://${localIP}:${port}`.padEnd(43) + '║');
console.log('╠═══════════════════════════════════════════╣');
console.log('║   Press Ctrl+C to stop                   ║');
console.log('╚═══════════════════════════════════════════╝\n');

// Start react-scripts
const child = spawn('react-scripts', ['start'], {
  stdio: 'inherit',
  shell: true,
});

child.on('error', (error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});
