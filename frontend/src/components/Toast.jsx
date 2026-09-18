import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded border shadow-2xl transition-all duration-300 animate-slideUp cursor-pointer ${
              toast.type === 'error'
                ? 'bg-[#191919] border-[#C62828] text-[#F5F3EE]'
                : 'bg-[#191919] border-[#292929] text-[#F5F3EE]'
            }`}
          >
            <span
              className={`font-mono font-bold text-sm ${
                toast.type === 'error' ? 'text-[#C62828]' : 'text-[#3A8F5B]'
              }`}
            >
              {toast.type === 'error' ? '✕' : '✓'}
            </span>
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              {toast.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      showToast: (msg) => console.log('Toast:', msg),
    };
  }
  return context;
};

export default ToastProvider;
