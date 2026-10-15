import React from 'react';
import { AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { Modal } from './Modal.js';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}) => {
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      title={title}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div
          className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            isDanger
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : isWarning
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-cyan-50 border-cyan-200 text-cyan-900'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {isDanger && <AlertCircle className="w-5 h-5 text-rose-600" />}
            {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
            {!isDanger && !isWarning && <Info className="w-5 h-5 text-cyan-600" />}
          </div>
          <p className="text-xs leading-relaxed font-medium">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/20'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
