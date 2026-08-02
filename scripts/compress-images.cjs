const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceDir = 'public/real-content';

async function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                arrayOfFiles.push(fullPath);
            }
        }
    }
    return arrayOfFiles;
}

async function compressImages() {
    console.log('\n--- In-place Professional Image Optimization Started ---');
    const files = await getAllFiles(sourceDir);
    let totalOldSize = 0;
    let totalNewSize = 0;
    let optimizedCount = 0;

    for (const file of files) {
        const stats = fs.statSync(file);
        totalOldSize += stats.size;
        
        const ext = path.extname(file).toLowerCase();
        const tempPath = file + '.tmp';

        try {
            const buffer = fs.readFileSync(file);
            const sharpInstance = sharp(buffer)
                .resize({ width: 1600, withoutEnlargement: true }); // Resize to max 1600px width for visual details

            if (ext === '.png') {
                await sharpInstance.png({ compressionLevel: 9 }).toFile(tempPath);
            } else if (['.jpg', '.jpeg'].includes(ext)) {
                await sharpInstance.jpeg({ quality: 80, progressive: true }).toFile(tempPath); // 80% quality to retain high details
            } else if (ext === '.webp') {
                await sharpInstance.webp({ quality: 70, effort: 6 }).toFile(tempPath);
            }

            // Overwrite original file safely
            if (fs.existsSync(tempPath)) {
                const newStats = fs.statSync(tempPath);
                
                // Only overwrite if the new file is actually smaller
                if (newStats.size < stats.size) {
                    fs.renameSync(tempPath, file);
                    totalNewSize += newStats.size;
                    optimizedCount++;
                } else {
                    fs.unlinkSync(tempPath); // discard larger optimized file
                    totalNewSize += stats.size;
                }
            } else {
                totalNewSize += stats.size;
            }
        } catch (err) {
            console.error(`Error processing ${file}:`, err.message);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            totalNewSize += stats.size;
        }
    }

    console.log('\n--- FINAL IMAGE REPORT ---');
    console.log(`Total Images Scanned: ${files.length}`);
    console.log(`Total Images Optimized: ${optimizedCount}`);
    console.log(`Total Size Before: ${(totalOldSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Size After:  ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Saving:      ${(100 * (1 - (totalNewSize / totalOldSize))).toFixed(2)} %`);
}

compressImages();
