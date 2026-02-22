const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'Teacher.css');
let content = fs.readFileSync(filePath, 'utf8');

// Check if content contains the old values
console.log('Contains f8f9fa:', content.includes('#f8f9fa'));
console.log('Contains 3498db:', content.includes('#3498db'));

// More targeted replacements
content = content.replace(/background: #f8f9fa;/g, 'background: #ffffff;');
content = content.replace(/color: #495057;/g, 'color: #6b7280;');
content = content.replace(/border: 1px solid #ced4da;/g, 'border: 1px solid #d1d5db;');
content = content.replace(/background: #e9ecef;/g, 'background: #f3f4f6;');
content = content.replace(/border-color: #9ca3af;/g, '');
content = content.replace(/color: #374151;/g, '');

content = content.replace(/background: #3498db;/g, 'background: #3b82f6;');
content = content.replace(/background: #2980b9;/g, 'background: #2563eb;');

content = content.replace(/padding: 0.75rem 1.5rem;/g, 'padding: 0.6rem 1.25rem;');
content = content.replace(/border-radius: 6px;/g, 'border-radius: 8px;');
content = content.replace(/font-size: 0.95rem;/g, 'font-size: 0.875rem;');
content = content.replace(/font-weight: 600;/g, 'font-weight: 500;');
content = content.replace(/transition: all 0.3s ease;/g, 'transition: all 0.2s ease;');

// Add new properties after padding
content = content.replace(
  /padding: 0\.6rem 1\.25rem;\s*border-radius: 8px;\s*font-size: 0\.875rem;\s*font-weight: 500;\s*cursor: pointer;\s*transition: all 0\.2s ease;/g,
  `padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;`
);

// Update btn-cancel:hover to add border-color and color
content = content.replace(
  /\.btn-cancel:hover \{\s*background: #f3f4f6;\s*\}/g,
  `.btn-cancel:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('CSS updated!');
console.log('Contains f8f9fa after:', content.includes('#f8f9fa'));
console.log('Contains 3498db after:', content.includes('#3498db'));
