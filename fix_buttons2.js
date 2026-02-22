const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'Teacher.css');
let content = fs.readFileSync(filePath, 'utf8');

// Fix modal-actions to use flex-direction: row-reverse for button order
content = content.replace(
  /\.modal-actions \{\s*display: flex;\s*justify-content: flex-end;/g,
  `.modal-actions { display: flex; flex-direction: row-reverse; justify-content: flex-start;`
);

// Fix btn-cancel and btn-submit styles (first occurrence in Modal section)
content = content.replace(
  /\.btn-cancel,\s*\.btn-submit \{\s*padding: 0\.75rem 1\.5rem;\s*border-radius: 6px;\s*font-size: 0\.95rem;\s*font-weight: 600;\s*cursor: pointer;\s*transition: all 0\.3s ease;\s*\}/g,
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
  margin-left: 0.75rem;
}`
);

// Fix btn-cancel
content = content.replace(
  /\.btn-cancel \{\s*background: #f8f9fa;\s*color: #495057;\s*border: 1px solid #ced4da;\s*\}/g,
  `.btn-cancel {
  background: #ffffff;
  color: #6b7280;
  border: 1px solid #d1d5db;
}`
);

// Fix btn-cancel:hover
content = content.replace(
  /\.btn-cancel:hover \{\s*background: #e9ecef;\s*\}/g,
  `.btn-cancel:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}`
);

// Fix btn-submit
content = content.replace(
  /\.btn-submit \{\s*background: #3498db;\s*color: white;\s*border: none;\s*\}/g,
  `.btn-submit {
  background: #3b82f6;
  color: white;
  border: none;
}`
);

// Fix btn-submit:hover
content = content.replace(
  /\.btn-submit:hover \{\s*background: #2980b9;\s*\}/g,
  `.btn-submit:hover {
  background: #2563eb;
}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed!');
