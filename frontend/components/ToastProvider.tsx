"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ToastSeverity = "success" | "error" | "warn" | "info";

export interface ToastMessage {
  id: string;
  severity: ToastSeverity;
  summary: string;
  detail: string;
}

interface ApexToastContext {
  showSuccess: (summary: string, detail: string) => void;
  showError: (summary: string, detail: string) => void;
  showWarn: (summary: string, detail: string) => void;
  showInfo: (summary: string, detail: string) => void;
  showRaw: (msg: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ApexToastContext | null>(null);

export function useApexToast(): ApexToastContext {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useApexToast must be used within <ToastProvider>.");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...msg, id }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const showSuccess = useCallback((summary: string, detail: string) => {
    addToast({ severity: "success", summary, detail });
  }, [addToast]);

  const showError = useCallback((summary: string, detail: string) => {
    addToast({ severity: "error", summary, detail });
  }, [addToast]);

  const showWarn = useCallback((summary: string, detail: string) => {
    addToast({ severity: "warn", summary, detail });
  }, [addToast]);

  const showInfo = useCallback((summary: string, detail: string) => {
    addToast({ severity: "info", summary, detail });
  }, [addToast]);

  const showRaw = useCallback((msg: Omit<ToastMessage, "id">) => {
    addToast(msg);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarn, showInfo, showRaw }}>
      {children}
      {typeof window !== "undefined" && createPortal(
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage, onClose: () => void }) {
  const icons = {
    success: "pi-check-circle text-emerald-500",
    error: "pi-times-circle text-rose-500",
    warn: "pi-exclamation-triangle text-amber-500",
    info: "pi-info-circle text-indigo-500"
  };

  const borderColors = {
    success: "border-emerald-500",
    error: "border-rose-500",
    warn: "border-amber-500",
    info: "border-indigo-500"
  };

  return (
    <div className={`pointer-events-auto bg-white border-l-4 ${borderColors[toast.severity]} rounded-xl shadow-lg border border-slate-200 p-4 flex gap-4 items-start animate-fade-in-up`}>
      <i className={`pi ${icons[toast.severity]} text-2xl mt-0.5`} />
      <div className="flex-1">
        <h4 className="font-semibold text-slate-900 m-0 leading-tight">{toast.summary}</h4>
        <p className="text-slate-500 mt-1 mb-0 text-sm">{toast.detail}</p>
      </div>
      <button 
        onClick={onClose} 
        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 flex-shrink-0"
        aria-label="Close"
      >
        <i className="pi pi-times" />
      </button>
    </div>
  );
}
