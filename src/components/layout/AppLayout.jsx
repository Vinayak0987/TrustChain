import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';
import { MobileNav } from './MobileNav';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { useToast } from '../shared/ToastProvider';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dialogState, setDialogState] = useState({ isOpen: false, title: '', body: '', onConfirm: null });

  // Expose a global dialog handler for convenience since it's global to the app shell
  useEffect(() => {
    window.showTcDialog = (title, body, onConfirm) => {
      setDialogState({ isOpen: true, title, body, onConfirm });
    };
  }, []);

  const closeDialog = () => setDialogState(prev => ({ ...prev, isOpen: false }));

  const handleConfirm = () => {
    if (dialogState.onConfirm) dialogState.onConfirm();
    closeDialog();
  };

  return (
    <div className="app-shell">
      <AppSidebar isOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Overlay to close sidebar on mobile */}
      {sidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="app-main" id="app-main">
        <AppTopbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="app-content">
          <Outlet />
        </div>
      </main>

      <MobileNav />

      <ConfirmDialog 
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        body={dialogState.body}
        onCancel={closeDialog}
        onConfirm={handleConfirm}
      />
    </div>
  );
};
