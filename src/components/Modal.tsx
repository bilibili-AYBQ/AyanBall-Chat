import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title?: string;
  onClose?: () => void;
  children: ReactNode;
  width?: number;
}

export default function Modal({ open, title, onClose, children, width = 420 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm anim-fade"
      onMouseDown={onClose ? (e) => e.target === e.currentTarget && onClose() : undefined}
    >
      <div
        className="anim-pop rounded-2xl bd bg-overlay sh"
        style={{ width, maxWidth: "92vw", maxHeight: "86vh" }}
      >
        {title && (
          <div className="flex items-center justify-between border-b bd px-6 py-4">
            <h3 className="text-base font-semibold text-1">{title}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-2 hv2 hover:text-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "74vh" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
