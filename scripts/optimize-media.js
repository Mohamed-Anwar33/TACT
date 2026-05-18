import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const sourceDir = path.resolve('فولدرات شركة التشطيب');
const targetDir = path.resolve('public/real-content');

async function processDirectory(currentSource, currentTarget) {
  if (!fs.existsSync(currentTarget)) {
    fs.mkdirSync(currentTarget, { recursive: true });
  }

  const entries = fs.readdirSync(currentSource, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(currentSource, entry.name);
    const ext = path.extname(entry.name).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png'].includes(ext);

    if (entry.isDirectory()) {
      await processDirectory(sourcePath, path.join(currentTarget, entry.name));
    } else if (isImage) {
      const baseName = path.basename(entry.name, path.extname(entry.name));
      const targetPath = path.join(currentTarget, `${baseName}.webp`);
      try {
        console.log(`Optimizing image: ${entry.name} -> ${baseName}.webp`);
        await sharp(sourcePath)
          .resize({ width: 1000, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toFile(targetPath);
      } catch (err) {
        console.error(`Error processing image ${sourcePath}:`, err);
        fs.copyFileSync(sourcePath, path.join(currentTarget, entry.name));
      }
    } else {
      const targetPath = path.join(currentTarget, entry.name);
      console.log(`Copying file: ${entry.name}`);
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

async function run() {
  console.log('Starting media optimization and copy...');
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }
  await processDirectory(sourceDir, targetDir);
  console.log('Media optimization completed successfully! All assets are in public/real-content');
}

run();
