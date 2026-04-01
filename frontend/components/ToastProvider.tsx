/*
 * Toast Provider — components/ToastProvider.tsx
 * ================================================
 * The global notification system for Apex V2.
 *
 * This toast is greener than the leaf on a MongoDB logo.
 *
 * V2.1 Theme: MongoDB-inspired Dark/Green
 *   - Success: #001E2B background, #00ED64 accent
 *   - Error: Dark crimson with red accent
 *   - Warn: Dark amber with gold accent
 *   - Info: Dark navy with Sky Blue accent
 *
 * Usage:
 *   const { showSuccess, showError, showWarn, showInfo } = useApexToast();
 *   showSuccess("Title", "Message");
 */

"use client";

import { createContext, useContext, useRef, useCallback, type ReactNode } from "react";
import { Toast, type ToastMessage } from "primereact/toast";

/* ──────────────────────────────────────────────────────────── */
/* Toast Context & Types                                        */
/* ──────────────────────────────────────────────────────────── */

interface ApexToastContext {
  showSuccess: (summary: string, detail: string) => void;
  showError: (summary: string, detail: string) => void;
  showWarn: (summary: string, detail: string) => void;
  showInfo: (summary: string, detail: string) => void;
  showRaw: (msg: ToastMessage) => void;
}

const ToastContext = createContext<ApexToastContext | null>(null);

/* ──────────────────────────────────────────────────────────── */
/* Custom Hook                                                  */
/* ──────────────────────────────────────────────────────────── */

export function useApexToast(): ApexToastContext {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useApexToast must be used within <ToastProvider>. Did you forget to wrap your app?");
  }
  return ctx;
}

/* ──────────────────────────────────────────────────────────── */
/* MongoDB-Inspired Styles                                      */
/*                                                              */
/* This toast is greener than the leaf on a MongoDB logo.       */
/* Using official MongoDB palette: #001E2B (dark) + #00ED64    */
/* (green accent). Professional enough for a bank, snarky       */
/* enough for a hackathon.                                      */
/* ──────────────────────────────────────────────────────────── */

const MONGO_SUCCESS_STYLE: React.CSSProperties = {
  background: "#001E2B",
  color: "#ffffff",
  borderLeft: "5px solid #00ED64",
  borderRadius: "10px",
  boxShadow: "0 4px 20px rgba(0, 30, 43, 0.4)",
};

const MONGO_ERROR_STYLE: React.CSSProperties = {
  background: "#3B0A0A",
  color: "#ffffff",
  borderLeft: "5px solid #ff6b6b",
  borderRadius: "10px",
  boxShadow: "0 4px 20px rgba(59, 10, 10, 0.4)",
};

const MONGO_WARN_STYLE: React.CSSProperties = {
  background: "#3D2800",
  color: "#ffffff",
  borderLeft: "5px solid #ffd700",
  borderRadius: "10px",
  boxShadow: "0 4px 20px rgba(61, 40, 0, 0.4)",
};

const MONGO_INFO_STYLE: React.CSSProperties = {
  background: "#001E2B",
  color: "#ffffff",
  borderLeft: "5px solid #7ec8e3",
  borderRadius: "10px",
  boxShadow: "0 4px 20px rgba(0, 30, 43, 0.4)",
};

/* ──────────────────────────────────────────────────────────── */
/* Provider Component                                           */
/* ──────────────────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useRef<Toast>(null);

  const showSuccess = useCallback((summary: string, detail: string) => {
    toast.current?.show({
      severity: "success",
      summary,
      detail,
      life: 3500,
      style: MONGO_SUCCESS_STYLE,
      icon: "pi pi-check-circle",
    });
  }, []);

  const showError = useCallback((summary: string, detail: string) => {
    toast.current?.show({
      severity: "error",
      summary,
      detail,
      life: 4500,
      style: MONGO_ERROR_STYLE,
      icon: "pi pi-times-circle",
    });
  }, []);

  const showWarn = useCallback((summary: string, detail: string) => {
    toast.current?.show({
      severity: "warn",
      summary,
      detail,
      life: 4000,
      style: MONGO_WARN_STYLE,
      icon: "pi pi-exclamation-triangle",
    });
  }, []);

  const showInfo = useCallback((summary: string, detail: string) => {
    toast.current?.show({
      severity: "info",
      summary,
      detail,
      life: 3500,
      style: MONGO_INFO_STYLE,
      icon: "pi pi-info-circle",
    });
  }, []);

  const showRaw = useCallback((msg: ToastMessage) => {
    toast.current?.show(msg);
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarn, showInfo, showRaw }}>
      <Toast ref={toast} position="top-right" />
      {children}
    </ToastContext.Provider>
  );
}
