/**
 * Bootstrap: Download npm, install deps, run dev server
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync, spawn } = require('child_process');

const NODE = process.execPath;
const NODE_DIR = path.dirname(NODE);
const PROJECT = 'C:\\Users\\user\\Desktop\\BMW';
const NPM_DIR = path.join(PROJECT, '.npm-bootstrap');
const NPM_CLI = path.join(NPM_DIR, 'npm', 'bin', 'npm-cli.js');

// Prepend node directory to PATH so subprocesses can find 'node'
const ENV = { ...process.env, PATH: NODE_DIR + ';' + process.env.PATH };

function get(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return get(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

function extractTgz(tgzPath, destDir) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(destDir, { recursive: true });
    const inp = fs.createReadStream(tgzPath);
    const gz = zlib.createGunzip();
    // Simple tar extraction for npm
    const { execSync } = require('child_process');
    // Use tar if available
    try {
      execSync(`tar -xzf "${tgzPath}" -C "${destDir}"`, { stdio: 'inherit' });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

async function main() {
  if (!fs.existsSync(NPM_CLI)) {
    console.log('📦 Bootstrapping npm...');
    fs.mkdirSync(NPM_DIR, { recursive: true });
    const tgz = path.join(NPM_DIR, 'npm.tgz');
    await get('https://registry.npmjs.org/npm/-/npm-10.9.2.tgz', tgz);
    await extractTgz(tgz, NPM_DIR);
    // npm extracts to "package" folder, rename
    const extracted = path.join(NPM_DIR, 'package');
    if (fs.existsSync(extracted)) {
      fs.renameSync(extracted, path.join(NPM_DIR, 'npm'));
    }
    console.log('✅ npm bootstrapped');
  }

  console.log('📦 Installing dependencies...');
  execFileSync(NODE, [NPM_CLI, 'install', '--prefer-offline'], {
    cwd: PROJECT,
    stdio: 'inherit',
    env: ENV
  });

  console.log('🚀 Starting dev server...');
  const vite = spawn(NODE, [NPM_CLI, 'run', 'dev'], {
    cwd: PROJECT,
    stdio: 'inherit',
    env: ENV
  });
  vite.on('exit', code => process.exit(code));
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
