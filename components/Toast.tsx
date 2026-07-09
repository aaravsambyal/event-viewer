"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {type === "success" ? (
          <CheckCircle size={16} />
        ) : (
          <AlertCircle size={16} />
        )}
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// Toast manager hook
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const show = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const hide = () => setToast(null);

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hide} />
  ) : null;

  return { show, ToastComponent };
}
