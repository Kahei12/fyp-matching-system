const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'Teacher.css');
let content = fs.readFileSync(filePath, 'utf8');

// Replace btn-cancel styles
content = content.replace(
  /\.btn-cancel \{[\s\S]*?background: #f8f9fa;[\s\S]*?color: #495057;[\s\S]*?border: 1px solid #ced4da;[\s\S]*?\}/,
  `.btn-cancel {
  background: #ffffff;
  color: #6b7280;
  border: 1px solid #d1d5db;
}`
);

// Replace btn-cancel:hover styles
content = content.replace(
  /\.btn-cancel:hover \{[\s\S]*?background: #e9ecef;[\s\S]*?\}/,
  `.btn-cancel:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}`
);

// Replace btn-submit styles
content = content.replace(
  /\.btn-submit \{[\s\S]*?background: #3498db;[\s\S]*?color: white;[\s\S]*?border: none;[\s\S]*?\}/,
  `.btn-submit {
  background: #3b82f6;
  color: white;
  border: none;
}`
);

// Replace btn-submit:hover styles
content = content.replace(
  /\.btn-submit:hover \{[\s\S]*?background: #2980b9;[\s\S]*?\}/,
  `.btn-submit:hover {
  background: #2563eb;
}`
);

// Replace button padding and font-size
content = content.replace(
  /\.btn-cancel,[\s\S]*?\.btn-submit \{[\s\S]*?padding: 0\.75rem 1\.5rem;[\s\S]*?border-radius: 6px;[\s\S]*?font-size: 0\.95rem;[\s\S]*?font-weight: 600;[\s\S]*?cursor: pointer;[\s\S]*?transition: all 0\.3s ease;[\s\S]*?\}/,
  `.btn-cancel,
.btn-submit {
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('CSS updated successfully!');
