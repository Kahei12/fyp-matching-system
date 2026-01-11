import React from 'react';

function Sidebar({ currentSection, onSwitchSection, userName, onLogout }) {
  const menuItems = [
    { id: 'project-review', label: 'Project Review' },
    { id: 'matching-control', label: 'Matching Control' },
    { id: 'final-assignment', label: 'Final Assignment' },
    { id: 'data-export', label: 'Data Export' },
    { id: 'deadline-management', label: 'Deadline Management' }
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2>HKMU FYP Matching System</h2>
        <p>Admin Portal</p>
      </div>
      
      <ul className="sidebar-menu">
        {menuItems.map(item => (
          <li key={item.id} className="menu-item">
            <a 
              href={`#${item.id}`}
              className={`menu-link ${currentSection === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onSwitchSection(item.id);
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      
      <div className="sidebar-footer">
        <div className="user-welcome">
          <p>Welcome, {userName}</p>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;

