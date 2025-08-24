const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to resize image using ImageMagick
function resizeIcon(inputPath, outputPath, size) {
  return new Promise((resolve, reject) => {
    const command = `convert "${inputPath}" -resize ${size}x${size} "${outputPath}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error creating ${size}x${size} icon:`, error);
        reject(error);
        return;
      }
      console.log(`Created ${size}x${size} icon: ${outputPath}`);
      resolve();
    });
  });
}

// Generate icons from existing 1024x1024 icon
async function generateIcons() {
  const sourceIcon = path.join(__dirname, 'public/icons/icon-1024x1024.png');
  
  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon not found:', sourceIcon);
    return;
  }

  console.log('Generating PWA icons...');
  
  for (const size of iconSizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await resizeIcon(sourceIcon, outputPath, size);
  }
  
  console.log('All icons generated successfully!');
}

// Check if ImageMagick is available
exec('convert -version', (error, stdout, stderr) => {
  if (error) {
    console.error('ImageMagick not found. Please install ImageMagick to generate icons.');
    console.error('On Ubuntu/Debian: sudo apt-get install imagemagick');
    console.error('On macOS: brew install imagemagick');
    console.error('On Windows: Download from https://imagemagick.org/');
    return;
  }
  
  generateIcons().catch(console.error);
});