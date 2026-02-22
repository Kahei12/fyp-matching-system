import React from 'react';

function Sidebar({ currentSection, onSwitchSection, studentData, onLogout, isAssigned = false }) {
  const menuItems = [
    { id: 'proposal', label: '◆ Proposal' },
    { id: 'project-browse', label: '⌕ Browse Projects' },
    { id: 'my-preferences', label: '★ My Preferences', disabled: isAssigned },
    { id: 'results', label: '☰ Results' },
    { id: 'profile', label: 'ⓘ Profile' }
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2>HKMU FYP Matching System</h2>
        <p>Student Portal</p>
      </div>
      
      <ul className="sidebar-menu">
        {menuItems.map(item => (
          <li key={item.id} className={`menu-item ${item.disabled ? 'disabled' : ''}`}>
            <a 
              href={`#${item.id}`}
              className={`menu-link ${currentSection === item.id ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault();
                  return;
                }
                e.preventDefault();
                onSwitchSection(item.id);
              }}
            >
              {item.label}
              {item.disabled && <span className="disabled-hint">(Assigned)</span>}
            </a>
          </li>
        ))}
      </ul>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <p id="studentName">{studentData.name}</p>
          <p id="studentId">{studentData.studentId}</p>
          <p id="studentGPA">GPA: {studentData.gpa}</p>
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Sidebar;

