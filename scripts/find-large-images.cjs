const fs = require('fs');
const path = require('path');

const auditFile = path.resolve(__dirname, '..', 'scripts-output-audit.json');

if (!fs.existsSync(auditFile)) {
    console.error('Audit file not found! Run scripts/audit-assets.cjs first.');
    process.exit(1);
}

const auditData = JSON.parse(fs.readFileSync(auditFile, 'utf8'));

const images = auditData.filter(item => item.type === 'image');

console.log('Top 20 Largest Images in public/real-content:');
console.log('=============================================');

const tableData = [];

for (const img of images.slice(0, 20)) {
    const rawSizeKB = (img.sizeBytes / 1024).toFixed(1);
    
    // Suggest webp size: an optimized WebP for web grid should be around 100-150KB maximum
    // If it's a large image, we can suggest a size of 150KB
    const targetSizeKB = 150;
    const wastePercent = img.sizeBytes > (150 * 1024) ? (((img.sizeBytes - (150 * 1024)) / img.sizeBytes) * 100).toFixed(1) : 0;
    
    tableData.push({
        path: img.path,
        dimensions: `${img.width}x${img.height}`,
        format: img.format,
        currentSizeKB: rawSizeKB,
        suggestedSizeKB: targetSizeKB,
        wastePercent: wastePercent + '%'
    });
}

console.table(tableData);

// Save to a json for reporting
fs.writeFileSync(
    path.resolve(__dirname, '..', 'scripts-output-large-images.json'),
    JSON.stringify(tableData, null, 2),
    'utf8'
);
