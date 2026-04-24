// Script to replace all font instances in StudyPage.tsx
const fs = require('fs');

const filePath = './components/StudyPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all Inter font instances
content = content.replace(/fontFamily: "Inter, sans-serif"/g, 'fontFamily: "Neurial Grotesk, sans-serif"');
content = content.replace(/fontFamily: "Inter, -apple-system, sans-serif"/g, 'fontFamily: "Neurial Grotesk, sans-serif"');

// Replace all Roboto Slab instances  
content = content.replace(/fontFamily: "Roboto Slab, serif"/g, 'fontFamily: "Neurial Grotesk, sans-serif"');

// Handle inline style instances
content = content.replace(/fontFamily: "Inter/g, 'fontFamily: "Neurial Grotesk');
content = content.replace(/fontFamily: "Roboto Slab/g, 'fontFamily: "Neurial Grotesk');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ All fonts replaced with Neurial Grotesk!');
