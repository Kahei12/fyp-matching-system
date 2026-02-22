const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'Teacher.css');
let content = fs.readFileSync(filePath, 'utf8');

// Update btn-create-project
content = content.replace(
  /\.btn-create-project \{[\s\S]*?background: #2c3e50;[\s\S]*?border: none;[\s\S]*?padding: 0\.75rem 1\.5rem;[\s\S]*?border-radius: 5px;[\s\S]*?\}/g,
  `.btn-create-project {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
}`
);
content = content.replace(
  /\.btn-create-project:hover \{[\s\S]*?background: #34495e;[\s\S]*?\}/g,
  `.btn-create-project:hover {
  background: #2563eb;
}`
);

// Update btn-edit
content = content.replace(
  /\.btn-edit \{[\s\S]*?background: #3498db;[\s\S]*?\}/g,
  `.btn-edit {
  background: #3b82f6;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-edit:hover \{[\s\S]*?background: #2980b9;[\s\S]*?\}/g,
  `.btn-edit:hover {
  background: #2563eb;
}`
);

// Update btn-delete
content = content.replace(
  /\.btn-delete \{[\s\S]*?background: #e74c3c;[\s\S]*?\}/g,
  `.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-delete:hover \{[\s\S]*?background: #c0392b;[\s\S]*?\}/g,
  `.btn-delete:hover {
  background: #dc2626;
}`
);

// Update btn-approve-proposal (green)
content = content.replace(
  /\.btn-approve-proposal \{[\s\S]*?background: #27ae60;[\s\S]*?\}/g,
  `.btn-approve-proposal {
  background: #22c55e;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-approve-proposal:hover \{[\s\S]*?background: #219653;[\s\S]*?\}/g,
  `.btn-approve-proposal:hover {
  background: #16a34a;
}`
);

// Update btn-reject-proposal (red)
content = content.replace(
  /\.btn-reject-proposal \{[\s\S]*?background: #e74c3c;[\s\S]*?\}/g,
  `.btn-reject-proposal {
  background: #ef4444;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-reject-proposal:hover \{[\s\S]*?background: #c0392b;[\s\S]*?\}/g,
  `.btn-reject-proposal:hover {
  background: #dc2626;
}`
);

// Update btn-view-details, btn-view-student
content = content.replace(
  /\.btn-view-details \{[\s\S]*?background: #3498db;[\s\S]*?\}/g,
  `.btn-view-details {
  background: #3b82f6;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-view-details:hover \{[\s\S]*?background: #2980b9;[\s\S]*?\}/g,
  `.btn-view-details:hover {
  background: #2563eb;
}`
);

content = content.replace(
  /\.btn-view-student \{[\s\S]*?background: #f8f9fa;[\s\S]*?border: 1px solid #dee2e6;[\s\S]*?\}/g,
  `.btn-view-student {
  background: #ffffff;
  color: #6b7280;
  border: 1px solid #d1d5db;
}`
);
content = content.replace(
  /\.btn-view-student:hover \{[\s\S]*?background: #e9ecef;[\s\S]*?border-color: #ced4da;[\s\S]*?\}/g,
  `.btn-view-student:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}`
);

// Update btn-view-proposal
content = content.replace(
  /\.btn-view-proposal \{[\s\S]*?background: #3498db;[\s\S]*?\}/g,
  `.btn-view-proposal {
  background: #3b82f6;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-view-proposal:hover \{[\s\S]*?background: #2980b9;[\s\S]*?\}/g,
  `.btn-view-proposal:hover {
  background: #2563eb;
}`
);

// Update btn-export-list
content = content.replace(
  /\.btn-export-list \{[\s\S]*?background: #2c3e50;[\s\S]*?\}/g,
  `.btn-export-list {
  background: #374151;
  color: white;
  border: none;
}`
);
content = content.replace(
  /\.btn-export-list:hover \{[\s\S]*?background: #34495e;[\s\S]*?\}/g,
  `.btn-export-list:hover {
  background: #1f2937;
}`
);

// Update btn-schedule-meeting
content = content.replace(
  /\.btn-schedule-meeting \{[\s\S]*?background: white;[\s\S]*?color: #2c3e50;[\s\S]*?border: 1px solid #e9ecef;[\s\S]*?\}/g,
  `.btn-schedule-meeting {
  background: #ffffff;
  color: #6b7280;
  border: 1px solid #d1d5db;
}`
);
content = content.replace(
  /\.btn-schedule-meeting:hover \{[\s\S]*?background: #f8f9fa;[\s\S]*?\}/g,
  `.btn-schedule-meeting:hover {
  background: #f3f4f6;
}`
);

// Update btn-primary
content = content.replace(
  /\.results-actions \.btn-primary \{[\s\S]*?background: #27ae60;[\s\S]*?\}/g,
  `.results-actions .btn-primary {
  background: #22c55e;
}`
);
content = content.replace(
  /\.results-actions \.btn-primary:hover \{[\s\S]*?background: #1e874b;[\s\S]*?\}/g,
  `.results-actions .btn-primary:hover {
  background: #16a34a;
}`
);

// Update btn-secondary
content = content.replace(
  /\.results-actions \.btn-secondary \{[\s\S]*?background: #ecf0f1;[\s\S]*?color: #2c3e50;[\s\S]*?\}/g,
  `.results-actions .btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}`
);
content = content.replace(
  /\.results-actions \.btn-secondary:hover \{[\s\S]*?background: #dfe6e9;[\s\S]*?\}/g,
  `.results-actions .btn-secondary:hover {
  background: #e5e7eb;
}`
);

// Update action-btn (from stage-status-cards)
content = content.replace(
  /\.stage-status-cards \.action-btn \{[\s\S]*?background: #3498db;[\s\S]*?\}/g,
  `.stage-status-cards .action-btn {
  background: #3b82f6;
}`
);
content = content.replace(
  /\.stage-status-cards \.action-btn:hover \{[\s\S]*?background: #2980b9;[\s\S]*?\}/g,
  `.stage-status-cards .action-btn:hover {
  background: #2563eb;
}`
);

// Update logout-btn
content = content.replace(
  /\.logout-btn \{[\s\S]*?background: #e74c3c;[\s\S]*?\}/g,
  `.logout-btn {
  background: #ef4444;
}`
);
content = content.replace(
  /\.logout-btn:hover \{[\s\S]*?background: #c0392b;[\s\S]*?\}/g,
  `.logout-btn:hover {
  background: #dc2626;
}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('All buttons updated!');
