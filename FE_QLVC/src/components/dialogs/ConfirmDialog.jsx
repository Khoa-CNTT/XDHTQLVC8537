import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Xác nhận', 
  cancelText = 'Hủy', 
  onConfirm, 
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog-container">
        <div className="confirm-dialog-header">
          <h3 className="confirm-dialog-title">{title}</h3>
          <button 
            className="confirm-dialog-close-btn" 
            onClick={onCancel}
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="confirm-dialog-body">
          <div className="confirm-dialog-icon">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p className="confirm-dialog-message">{message}</p>
        </div>
        
        <div className="confirm-dialog-footer">
          <button 
            className="confirm-dialog-cancel-btn" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className="confirm-dialog-confirm-btn" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-icon"></span>
                Đang xử lý...
              </>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
