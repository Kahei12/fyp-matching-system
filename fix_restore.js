const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'Teacher.css');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Restore Edit button to blue (original)
content = content.replace(
  /\.btn-edit \{\s*background: #3b82f6;[\s\S]*?border: none;[\s\S]*?\}/g,
  `.btn-edit {
  background: #3498db;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-edit:hover \{\s*background: #2563eb;[\s\S]*?\}/g,
  `.btn-edit:hover {
  background: #2980b9;
}`
);

// Fix 2: Restore Delete button to red (original)
content = content.replace(
  /\.btn-delete \{\s*background: #ef4444;[\s\S]*?border: none;[\s\S]*?\}/g,
  `.btn-delete {
  background: #e74c3c;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-delete:hover \{\s*background: #dc2626;[\s\S]*?\}/g,
  `.btn-delete:hover {
  background: #c0392b;
}`
);

// Fix 3: Change modal-actions from row-reverse back to normal row
// This will put first button (Cancel) on left, second button (Save Changes) on right
// But we want Save Changes on LEFT, Cancel on RIGHT, so we need to SWAP the buttons in HTML
// For now, let's use justify-content: space-between to spread them
content = content.replace(
  /modal-actions \{\s*display: flex;\s*flex-direction: row-reverse;[\s\S]*?\}/g,
  `modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}`
);

// Also update btn-cancel/btn-submit to add margin for spacing
content = content.replace(
  /\.btn-cancel,\s*\.btn-submit \{\s*[^}]+margin-left[^}]+\}/g,
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

// Fix 4: Restore btn-view-details, btn-view-student to original blue
content = content.replace(
  /\.btn-view-details \{\s*background: #3b82f6;[\s\S]*?border: none;[\s\S]*?\}/g,
  `.btn-view-details {
  background: #3498db;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-view-details:hover \{\s*background: #2563eb;[\s\S]*?\}/g,
  `.btn-view-details:hover {
  background: #2980b9;
}`
);

content = content.replace(
  /\.btn-view-student \{\s*background: #ffffff;[\s\S]*?border: 1px solid #d1d5db;[\s\S]*?\}/g,
  `.btn-view-student {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}`
);
content = content.replace(
  /\.btn-view-student:hover \{\s*background: #f3f4f6;[\s\S]*?border-color: #9ca3af;[\s\S]*?\}/g,
  `.btn-view-student:hover {
  background: #e9ecef;
  border-color: #ced4da;
}`
);

// Fix 5: Restore btn-view-proposal to blue
content = content.replace(
  /\.btn-view-proposal \{\s*background: #3b82f6;[\s\S]*?border: none;[\s\S]*?\}/g,
  `.btn-view-proposal {
  background: #3498db;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-view-proposal:hover \{\s*background: #2563eb;[\s\S]*?\}/g,
  `.btn-view-proposal:hover {
  background: #2980b9;
}`
);

// Fix 6: Restore btn-create-project to dark blue
content = content.replace(
  /\.btn-create-project \{\s*background: #3b82f6;[\s\S]*?border: none;[\s\S]*?\}/g,
  `.btn-create-project {
  background: #2c3e50;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-create-project:hover \{\s*background: #2563eb;[\s\S]*?\}/g,
  `.btn-create-project:hover {
  background: #34495e;
}`
);

// Fix 7: Restore btn-export-list to dark
content = content.replace(
  /\.btn-export-list \{\s*background: #374151;[\s\S]*?border: none;[\s\S]*?\}/g,
  `.btn-export-list {
  background: #2c3e50;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-export-list:hover \{\s*background: #1f2937;[\s\S]*?\}/g,
  `.btn-export-list:hover {
  background: #34495e;
}`
);

// Fix 8: Restore btn-schedule-meeting to white/gray
content = content.replace(
  /\.btn-schedule-meeting \{\s*background: #ffffff;[\s\S]*?border: 1px solid #d1d5db;[\s\S]*?\}/g,
  `.btn-schedule-meeting {
  background: white;
  color: #2c3e50;
  border: 1px solid #e9ecef;
}`
);
content = content.replace(
  /\.btn-schedule-meeting:hover \{\s*background: #f3f4f6;[\s\S]*?\}/g,
  `.btn-schedule-meeting:hover {
  background: #f8f9fa;
}`
);

// Fix 9: Restore action-btn to blue
content = content.replace(
  /\.stage-status-cards \.action-btn \{\s*background: #3b82f6;[\s\S]*?\}/g,
  `.stage-status-cards .action-btn {
  background: #3498db;
}`
);
content = content.replace(
  /\.stage-status-cards \.action-btn:hover \{\s*background: #2563eb;[\s\S]*?\}/g,
  `.stage-status-cards .action-btn:hover {
  background: #2980b9;
}`
);

// Fix 10: Restore btn-primary to green
content = content.replace(
  /\.results-actions \.btn-primary \{\s*background: #22c55e;[\s\S]*?\}/g,
  `.results-actions .btn-primary {
  background: #27ae60;
}`
);
content = content.replace(
  /\.results-actions \.btn-primary:hover \{\s*background: #16a34a;[\s\S]*?\}/g,
  `.results-actions .btn-primary:hover {
  background: #1e874b;
}`
);

// Fix 11: Restore btn-secondary to gray
content = content.replace(
  /\.results-actions \.btn-secondary \{\s*background: #f3f4f6;[\s\S]*?color: #374151;[\s\S]*?border: 1px solid #d1d5db;[\s\S]*?\}/g,
  `.results-actions .btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}`
);
content = content.replace(
  /\.results-actions \.btn-secondary:hover \{\s*background: #e5e7eb;[\s\S]*?\}/g,
  `.results-actions .btn-secondary:hover {
  background: #dfe6e9;
}`
);

// Fix 12: Restore logout-btn to red
content = content.replace(
  /\.logout-btn \{\s*background: #ef4444;[\s\S]*?\}/g,
  `.logout-btn {
  background: #e74c3c;
}`
);
content = content.replace(
  /\.logout-btn:hover \{\s*background: #dc2626;[\s\S]*?\}/g,
  `.logout-btn:hover {
  background: #c0392b;
}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed!');
