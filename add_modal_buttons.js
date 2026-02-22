const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'Teacher.css');
const content = fs.readFileSync(filePath, 'utf8');

const newStyles = `

/* Modal Actions - for Create/Edit Project Modals */
.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.btn-cancel,
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
}

.btn-cancel {
  background: #ffffff;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}

.btn-submit {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn-submit:hover {
  background: #2563eb;
}
`;

// Append the new styles to the end of the file
const updatedContent = content + newStyles;

fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Added modal button styles!');
