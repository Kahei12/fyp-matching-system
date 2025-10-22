import React from 'react';

function MyPreferences({ 
  preferences, 
  onRemovePreference, 
  onSubmitPreferences, 
  onClearPreferences,
  onMovePreference,
  onSwitchSection 
}) {
  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>My Preferences</h1>
        <div className="preferences-info">
          <p>Use up/down buttons to reorder your project preferences (1 = highest preference)</p>
        </div>
      </div>

      <div className="preferences-list">
        {preferences.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">★</div>
            <h3>No preferences yet</h3>
            <p>Browse projects and add them to your preferences list</p>
            <button className="btn-primary" onClick={() => onSwitchSection('project-browse')}>
              Browse Projects
            </button>
          </div>
        ) : (
          preferences.map((preference, index) => (
            <div key={preference.id} className="preference-item">
              <div className="preference-rank">{index + 1}</div>
              <div className="preference-content">
                <h4>{preference.title}</h4>
                <p>{preference.supervisor} · ♨ {preference.popularity} selections</p>
              </div>
              <div className="preference-actions">
                <button 
                  className="btn-move" 
                  onClick={() => onMovePreference(preference.id, 'up')}
                  disabled={index === 0}
                  title="Move Up"
                >
                  ▲
                </button>
                <button 
                  className="btn-move" 
                  onClick={() => onMovePreference(preference.id, 'down')}
                  disabled={index === preferences.length - 1}
                  title="Move Down"
                >
                  ▼
                </button>
                <button 
                  className="btn-remove" 
                  onClick={() => onRemovePreference(preference.id)}
                >
                  × Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {preferences.length > 0 && (
        <div className="preferences-actions">
          <button className="btn-primary" onClick={onSubmitPreferences}>
            Submit Preferences
          </button>
          <button className="btn-secondary" onClick={onClearPreferences}>
            Clear All
          </button>
        </div>
      )}
    </section>
  );
}

export default MyPreferences;

