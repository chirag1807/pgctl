#!/usr/bin/env node

/**
 * Build script for creating executables
 * This script can be run directly: node build.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { existsSync, mkdirSync } = require('fs');

const execAsync = promisify(exec);

const TARGETS = [
  { name: 'Windows x64', target: 'node18-win-x64', output: 'postgres-db-ops-win.exe' },
  { name: 'macOS x64', target: 'node18-macos-x64', output: 'postgres-db-ops-macos' },
  { name: 'macOS ARM64', target: 'node18-macos-arm64', output: 'postgres-db-ops-macos-arm64' },
  { name: 'Linux x64', target: 'node18-linux-x64', output: 'postgres-db-ops-linux' }
];

console.log('🔨 PostgreSQL DB Ops - Build Script\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Create build directory if it doesn't exist
if (!existsSync('./build')) {
  console.log('📁 Creating build directory...');
  mkdirSync('./build');
}

console.log('Building executables for all platforms...\n');

async function build() {
  const targets = TARGETS.map(t => t.target).join(',');
  const command = `pkg . --targets ${targets} --out-path ./build`;
  
  console.log(`Running: ${command}\n`);
  
  try {
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 1024 * 1024 * 10 });
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('Warning')) console.error(stderr);
    
    console.log('\n✅ Build completed successfully!\n');
    console.log('📦 Built executables:');
    TARGETS.forEach(t => {
      console.log(`   - build/${t.output} (${t.name})`);
    });
    
    console.log('\n💡 Tip: Don\'t forget to include a .env file when distributing!');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    
    if (error.message.includes('pkg') || error.message.includes('command not found')) {
      console.log('\n💡 Make sure pkg is installed:');
      console.log('   npm install -g pkg');
    }
    
    if (error.message.includes('spawn') || error.message.includes('UNKNOWN')) {
      console.log('\n💡 This might be a permissions or PATH issue.');
      console.log('   Try reinstalling pkg:');
      console.log('   npm uninstall -g pkg && npm install -g pkg');
    }
    
    process.exit(1);
  }
}

build();
