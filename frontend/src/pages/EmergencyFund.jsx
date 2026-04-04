import React, { useState } from 'react';
import { ShieldAlert, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const EmergencyFund = () => {
  const [formState, setFormState] = useState({
    category: '',
    pool: '',
    details: '',
    file: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormState({ ...formState, file: e.target.files[0].name });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">Emergency Relief Fund</h2>
           <p className="text-slate-500 font-medium mt-2">Request protocol-backed assistance designed to protect members against sudden default risks.</p>
        </div>
        <div className="bg-red-50 text-red-700 border border-red-100 flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm">
           <ShieldAlert size={18} strokeWidth={2.5} />
           <span className="text-sm font-bold tracking-tight">Reserve Balance: $214,500</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 lg:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
          
          {isSuccess ? (
             <div className="flex flex-col items-center justify-center text-center py-20 animate-in zoom-in duration-500">
               <div className="w-20 h-20 bg-teal-50 text-teal-600 border border-teal-100 rounded-full flex items-center justify-center mb-6">
                 <CheckCircle2 size={40} strokeWidth={2.5} />
               </div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">Request Submitted</h3>
               <p className="text-slate-500 font-medium mt-3 max-w-md">
                 Your request is now under review by the multi-sig committee. AI anomaly detection confirms proof validity. You'll be notified within 24 hours.
               </p>
               <button onClick={() => { setIsSuccess(false); setFormState({category: '', pool: '', details: '', file: null}); }} className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                 Submit Another Request
               </button>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Disbursement Application</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">Emergency Category</label>
                  <select 
                    required
                    value={formState.category}
                    onChange={(e) => setFormState({...formState, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select the nature of crisis...</option>
                    <option value="Health Related">Health Related (Medical Emergency)</option>
                    <option value="Financial Crisis">Financial Crisis (Job Loss, Bankruptcy)</option>
                    <option value="Other">Other (Natural Disaster, Theft, etc.)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">Target Pool</label>
                  <select 
                    required
                    value={formState.pool}
                    onChange={(e) => setFormState({...formState, pool: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select your active pool...</option>
                    <option value="Stable-Yield V4">Stable-Yield V4 ($1,000 Output)</option>
                    <option value="Elite Alpha">Elite Alpha ($12,000 Output)</option>
                    <option value="Premium Beta">Premium Beta ($6,000 Output)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">Situation Details</label>
                <textarea 
                  required
                  rows="4"
                  value={formState.details}
                  onChange={(e) => setFormState({...formState, details: e.target.value})}
                  placeholder="Please provide context for the committee evaluating your request..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block flex items-center justify-between">
                  Attach Proof
                  <span className="text-red-400 font-bold ml-1 lowercase text-[10px] tracking-normal">*Required</span>
                </label>
                
                <div className="relative border-2 border-slate-200 border-dashed rounded-2xl p-8 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center cursor-pointer group">
                  <input 
                    type="file" 
                    required={!formState.file}
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  {formState.file ? (
                    <div className="flex flex-col items-center text-teal-600">
                      <FileText size={32} className="mb-3 opacity-80" />
                      <p className="font-bold text-sm tracking-tight">{formState.file}</p>
                      <p className="text-xs text-slate-400 mt-1">Click to replace file</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-teal-600 transition-colors">
                      <Upload size={32} className="mb-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <p className="font-bold text-sm text-slate-600 tracking-tight">Upload Medical Bills, Pink Slips, FIRs</p>
                      <p className="text-xs mt-1">Drag and drop or click to browse (PDF, JPG, PNG)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full py-4 text-white rounded-xl font-black text-sm transition-all shadow-lg flex justify-center items-center gap-2
                    ${isSubmitting ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-teal-900 hover:bg-teal-950 shadow-teal-900/20 active:scale-[0.98]'}`}
                >
                  {isSubmitting ? 'Verifying File Hash...' : 'Submit Emergency Claim'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800 rounded-bl-full opacity-50"></div>
          
          <h4 className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest mb-6 relative z-10">How it Works</h4>
          
          <ul className="space-y-6 relative z-10">
            <li className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-black text-sm shrink-0">1</div>
              <div>
                <h5 className="font-bold text-sm tracking-tight mb-1">Submit Claim</h5>
                <p className="text-xs text-slate-400 leading-relaxed">Provide details of the emergency and upload verifiable proof.</p>
              </div>
            </li>
            <li className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-black text-sm shrink-0">2</div>
              <div>
                <h5 className="font-bold text-sm tracking-tight mb-1">AI Verification</h5>
                <p className="text-xs text-slate-400 leading-relaxed">Our Oracle validates the documents to prevent fraudulent claims instantly.</p>
              </div>
            </li>
            <li className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-black text-sm shrink-0">3</div>
              <div>
                <h5 className="font-bold text-sm tracking-tight mb-1">Multi-Sig Approval</h5>
                <p className="text-xs text-slate-400 leading-relaxed">Community leaders review and sign off the release from the Reserve Pool.</p>
              </div>
            </li>
          </ul>

          <div className="mt-8 pt-6 border-t border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex gap-2 items-center">
            <AlertCircle size={14} className="text-teal-500" />
            False claims trigger Trust Score penalty
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyFund;
