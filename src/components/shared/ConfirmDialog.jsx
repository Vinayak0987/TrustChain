import React from 'react';
import { Button } from './useRipple';

export const ConfirmDialog = ({ isOpen, title, body, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div
      className="dialog-overlay"
      id="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-body"
      style={{ display: 'flex' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="dialog-box">
        <div className="dialog-icon" style={{ background: 'var(--color-warning-light)' }} aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 19h20L12 2z"/>
            <path d="M12 8v6M12 16.5v.5"/>
          </svg>
        </div>
        <div className="dialog-title" id="dialog-title">{title}</div>
        <div className="dialog-body" id="dialog-body">{body}</div>
        <div className="dialog-actions">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="secondary" className="flex-1" onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  );
};
