const fs = require('fs');
const path = require('path');

const nodeModulesDir = path.resolve(__dirname, '..', 'node_modules');
const outputReport = path.resolve(__dirname, '..', 'scripts-output-nodemodules.json');

function getFolderSize(dirPath) {
    let size = 0;
    try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                size += getFolderSize(filePath);
            } else {
                size += stats.size;
            }
        }
    } catch (e) {
        // Ignore
    }
    return size;
}

function analyze() {
    if (!fs.existsSync(nodeModulesDir)) {
        console.error('node_modules folder not found!');
        process.exit(1);
    }

    console.log('Analyzing node_modules folder at:', nodeModulesDir);
    const dirs = fs.readdirSync(nodeModulesDir);
    const results = [];

    for (const dir of dirs) {
        const fullPath = path.join(nodeModulesDir, dir);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            let sizeBytes = 0;
            if (dir.startsWith('@')) {
                // Scoped packages
                const subDirs = fs.readdirSync(fullPath);
                for (const subDir of subDirs) {
                    const subPath = path.join(fullPath, subDir);
                    const subSize = getFolderSize(subPath);
                    results.push({
                        name: `${dir}/${subDir}`,
                        sizeBytes: subSize,
                        sizeMB: (subSize / (1024 * 1024)).toFixed(2)
                    });
                }
            } else {
                sizeBytes = getFolderSize(fullPath);
                results.push({
                    name: dir,
                    sizeBytes: sizeBytes,
                    sizeMB: (sizeBytes / (1024 * 1024)).toFixed(2)
                });
            }
        }
    }

    // Sort by size descending
    results.sort((a, b) => b.sizeBytes - a.sizeBytes);

    fs.writeFileSync(outputReport, JSON.stringify(results.slice(0, 40), null, 2), 'utf8');
    console.log('node_modules analysis completed. Top 40 packages written to:', outputReport);
}

analyze();
