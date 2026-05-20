const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('./temp_raw.md', 'utf8');
let content = raw;

// 1. Extract base64 images to files
const imgDir = './每天习题背诵_assets';
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

let imgIndex = 0;
content = content.replace(/!\[([^\]]*)\]\(data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/=]+)\)/g, (match, alt, ext, b64) => {
  imgIndex++;
  const filename = `image_${String(imgIndex).padStart(2, '0')}.${ext === 'jpeg' ? 'jpg' : ext}`;
  const filepath = path.join(imgDir, filename);
  fs.writeFileSync(filepath, Buffer.from(b64, 'base64'));
  return `![${alt}](每天习题背诵_assets/${filename})`;
});

// 2. Clean up excessive escaping from mammoth
content = content.replace(/\\\(/g, '(');
content = content.replace(/\\\)/g, ')');
content = content.replace(/\\\./g, '.');
content = content.replace(/\\-/g, '-');
content = content.replace(/\\\{/g, '{');
content = content.replace(/\\\}/g, '}');
content = content.replace(/\\\\/g, '\\');
content = content.replace(/\\\*/g, '*');
content = content.replace(/\\_/g, '_');
content = content.replace(/\\>/g, '→');
content = content.replace(/🡪/g, '→');

// 3. Fix numbered headings: "## 1\.xxx" → "## 1. xxx"
content = content.replace(/^(#+)\s+(\d+)\\\.\s*/gm, '$1 $2. ');

// 4. Clean up multiple blank lines
content = content.replace(/\n{3,}/g, '\n\n');

// 5. Fix bold markers that got escaped
content = content.replace(/__\s+/g, '**');
content = content.replace(/\s+__/g, '**');

// 6. Trim trailing whitespace per line
content = content.split('\n').map(l => l.trimEnd()).join('\n');

// 7. Ensure file ends with newline
content = content.trimEnd() + '\n';

fs.writeFileSync('./每天习题背诵.md', content, 'utf8');
console.log(`Done! Extracted ${imgIndex} images.`);
console.log(`Output: 每天习题背诵.md`);
