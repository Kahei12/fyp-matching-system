import React from 'react';
import './OverdueNotice.css';

function OverdueNotice({ title, children }) {
  return (
    <div className="overdue-notice" role="alert">
      <div className="overdue-notice-content">
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}

export default OverdueNotice;
