"use client";
import React from 'react';

/**
 * Supported visual styles for modal buttons.
 */
export type ModalActionVariant = 'primary' | 'danger' | 'secondary' | 'ghost';

interface ModalAction {
  label: string;
  onClick: () => void;
  variant: ModalActionVariant;
  isLoading?: boolean;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void; // Called when clicking backdrop or pressing escape (if implemented)
  title: string;
  description: string;
  icon?: React.ReactNode;
  actions: ModalAction[]; // Array allows for any number of buttons
}

export default function ConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  actions
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantClasses = (variant: ModalActionVariant) => {
    switch (variant) {
      case 'primary':
        return "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20";
      case 'danger':
        return "bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-transparent hover:border-red-500/30";
      case 'secondary':
        return "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700";
      case 'ghost':
        return "text-slate-500 hover:text-slate-300 bg-transparent border-transparent";
      default:
        return "bg-slate-800 text-white";
    }
  };

  return (
    // High z-index [110] ensures it appears above other modals like ProfileModal
    <div className="fixed inset-0 bg-slate-950/80 z-[110] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {icon && (
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-blue-600/20 border border-blue-500/30 text-blue-400">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {description}
        </p>
        
        <div className="flex flex-col gap-2.5">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.isLoading}
              className={`w-full font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center ${getVariantClasses(action.variant)}`}
            >
              {action.isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                action.label
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}