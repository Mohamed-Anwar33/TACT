const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceDir = 'public/real-content';
const destDir = 'compressed-media/images';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

async function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    for (const file of files) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = await getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    }
    return arrayOfFiles;
}

async function compressImages() {
    console.log('\n--- Ultra Image Compression Started ---');
    const files = await getAllFiles(sourceDir);
    let totalOldSize = 0;
    let totalNewSize = 0;

    for (const file of files) {
        const stats = fs.statSync(file);
        totalOldSize += stats.size;
        
        const relativePath = path.relative(sourceDir, file);
        const targetPath = path.join(destDir, relativePath.replace(/\.[^/.]+$/, "") + ".webp");
        const targetFolder = path.dirname(targetPath);

        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }

        try {
            // Using quality 60 for ultra-saving, and resizing very large images
            await sharp(file)
                .resize({ width: 1920, withoutEnlargement: true }) // Don't scale up small images
                .webp({ quality: 60, effort: 6 }) 
                .toFile(targetPath);

            const newStats = fs.statSync(targetPath);
            totalNewSize += newStats.size;
        } catch (err) {
            console.error(`Error processing ${file}:`, err.message);
        }
    }

    console.log('\n--- FINAL IMAGE REPORT ---');
    console.log(`Total Size Before: ${(totalOldSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Size After:  ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Saving:      ${(100 * (1 - (totalNewSize / totalOldSize))).toFixed(2)} %`);
}

compressImages();
