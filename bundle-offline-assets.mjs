import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const wwwDir = path.join(rootDir, 'www');
const vendorDir = path.join(wwwDir, 'vendor');

fs.mkdirSync(vendorDir, { recursive: true });

// 1. Copy three.min.js (r128) from node_modules/three/build/three.min.js into www/vendor/three.min.js
const threeSrc = path.join(rootDir, 'node_modules', 'three', 'build', 'three.min.js');
const threeDest = path.join(vendorDir, 'three.min.js');

if (fs.existsSync(threeSrc)) {
  fs.copyFileSync(threeSrc, threeDest);
  console.log('[Offline Bundler] Copied three.js r128 to www/vendor/three.min.js');
} else {
  console.warn('[Offline Bundler] node_modules/three/build/three.min.js not found; keeping existing www/vendor/three.min.js');
}

// 2. Rewrite any remote CDN links for three.js inside www/*.html to local vendor/three.min.js
const htmlFiles = fs.readdirSync(wwwDir).filter(f => f.endsWith('.html'));
const cdnRegex = /https?:\/\/[^"'\s>]*three(\.min)?\.js/gi;

for (const file of htmlFiles) {
  const fullPath = path.join(wwwDir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  if (cdnRegex.test(content)) {
    content = content.replace(cdnRegex, 'vendor/three.min.js');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`[Offline Bundler] Rewrote Three.js CDN URL to local vendor/three.min.js in ${file}`);
  }
}
