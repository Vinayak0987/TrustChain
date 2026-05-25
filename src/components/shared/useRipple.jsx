import React, { useEffect } from 'react';

export function useRipple(ref) {
  useEffect(() => {
    const btn = ref.current;
    if (!btn) return;

    // Inject styles once if not present globally (we rely on global style from old app.js)
    // Actually, let's keep it in CSS or inject it here.
    const styleId = 'ripple-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes tcRipple { to { transform: scale(3.5); opacity: 0; } }
      `;
      document.head.appendChild(style);
    }

    const handleRipple = (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      Object.assign(ripple.style, {
        position: 'absolute',
        borderRadius: '50%',
        width: '100px',
        height: '100px',
        left: `${e.clientX - rect.left - 50}px`,
        top: `${e.clientY - rect.top - 50}px`,
        background: 'rgba(255,255,255,0.2)',
        transform: 'scale(0)',
        pointerEvents: 'none',
        animation: 'tcRipple 0.55s ease-out forwards'
      });
      // In React, modifying DOM directly is generally frowned upon,
      // but for ephemeral purely visual ripples like this, it's very effective and keeps React state clean.
      btn.appendChild(ripple);
      setTimeout(() => {
        if (btn.contains(ripple)) {
          ripple.remove();
        }
      }, 600);
    };

    btn.addEventListener('mousedown', handleRipple);
    return () => {
      btn.removeEventListener('mousedown', handleRipple);
    };
  }, [ref]);
}

// Reusable Button component that automatically uses the ripple
export const Button = ({ children, className = '', variant = 'primary', size = '', ...props }) => {
  const ref = React.useRef(null);
  
  // Only apply ripple to primary or secondary (as in original)
  if (variant === 'primary' || variant === 'secondary') {
    useRipple(ref);
  }

  const classes = `btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`.trim();

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
};
