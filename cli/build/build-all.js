#!/usr/bin/env node
/**
 * JSON Toolbox CLI - Cross-Platform Build Script
 * Creates standalone binaries for Windows, macOS, and Linux
 * 
 * Prerequisites:
 * - Node.js 18+ (for bundling)
 * - Deno (optional, for Deno compile)
 * - Bun (optional, for Bun compile)
 * 
 * Usage: node build-all.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Ensure dist directory
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('='.repeat(60));
console.log('JSON Toolbox CLI - Build System');
console.log('Version: 2.0.0');
console.log('='.repeat(60));
console.log('');

// Step 1: Create bundle
console.log('[1/5] Creating JavaScript bundle...');
try {
  execSync('node bundle.js --output ../dist/jsontb.js', {
    cwd: __dirname,
    stdio: 'inherit'
  });
} catch (e) {
  console.error('Bundle creation failed:', e.message);
  process.exit(1);
}

// Step 2: Verify bundle
console.log('[2/5] Verifying bundle...');
const bundlePath = path.join(distDir, 'jsontb.js');
if (!fs.existsSync(bundlePath)) {
  console.error('Bundle not found at:', bundlePath);
  process.exit(1);
}

// Test bundle with Node.js
try {
  const result = spawnSync('node', [bundlePath, 'version'], {
    encoding: 'utf8',
    timeout: 5000
  });
  if (result.status !== 0) {
    console.error('Bundle verification failed');
    console.error(result.stderr);
    process.exit(1);
  }
  console.log('  Bundle OK:', result.stdout.trim());
} catch (e) {
  console.error('Bundle verification error:', e.message);
}

// Step 3: Create platform binaries (if compilers available)
console.log('');
console.log('[3/5] Creating platform binaries...');

const binaries = [];

// Try Deno compile
function tryDenoCompile() {
  const targets = [
    { target: 'x86_64-unknown-linux-gnu', output: 'jsontb-linux-x64' },
    { target: 'aarch64-unknown-linux-gnu', output: 'jsontb-linux-arm64' },
    { target: 'x86_64-apple-darwin', output: 'jsontb-macos-x64' },
    { target: 'aarch64-apple-darwin', output: 'jsontb-macos-arm64' },
    { target: 'x86_64-pc-windows-msvc', output: 'jsontb-windows-x64.exe' }
  ];

  for (const { target, output } of targets) {
    const outputPath = path.join(distDir, output);
    console.log('  Deno compile:', output, '...');

    try {
      execSync(
        `deno compile --allow-read --allow-write --target ${target} --output "${outputPath}" "${bundlePath}"`,
        { stdio: 'pipe', timeout: 120000 }
      );
      binaries.push({ name: output, path: outputPath });
      console.log('    [OK]');
    } catch (e) {
      console.log('    [SKIP] Deno not available or target not supported');
      break; // If one fails, likely Deno is not installed
    }
  }
}

// Try Bun compile
function tryBunCompile() {
  const targets = [
    { target: 'bun-linux-x64', output: 'jsontb-bun-linux-x64' },
    { target: 'bun-linux-arm64', output: 'jsontb-bun-linux-arm64' },
    { target: 'bun-darwin-x64', output: 'jsontb-bun-macos-x64' },
    { target: 'bun-darwin-arm64', output: 'jsontb-bun-macos-arm64' },
    { target: 'bun-windows-x64', output: 'jsontb-bun-windows-x64.exe' }
  ];

  for (const { target, output } of targets) {
    const outputPath = path.join(distDir, output);
    console.log('  Bun compile:', output, '...');

    try {
      execSync(
        `bun build --compile --target ${target} --outfile "${outputPath}" "${bundlePath}"`,
        { stdio: 'pipe', timeout: 120000 }
      );
      binaries.push({ name: output, path: outputPath });
      console.log('    [OK]');
    } catch (e) {
      console.log('    [SKIP] Bun not available or target not supported');
      break;
    }
  }
}

// Only try compilers if they're available
try {
  execSync('deno --version', { stdio: 'pipe' });
  tryDenoCompile();
} catch (e) {
  console.log('  [SKIP] Deno not installed');
}

try {
  execSync('bun --version', { stdio: 'pipe' });
  tryBunCompile();
} catch (e) {
  console.log('  [SKIP] Bun not installed');
}

// Step 4: Generate checksums
console.log('');
console.log('[4/5] Generating SHA256 checksums...');

const checksums = [];
const filesToChecksum = [
  { name: 'jsontb.js', path: bundlePath },
  ...binaries
];

for (const file of filesToChecksum) {
  if (!fs.existsSync(file.path)) continue;

  const content = fs.readFileSync(file.path);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  checksums.push({ name: file.name, hash });
  console.log('  ' + hash + '  ' + file.name);
}

// Write checksums file
const checksumContent = checksums.map(c => c.hash + '  ' + c.name).join('\n') + '\n';
fs.writeFileSync(path.join(distDir, 'SHA256SUMS.txt'), checksumContent);
console.log('  Written to: dist/SHA256SUMS.txt');

// Step 5: Create WASM bundle info
console.log('');
console.log('[5/5] Creating release manifest...');

const manifest = {
  name: 'jsontb',
  version: '2.0.0',
  description: 'JSON Toolbox CLI - Deterministic data transformation pipelines',
  license: 'MIT',
  buildDate: new Date().toISOString(),
  platform: process.platform,
  artifacts: [
    {
      name: 'jsontb.js',
      type: 'bundle',
      runtime: ['node', 'deno', 'bun'],
      size: fs.statSync(bundlePath).size
    },
    ...binaries.map(b => ({
      name: b.name,
      type: 'binary',
      size: fs.existsSync(b.path) ? fs.statSync(b.path).size : 0
    }))
  ],
  checksums: checksums,
  operators: {
    total: 42,
    namespaces: ['json', 'csv', 'xml', 'yaml', 'transform', 'diff', 'fix', 'schema', 'query']
  }
};

fs.writeFileSync(
  path.join(distDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('  Written to: dist/manifest.json');

// Summary
console.log('');
console.log('='.repeat(60));
console.log('BUILD COMPLETE');
console.log('='.repeat(60));
console.log('');
console.log('Artifacts:');
console.log('  dist/jsontb.js          - Universal bundle (Node/Deno/Bun)');
binaries.forEach(b => {
  console.log('  dist/' + b.name.padEnd(22) + ' - Standalone binary');
});
console.log('  dist/SHA256SUMS.txt     - Checksums');
console.log('  dist/manifest.json      - Release manifest');
console.log('');
console.log('Quick start:');
console.log('  node dist/jsontb.js help');
console.log('  echo \'{"test":1}\' | node dist/jsontb.js exec json.format');
console.log('');
