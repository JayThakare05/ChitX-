import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Phone, 
    Briefcase, 
    Wallet, 
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft,
    DollarSign,
    FileText,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import axios from 'axios';

const AuthFlow = () => {
    const [step, setStep] = useState(1);
    const { address, isConnected } = useAccount();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    // Form Stats
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        income: '',
        expenses: '',
        employment: 'Salaried',
        hasBankStatement: true
    });

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitKYC = async () => {
        setLoading(true);
        setError(null);
        try {
            // Local host for demo, in production it would be an ENV variable
            const response = await axios.post('http://localhost:5000/api/auth/onboarding', {
                ...formData,
                walletAddress: address
            });
            setResult(response.data);
            nextStep();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to process KYC. Make sure backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: 'Basic Info', icon: <User className="w-5 h-5" /> },
        { id: 2, title: 'Financial KYC', icon: <FileText className="w-5 h-5" /> },
        { id: 3, title: 'Wallet Setup', icon: <Wallet className="w-5 h-5" /> },
        { id: 4, title: 'Result', icon: <CheckCircle2 className="w-5 h-5" /> }
    ];

    return (
        <div className="min-h-screen pt-20 pb-12 px-6 flex flex-col items-center">
            {/* Progress Stepper */}
            <div className="w-full max-w-2xl mb-12">
                <div className="flex justify-between items-center relative">
                    {steps.map((s, i) => (
                        <div key={s.id} className="z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                step >= s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}>
                                {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${step >= s.id ? 'text-indigo-400' : 'text-slate-500'}`}>
                                {s.title}
                            </span>
                        </div>
                    ))}
                    {/* Background Progress Line */}
                    <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-800 -z-0">
                        <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }} />
                    </div>
                </div>
            </div>

            {/* Form Container */}
            <div className="w-full max-w-xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-card rounded-3xl p-8 lg:p-10"
                    >
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold mb-2 text-white">Let's get started</h2>
                                    <p className="text-slate-400">Tell us a bit about yourself to begin.</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-400 mb-1.5 block">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                                            <input 
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                type="text" 
                                                placeholder="John Doe" 
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-400 mb-1.5 block">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                                            <input 
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                type="tel" 
                                                placeholder="+1 (555) 000-0000" 
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={nextStep}
                                    disabled={!formData.name || !formData.phone}
                                    className="w-full btn-primary disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 mt-4"
                                >
                                    Continue <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="mb-8 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2 text-white">Financial Profile</h2>
                                        <p className="text-slate-400">This data helps AI calculate your Trust Score.</p>
                                    </div>
                                    <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                                        <TrendingUp className="text-indigo-400 w-6 h-6" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-400 mb-1.5 block">Monthly Income</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                                                <input 
                                                    name="income"
                                                    value={formData.income}
                                                    onChange={handleInputChange}
                                                    type="number" 
                                                    placeholder="5000" 
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-400 mb-1.5 block">Expenses</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                                                <input 
                                                    name="expenses"
                                                    value={formData.expenses}
                                                    onChange={handleInputChange}
                                                    type="number" 
                                                    placeholder="2000" 
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-400 mb-1.5 block">Employment Type</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Student', 'Salaried', 'Business'].map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setFormData(prev => ({ ...prev, employment: type }))}
                                                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                                                        formData.employment === type 
                                                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800 mt-4">
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer hover:border-indigo-500/30 transition-all"
                                             onClick={() => setFormData(prev => ({ ...prev, hasBankStatement: !prev.hasBankStatement }))}>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.hasBankStatement ? 'bg-indigo-600 border-indigo-500' : 'border-slate-700'}`}>
                                                {formData.hasBankStatement && <CheckCircle2 className="w-4 h-4 text-white" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">I have a bank statement to upload</p>
                                                <p className="text-xs text-slate-500">Improves score by up to 15 points</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="flex-1 bg-slate-800 px-6 py-3 rounded-full font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                                        <ChevronLeft className="w-5 h-5" /> Back
                                    </button>
                                    <button 
                                        onClick={nextStep} 
                                        disabled={!formData.income || !formData.expenses}
                                        className="flex-[2] btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        Next Component <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 text-center">
                                <div className="mb-8">
                                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Wallet className="w-10 h-10 text-indigo-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-white">Connect Your Wallet</h2>
                                    <p className="text-slate-400">Final step: Securely link your wallet to finalize tokens based on your KYC data.</p>
                                </div>

                                <div className="p-8 bg-slate-950/50 rounded-2xl border border-slate-800 flex flex-col items-center gap-6">
                                    <ConnectButton label="Authenticate Wallet" />
                                    {isConnected && (
                                        <div className="flex items-center gap-2 text-green-500 text-sm font-medium animate-pulse">
                                            <ShieldCheck className="w-4 h-4" /> Connected Successfully
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="flex-1 bg-slate-800 px-6 py-3 rounded-full font-semibold hover:bg-slate-700 transition-all">
                                        Back
                                    </button>
                                    <button 
                                        onClick={handleSubmitKYC}
                                        disabled={!isConnected || loading}
                                        className="flex-[2] btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'Calculating Score...' : 'Finish & View Score'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && result && (
                            <div className="space-y-8 text-center animate-in fade-in duration-700">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                                    <div className="relative w-48 h-48 mx-auto flex flex-col items-center justify-center border-4 border-indigo-500/30 rounded-full bg-slate-950/80">
                                        <span className="text-5xl font-extrabold gradient-text">{result.trustScore}</span>
                                        <span className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Trust Score</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold text-white">Onboarding Complete!</h2>
                                    <p className="text-slate-400">Based on your score, you have been allocated:</p>
                                </div>

                                <div className="p-6 glass-card rounded-2xl border-indigo-500/20 flex flex-col items-center">
                                    <div className="text-indigo-400 text-4xl font-black mb-1">{result.tokensIssued} Tokens</div>
                                    <div className="text-xs text-slate-500 font-medium">Mapped as Score × 10</div>
                                </div>

                                <div className="pt-4 border-t border-slate-800">
                                    <button className="w-full btn-primary" onClick={() => window.location.href = '/'}>
                                        Go to Dashboard
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AuthFlow;
