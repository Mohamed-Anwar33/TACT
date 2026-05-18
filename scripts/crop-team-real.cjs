const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = 'd:\\شركة التشطيبات\\tact-architects-experience\\public';
const outDir = path.join(publicDir, 'team-real');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Bounding box size (width/height of the square to crop)
const CROP_SIZE = 220; // 220x220 square around each circle

const CROPS = [
  // 1. OWNERS (from media__1779098332023.jpg) - Y: 360
  {
    source: 'media__1779098332023.jpg',
    name: 'ahmed-rajeh.png',
    cx: 184,
    cy: 360
  },
  {
    source: 'media__1779098332023.jpg',
    name: 'ebrahem-al-domiaty.png',
    cx: 512,
    cy: 360
  },
  {
    source: 'media__1779098332023.jpg',
    name: 'khaled-sabiha.png',
    cx: 848,
    cy: 360
  },

  // 2. ACCOUNTING & MARKETING (from media__1779098331573.jpg) - Y: 440
  {
    source: 'media__1779098331573.jpg',
    name: 'rawan-el-bargesy.png',
    cx: 185,
    cy: 440
  },
  {
    source: 'media__1779098331573.jpg',
    name: 'asmaa-alaa.png',
    cx: 520,
    cy: 440
  },
  {
    source: 'media__1779098331573.jpg',
    name: 'hala-ibrahem.png',
    cx: 840,
    cy: 440
  },

  // 3. SITE ENGINEERS (from media__1779098331836.jpg)
  {
    source: 'media__1779098331836.jpg',
    name: 'lamiaa-el-halwany.png',
    cx: 830,
    cy: 280
  },
  {
    source: 'media__1779098331836.jpg',
    name: 'zeyad-el-salamony.png',
    cx: 185,
    cy: 580
  },
  {
    source: 'media__1779098331836.jpg',
    name: 'muhamed-el-zedy.png',
    cx: 512,
    cy: 580
  },
  {
    source: 'media__1779098331836.jpg',
    name: 'muhamed-eissa.png',
    cx: 840,
    cy: 580
  },

  // 4. DESIGN ENGINEERS 1 (from media__1779098331913.jpg) - Y: 440
  {
    source: 'media__1779098331913.jpg',
    name: 'omnia-abd-el-salam.png',
    cx: 145,
    cy: 440
  },
  {
    source: 'media__1779098331913.jpg',
    name: 'haidy-galal.png',
    cx: 390,
    cy: 440
  },
  {
    source: 'media__1779098331913.jpg',
    name: 'ahmed-yakout.png',
    cx: 635,
    cy: 440
  },
  {
    source: 'media__1779098331913.jpg',
    name: 'hend-el-hidaby.png',
    cx: 880,
    cy: 440
  },

  // 5. DESIGN ENGINEERS 2 (from media__1779098331988.jpg)
  {
    source: 'media__1779098331988.jpg',
    name: 'rabab-abdo-qwita.png',
    cx: 840,
    cy: 280
  },
  {
    source: 'media__1779098331988.jpg',
    name: 'yara-el-shabrawy.png',
    cx: 185,
    cy: 580
  },
  {
    source: 'media__1779098331988.jpg',
    name: 'amany-safan.png',
    cx: 512,
    cy: 580
  },
  {
    source: 'media__1779098331988.jpg',
    name: 'asmaa-ghaneem.png',
    cx: 840,
    cy: 580
  }
];

async function run() {
  for (const item of CROPS) {
    const srcPath = path.join(publicDir, item.source);
    if (!fs.existsSync(srcPath)) {
      console.log(`Source missing: ${srcPath}`);
      continue;
    }

    const meta = await sharp(srcPath).metadata();
    
    // Calculate square crop bounds dynamically to prevent out of bounds
    const left = Math.max(0, Math.min(meta.width - CROP_SIZE, Math.round(item.cx - CROP_SIZE / 2)));
    const top = Math.max(0, Math.min(meta.height - CROP_SIZE, Math.round(item.cy - CROP_SIZE / 2)));

    await sharp(srcPath)
      .extract({ left, top, width: CROP_SIZE, height: CROP_SIZE })
      .toFile(path.join(outDir, item.name));

    console.log(`Cropped successfully: ${item.name} | center: (${item.cx}, ${item.cy}) -> top: ${top}, left: ${left}`);
  }
}

run().catch(console.error);
