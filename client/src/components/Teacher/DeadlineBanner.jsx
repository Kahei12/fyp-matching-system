import React from 'react';

function DeadlineBanner({ deadline }) {
  return (
    <div className="deadline-notification">
      <div className="deadline-label">Deadline:</div>
      <div className="deadline-info">
        <span className="deadline-date">{deadline.date}</span>
        <span className={`deadline-status ${deadline.status.toLowerCase().replace(' ', '-')}`}>
          {deadline.status}
        </span>
      </div>
      <div className="deadline-description">{deadline.description}</div>
    </div>
  );
}

export default DeadlineBanner;

