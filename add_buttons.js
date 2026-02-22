const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'Teacher.css');
const content = fs.readFileSync(filePath, 'utf8');

const newContent = content + `

/* Modal Button Styles */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
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

fs.writeFileSync(filePath, newContent);
console.log('Done!');
