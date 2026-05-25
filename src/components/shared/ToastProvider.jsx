import React, { createContext, useState, useContext } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          id="tc-toast"
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%) translateY(0)',
            background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            color: '#fff',
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-sm)',
            fontWeight: '600',
            padding: '12px 24px',
            borderRadius: '999px',
            boxShadow: '0 8px 32px rgba(26,43,61,0.15)',
            zIndex: 9999,
            opacity: 1,
            transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
            whiteSpace: 'nowrap',
          }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
