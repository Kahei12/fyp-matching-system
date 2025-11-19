import React from 'react';

function StageOverview({ currentSection, onStageChange }) {
  const stages = [
    {
      id: 'student-applications',
      badgeLabel: 'Stage 1 (Proposal)',
      title: 'Student Application',
      description: 'Collect and review student submissions.',
      icon: '✍',
      stageClass: 'stage-1',
      cardClass: 'status-card-stage-1'
    },
    {
      id: 'project-management',
      badgeLabel: 'Stage 2 (Matching)',
      title: 'Project Management',
      description: 'Approve, update and maintain project pool.',
      icon: '⚙',
      stageClass: 'stage-2',
      cardClass: 'status-card-stage-2'
    },
    {
      id: 'results',
      badgeLabel: 'Stage 3 (Clearing)',
      title: 'Result',
      description: 'Confirm and release matching outcome.',
      icon: '☰',
      stageClass: 'stage-3',
      cardClass: 'status-card-stage-3'
    }
  ];

  return (
    <div className="status-cards stage-status-cards">
      {stages.map(stage => (
        <div
          key={stage.id}
          className={`status-card ${stage.cardClass} ${currentSection === stage.id ? 'active' : ''}`}
          onClick={() => onStageChange(stage.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onStageChange(stage.id);
            }
          }}
        >
          <span className={`stage-badge ${stage.stageClass}`}>
            {stage.badgeLabel}
          </span>
          <div className="status-icon">{stage.icon}</div>
          <div className="status-content">
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
            <button 
              className="action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onStageChange(stage.id);
              }}
            >
              Go to {stage.title}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StageOverview;

