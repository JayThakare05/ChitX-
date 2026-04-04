import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X, ArrowRight, Coins, ShieldCheck, LogOut as LogOutIcon } from 'lucide-react';

// ==================== CONFIRM MODAL ====================
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, details, confirmText, cancelText, variant = 'join', isLoading }) => {
  if (!isOpen) return null;

  const iconMap = {
    join: <Coins className="w-7 h-7 text-teal-400" />,
    leave: <LogOutIcon className="w-7 h-7 text-amber-400" />,
    delete: <AlertTriangle className="w-7 h-7 text-red-400" />,
  };

  const accentMap = {
    join: { bg: 'bg-teal-500/10', border: 'border-teal-500/20', btn: 'bg-teal-600 hover:bg-teal-700', iconBg: 'bg-teal-500/15' },
    leave: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', btn: 'bg-amber-600 hover:bg-amber-700', iconBg: 'bg-amber-500/15' },
    delete: { bg: 'bg-red-500/10', border: 'border-red-500/20', btn: 'bg-red-600 hover:bg-red-700', iconBg: 'bg-red-500/15' },
  };

  const accent = accentMap[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 ${accent.bg} blur-3xl rounded-full`} />
        
        <div className="relative p-8">
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
            <X size={16} />
          </button>

          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl ${accent.iconBg} border ${accent.border} flex items-center justify-center mb-5`}>
            {iconMap[variant]}
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">{description}</p>

          {/* Details Card */}
          {details && details.length > 0 && (
            <div className={`${accent.bg} border ${accent.border} rounded-2xl p-4 mb-6 space-y-2.5`}>
              {details.map((d, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{d.label}</span>
                  <span className="text-sm font-black text-white">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all border border-slate-700"
            >
              {cancelText || 'Cancel'}
            </button>
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-[1.5] py-3 px-4 ${accent.btn} text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {confirmText || 'Confirm'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== RESULT MODAL (Success / Error) ====================
export const ResultModal = ({ isOpen, onClose, success, title, message, details }) => {
  // Auto-close after 4s for success
  useEffect(() => {
    if (isOpen && success) {
      const t = setTimeout(onClose, 4000);
      return () => clearTimeout(t);
    }
  }, [isOpen, success, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 ${success ? 'bg-emerald-500/15' : 'bg-red-500/15'} blur-3xl rounded-full`} />
        
        <div className="relative p-8 text-center">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center ${
            success ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-red-500/15 border border-red-500/30'
          }`}>
            {success 
              ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> 
              : <AlertTriangle className="w-8 h-8 text-red-400" />
            }
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-5">{message}</p>

          {/* Details */}
          {details && details.length > 0 && (
            <div className={`${success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-2xl p-4 mb-6 space-y-2.5`}>
              {details.map((d, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{d.label}</span>
                  <span className="text-sm font-black text-white">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
              success 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {success ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
