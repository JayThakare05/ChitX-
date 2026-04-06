import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X, ArrowRight, Coins, ShieldCheck, LogOut as LogOutIcon, ShieldAlert, BadgeCheck, XCircle, ChevronRight } from 'lucide-react';

// ==================== CONFIRM MODAL ====================
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, details, confirmText, cancelText, variant = 'join', isLoading }) => {
  if (!isOpen) return null;

  const iconMap = {
    join: <Coins className="w-7 h-7 text-[#1aa08c]" />,
    leave: <LogOutIcon className="w-7 h-7 text-amber-500" />,
    delete: <AlertTriangle className="w-7 h-7 text-red-500" />,
  };

  const accentMap = {
    join: { bg: 'bg-[#1aa08c]/10', border: 'border-[#1aa08c]/20', btn: 'bg-gradient-to-r from-[#1aa08c] to-[#0d9488] shadow-[#1aa08c]/30 text-white', iconBg: 'bg-[#f4fcf9]' },
    leave: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 text-white', iconBg: 'bg-amber-50' },
    delete: { bg: 'bg-red-500/10', border: 'border-red-500/20', btn: 'bg-red-500 hover:bg-red-600 shadow-red-500/30 text-white', iconBg: 'bg-red-50' },
  };

  const accent = accentMap[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0f3d3a]/60 backdrop-blur-md" />
      <div 
        className="relative w-full max-w-sm bg-white/95 rounded-[2rem] border border-slate-200/50 shadow-2xl shadow-[#134e4a]/10 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 ${accent.bg} blur-3xl rounded-full`} />
        
        <div className="relative p-8">
          <button onClick={onClose} className="absolute top-6 right-6 p-1.5 rounded-full text-[#134e4a]/30 hover:text-[#134e4a] bg-black/5 hover:bg-black/10 transition-all">
            <X size={16} strokeWidth={3} />
          </button>

          <div className={`w-14 h-14 rounded-2xl ${accent.iconBg} border border-white flex items-center justify-center mb-6 shadow-sm`}>
            {iconMap[variant]}
          </div>

          <h3 className="text-2xl font-bold text-[#134e4a] mb-2">{title}</h3>
          <p className="text-sm font-medium text-[#134e4a]/60 leading-relaxed mb-6">{description}</p>

          {details && details.length > 0 && (
            <div className={`bg-white border ${accent.border} rounded-2xl p-4 mb-6 space-y-3 shadow-sm`}>
              {details.map((d, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-[#134e4a]/40">{d.label}</span>
                  <span className="text-sm font-black text-[#134e4a]">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3.5 px-4 bg-white text-[#134e4a] rounded-xl font-bold text-sm hover:bg-[#f4fcf9] transition-all border-2 border-slate-200 active:scale-95"
            >
              {cancelText || 'Cancel'}
            </button>
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-[1.5] py-3.5 px-4 ${accent.btn} rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg active:scale-95`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {confirmText || 'Confirm'}
                  <ArrowRight size={16} strokeWidth={3} />
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
  useEffect(() => {
    if (isOpen && success) {
      const t = setTimeout(onClose, 4000);
      return () => clearTimeout(t);
    }
  }, [isOpen, success, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0f3d3a]/60 backdrop-blur-md" />
      <div 
        className="relative w-full max-w-sm bg-white/95 rounded-[2rem] border border-slate-200/50 shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 ${success ? 'bg-[#1aa08c]/15' : 'bg-red-500/10'} blur-3xl rounded-full`} />
        
        <div className="relative p-8 text-center flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full mb-6 flex items-center justify-center shadow-sm border-2 ${
            success ? 'bg-[#f4fcf9] border-[#1aa08c]/20' : 'bg-red-50 border-red-500/20'
          }`}>
            {success 
              ? <CheckCircle2 className="w-8 h-8 text-[#1aa08c]" strokeWidth={3} /> 
              : <AlertTriangle className="w-8 h-8 text-red-500" strokeWidth={3} />
            }
          </div>

          <h3 className="text-2xl font-bold text-[#134e4a] mb-2">{title}</h3>
          <p className="text-sm font-medium text-[#134e4a]/60 leading-relaxed mb-6">{message}</p>

          {details && details.length > 0 && (
            <div className={`w-full bg-white shadow-sm border rounded-2xl p-4 mb-6 space-y-3 ${success ? 'border-[#1aa08c]/20' : 'border-red-500/20'}`}>
              {details.map((d, i) => (
                <div key={i} className="flex justify-between items-center text-left">
                  <span className="text-xs font-black uppercase tracking-wider text-[#134e4a]/40">{d.label}</span>
                  <span className="text-sm font-black text-[#134e4a]">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={onClose}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg ${
              success 
                ? 'bg-gradient-to-r from-[#1aa08c] to-[#0d9488] shadow-[#1aa08c]/30 text-white' 
                : 'bg-white text-[#134e4a] border-2 border-slate-200 hover:bg-[#f4fcf9]'
            }`}
          >
            {success ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== ELIGIBILITY GATE MODAL ====================
export const EligibilityModal = ({ isOpen, onClose, onProceed, checks, poolMonthlyPay, fixedDeposit }) => {
  if (!isOpen) return null;

  const passedCount = checks.filter(c => c.passed).length;
  const hardReqFailed = checks.some(c => c.isHardRequirement && !c.passed);
  const allPassed = passedCount >= 2 && !hardReqFailed;

  const isMicroPool = poolMonthlyPay >= 5 && poolMonthlyPay <= 10;
  const hasLowTrust = checks.find(c => c.label === 'Trust Score')?.value.split(' / ')[0] < 50;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#0f3d3a]/60 backdrop-blur-md" />
      <div
        className="relative w-full max-w-sm bg-white/95 rounded-[2rem] border border-[#1aa08c]/20 shadow-2xl shadow-[#134e4a]/10 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 ${
          allPassed ? 'bg-[#1aa08c]/10' : 'bg-red-500/10'
        } blur-3xl rounded-full`} />

        <div className="relative p-8">
          <button onClick={onClose} className="absolute top-6 right-6 text-[#134e4a]/40 hover:text-[#134e4a] font-bold transition-all p-1.5 bg-black/5 hover:bg-black/10 rounded-full">
            <X size={16} strokeWidth={3} />
          </button>

          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border-2 ${
            allPassed
              ? 'bg-[#f4fcf9] border-[#1aa08c]/20'
              : 'bg-red-50 border-red-500/20'
          }`}>
            {allPassed
              ? <BadgeCheck className="w-7 h-7 text-[#1aa08c]" strokeWidth={2.5} />
              : <ShieldAlert className="w-7 h-7 text-red-500" strokeWidth={2.5} />
            }
          </div>

          <h3 className="text-2xl font-bold text-[#134e4a] mb-2">
            {allPassed ? 'You\'re Eligible!' : 'Eligibility Check Failed'}
          </h3>
          
          {isMicroPool && hasLowTrust && allPassed && (
            <div className="mb-4 bg-[#f4fcf9] border border-[#1aa08c]/30 rounded-xl p-3 flex gap-3 items-center animate-pulse shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#1aa08c] shrink-0" />
              <p className="text-[11px] font-bold text-[#134e4a]/80 leading-tight">
                MICRO-POOL EXCEPTION: You are allowed to join this pool despite a low trust score.
              </p>
            </div>
          )}

          <p className="text-sm text-[#134e4a]/60 leading-relaxed mb-6 font-medium">
            {allPassed
              ? 'All criteria passed. You can safely proceed to join this pool.'
              : hardReqFailed 
                ? 'This pool has a hard requirement that you do not meet.'
                : `${passedCount} of 3 eligibility checks passed. You need at least 2 to join this pool.`}
          </p>

          <div className="space-y-3 mb-6">
            {checks.map((check, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 rounded-2xl p-4 border ${
                  check.passed
                    ? 'bg-white border-[#1aa08c]/20 shadow-sm'
                    : 'bg-red-50/50 border-red-500/20 shadow-sm'
                }`}
              >
                <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${
                  check.passed ? 'bg-[#f4fcf9] border-[#1aa08c]/10' : 'bg-red-100 border-red-500/10'
                }`}>
                  {check.passed
                    ? <CheckCircle2 className="w-4 h-4 text-[#1aa08c]" strokeWidth={3} />
                    : <XCircle className="w-4 h-4 text-red-500" strokeWidth={3} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${
                      check.passed ? 'text-[#1aa08c]' : 'text-red-600'
                    }`}>{check.label}</span>
                    <span className="text-sm font-black text-[#134e4a] ml-2 shrink-0">{check.value}</span>
                  </div>
                  {!check.passed && check.hint && (
                    <p className="text-[11px] text-[#134e4a]/50 font-medium mt-1.5 leading-snug">{check.hint}</p>
                  )}
                  {check.passed && check.hint && (
                    <p className="text-[11px] text-[#134e4a]/50 font-medium mt-1.5 leading-snug">{check.hint}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-[#1aa08c]/80 mb-6">
            <span className="bg-[#f4fcf9] shadow-sm border border-[#1aa08c]/10 rounded-lg px-3 py-1.5">Monthly {poolMonthlyPay} CTX</span>
            <span className="bg-[#f4fcf9] shadow-sm border border-[#1aa08c]/10 rounded-lg px-3 py-1.5">Deposit {fixedDeposit} CTX</span>
          </div>

          {allPassed ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-[0.8] py-3.5 px-4 bg-white text-[#134e4a] rounded-xl font-bold text-sm hover:bg-[#f4fcf9] transition-all border-2 border-slate-200 shadow-sm active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={onProceed}
                className="flex-[1.2] py-3.5 px-4 bg-gradient-to-r from-[#1aa08c] to-[#0d9488] shadow-lg shadow-[#1aa08c]/30 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Proceed to Pay <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-white text-[#134e4a]/70 rounded-xl font-bold text-sm hover:bg-[#f4fcf9] hover:text-[#134e4a] transition-all border-2 border-slate-200 shadow-sm active:scale-[0.98]"
            >
              Understood, Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
