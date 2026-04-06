import React from 'react';
import { StageGlyph } from '../common/StageGlyphs';

const STAGE_DEADLINE_MAP = {
  'student-applications': 'teacherProposalReview',
  'project-management': 'teacherSelfProposal',
};

function StageOverview({ currentSection, onStageChange, expiredDeadlineKeys = new Set() }) {
  const stages = [
    {
      id: 'student-applications',
      badgeLabel: 'Stage 1 (Proposal)',
      title: 'Student Proposal',
      description: 'Collect and review student proposals.',
      glyph: 'pencil',
      stageClass: 'stage-1',
      cardClass: 'status-card-stage-1',
    },
    {
      id: 'project-management',
      badgeLabel: 'Stage 2 (Matching)',
      title: 'Teacher Proposal',
      description: 'Approve, update and maintain teacher proposal pool.',
      glyph: 'gear',
      stageClass: 'stage-2',
      cardClass: 'status-card-stage-2',
    },
    {
      id: 'results',
      badgeLabel: 'Stage 3 (Clearing)',
      title: 'Result',
      description: 'Confirm and release matching outcome.',
      glyph: 'list',
      stageClass: 'stage-3',
      cardClass: 'status-card-stage-3',
    },
  ];

  return (
    <div className="status-cards stage-status-cards">
      {stages.map((stage) => {
        const dk = STAGE_DEADLINE_MAP[stage.id];
        const isExpired = dk ? expiredDeadlineKeys.has(dk) : false;

        return (
          <div
            key={stage.id}
            className={[
              'status-card',
              stage.cardClass,
              currentSection === stage.id ? 'active' : '',
              isExpired ? 'stage-disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => !isExpired && onStageChange(stage.id)}
            role="button"
            tabIndex={isExpired ? -1 : 0}
            onKeyDown={(e) => {
              if (!isExpired && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onStageChange(stage.id);
              }
            }}
            style={isExpired ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
          >
            <span className={`stage-badge ${stage.stageClass}`}>
              {stage.badgeLabel}
            </span>
            {isExpired && <span className="stage-overdue-tag">Overdue</span>}
            <div className="status-icon" aria-hidden>
              <StageGlyph name={stage.glyph} />
            </div>
            <div className="status-content">
              <h3>{stage.title}</h3>
              <p>{stage.description}</p>
              <button
                className="action-btn"
                disabled={isExpired}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isExpired) onStageChange(stage.id);
                }}
              >
                {isExpired ? 'Closed' : `Go to ${stage.title}`}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StageOverview;
