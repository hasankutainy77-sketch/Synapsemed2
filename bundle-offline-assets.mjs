import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const wwwDir = path.join(rootDir, 'www');
const vendorDir = path.join(wwwDir, 'vendor');

try {
if (!fs.existsSync(wwwDir)) {
throw new Error('www directory does not exist. Prepare web assets first.');
}

fs.mkdirSync(vendorDir, { recursive: true });

// 1. Locate Three.js r128
const threeSrc = path.join(
    rootDir,
    'node_modules',
    'three',
    'build',
    'three.min.js'
);

const threeDest = path.join(vendorDir, 'three.min.js');

if (!fs.existsSync(threeSrc)) {
    throw new Error(
        'Three.js not found. Make sure three@0.128.0 is installed.'
    );
}

// 2. Copy Three.js locally
fs.copyFileSync(threeSrc, threeDest);

console.log('[Offline Bundler] Three.js copied successfully.');

// 3. Rewrite CDN links in HTML files
const htmlFiles = fs.readdirSync(wwwDir)
    .filter(file => file.toLowerCase().endsWith('.html'));

const cdnRegex =
    /https?:\/\/[^"' \t\r\n>]*three(?:\.min)?\.js(?:\?[^"' \t\r\n>]*)?/gi;

for (const file of htmlFiles) {
    const fullPath = path.join(wwwDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    const updatedContent = content.replace(
        cdnRegex,
        'vendor/three.min.js'
    );

    if (updatedContent !== content) {
        fs.writeFileSync(fullPath, updatedContent, 'utf8');
        console.log(`[Offline Bundler] Updated ${file}`);
    }
}

console.log('[Offline Bundler] Offline preparation completed.');

} catch (error) {
console.error('[Offline Bundler] ERROR:', error.message);
process.exit(1);
}
