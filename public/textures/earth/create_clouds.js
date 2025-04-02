// Simple script to create a cloud texture
const fs = require('fs');
const path = require('path');

// Create a canvas to draw the clouds
const { createCanvas } = require('canvas');
const canvas = createCanvas(1024, 512);
const ctx = canvas.getContext('2d');

// Fill with transparent background
ctx.fillStyle = 'rgba(0, 0, 0, 0)';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Create cloud patterns
ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

// Function to create a cloud at a specific position
function drawCloud(x, y, size) {
  const numCircles = Math.floor(Math.random() * 5) + 5;
  
  for (let i = 0; i < numCircles; i++) {
    const offsetX = (Math.random() - 0.5) * size;
    const offsetY = (Math.random() - 0.5) * size * 0.5;
    const radius = (Math.random() * 0.5 + 0.5) * size / 2;
    const alpha = Math.random() * 0.4 + 0.2;
    
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }
}

// Draw many clouds across the canvas
for (let i = 0; i < 100; i++) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const size = Math.random() * 100 + 50;
  drawCloud(x, y, size);
}

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'earth_clouds.png'), buffer);

console.log('Cloud texture created successfully!');
