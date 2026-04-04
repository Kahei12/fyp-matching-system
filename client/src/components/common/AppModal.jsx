import React from 'react';
import './AppModal.css';

/**
 * 與教師端「建立專題」一致的圓角卡片式對話框（覆蓋原生 alert / confirm）。
 */
function AppModal({
  open,
  title,
  children,
  onClose,
  size = 'md',
  footer = 'none',
  okLabel = 'OK',
  primaryLabel = 'Confirm',
  secondaryLabel = 'Cancel',
  onOk,
  onPrimary,
  onSecondary,
}) {
  if (!open) return null;

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleOk = () => {
    onOk?.();
    onClose?.();
  };

  const handleSecondary = () => {
    onSecondary?.();
    onClose?.();
  };

  return (
    <div
      className="app-modal-overlay"
      onClick={handleOverlay}
      role="presentation"
    >
      <div
        className={`app-modal-content app-modal-size-${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
      >
        <div className="app-modal-header">
          <h2 id="app-modal-title">{title}</h2>
          <button
            type="button"
            className="app-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="app-modal-body">{children}</div>
        {footer === 'ok' && (
          <div className="app-modal-footer app-modal-footer-single">
            <button
              type="button"
              className="app-modal-btn app-modal-btn-primary"
              onClick={handleOk}
            >
              {okLabel}
            </button>
          </div>
        )}
        {footer === 'actions' && (
          <div className="app-modal-footer">
            <button
              type="button"
              className="app-modal-btn app-modal-btn-primary"
              onClick={() => onPrimary?.()}
            >
              {primaryLabel}
            </button>
            <button
              type="button"
              className="app-modal-btn app-modal-btn-cancel"
              onClick={handleSecondary}
            >
              {secondaryLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppModal;
