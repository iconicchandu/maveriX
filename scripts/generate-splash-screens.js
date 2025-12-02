const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Splash screen sizes for different devices
const SPLASH_SCREENS = [
  { name: 'splash-2048x2732.png', width: 2048, height: 2732 }, // iPad Pro 12.9"
  { name: 'splash-1668x2388.png', width: 1668, height: 2388 }, // iPad Pro 11"
  { name: 'splash-1536x2048.png', width: 1536, height: 2048 }, // iPad
  { name: 'splash-1242x2688.png', width: 1242, height: 2688 }, // iPhone XS Max
  { name: 'splash-1125x2436.png', width: 1125, height: 2436 }, // iPhone X/XS
  { name: 'splash-828x1792.png', width: 828, height: 1792 }, // iPhone XR
  { name: 'splash-750x1334.png', width: 750, height: 1334 }, // iPhone 8/7/6s/6
  { name: 'splash-640x1136.png', width: 640, height: 1136 }, // iPhone SE
];

const ICON_PATH = path.join(__dirname, '../public/assets/maverixicon.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

async function generateSplashScreens() {
  try {
    // Check if icon exists
    if (!fs.existsSync(ICON_PATH)) {
      console.error(`Error: Icon not found at ${ICON_PATH}`);
      process.exit(1);
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Read the icon
    const iconBuffer = await sharp(ICON_PATH).toBuffer();
    const iconMetadata = await sharp(iconBuffer).metadata();

    console.log('Generating splash screens with black background...\n');

    for (const splash of SPLASH_SCREENS) {
      // Calculate icon size (60% of the smaller dimension)
      const iconSize = Math.min(splash.width, splash.height) * 0.6;
      
      // Resize icon
      const resizedIcon = await sharp(iconBuffer)
        .resize(Math.round(iconSize), Math.round(iconSize), {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Create splash screen with black background and centered icon
      await sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
        }
      })
        .composite([
          {
            input: resizedIcon,
            top: Math.round((splash.height - iconSize) / 2),
            left: Math.round((splash.width - iconSize) / 2),
          }
        ])
        .png()
        .toFile(path.join(OUTPUT_DIR, splash.name));

      console.log(`✓ Generated ${splash.name} (${splash.width}x${splash.height})`);
    }

    console.log('\n✅ All splash screens generated successfully!');
  } catch (error) {
    console.error('Error generating splash screens:', error);
    process.exit(1);
  }
}

generateSplashScreens();

