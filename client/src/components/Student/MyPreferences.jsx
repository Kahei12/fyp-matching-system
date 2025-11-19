import React, { useState } from 'react';

function MyPreferences({ 
  preferences, 
  onRemovePreference, 
  onSubmitPreferences, 
  onClearPreferences,
  onMovePreference,
  onReorderPreferences,
  onSwitchSection 
}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, preference, index) => {
    setDraggedItem({ preference, index });
    e.dataTransfer.effectAllowed = 'move';
    // 添加視覺效果
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.index === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    // 創建新的偏好順序
    const newPreferences = [...preferences];
    const [movedItem] = newPreferences.splice(draggedItem.index, 1);
    newPreferences.splice(dropIndex, 0, movedItem);

    // 調用父組件的重新排序函數
    if (onReorderPreferences) {
      onReorderPreferences(newPreferences);
    }

    setDragOverIndex(null);
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <div className="preferences-info">
          <p>☼ Drag to reorder your project preferences, or use up/down buttons (1 = highest preference)</p>
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
            <div 
              key={preference.id} 
              className={`preference-item ${dragOverIndex === index ? 'drag-over' : ''}`}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, preference, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="drag-handle" title="Drag to reorder">
                ⋮⋮
              </div>
              <div className="preference-rank">{index + 1}</div>
              <div className="preference-content">
                <h4>{preference.title}</h4>
                <p>{preference.supervisor} · ▲ {preference.popularity} selections</p>
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

