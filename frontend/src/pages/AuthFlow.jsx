import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Phone, Wallet, CheckCircle2, ChevronRight, ChevronLeft,
    DollarSign, FileText, TrendingUp, ShieldCheck, Info, UploadCloud, LogIn, UserPlus
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthFlow = () => {
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();

    // Mode: null = choosing, 'login' = login flow, 'register' = registration flow
    const [authMode, setAuthMode] = useState(null);
    const [step, setStep] = useState(0); // 0 = mode selection
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    // Form State (Register only)
    const [formData, setFormData] = useState({
        name: '', phone: '', income: '', expenses: '',
        employment: 'Salaried', hasBankStatement: false
    });
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [bankStatementSessionKey, setBankStatementSessionKey] = useState(null);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => {
        if (step === 1) {
            setStep(0);
            setAuthMode(null);
            setError(null);
        } else {
            setStep(prev => prev - 1);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setFormData(prev => ({ ...prev, hasBankStatement: true }));
        }
    };

    // ==================== LOGIN FLOW ====================
    const handleLogin = async () => {
        if (!isConnected || !address) {
            setError('Please connect your MetaMask wallet first.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                walletAddress: address
            });
            // User found — save session and go to dashboard
            localStorage.setItem('chitx_user', JSON.stringify({
                name: res.data.user.name,
                trustScore: res.data.user.trustScore,
                airdropAmount: res.data.user.tokensIssued,
                walletAddress: res.data.user.walletAddress,
                income: res.data.user.income || 0,
                expenses: res.data.user.expenses || 0,
                employment: res.data.user.employment || 'Salaried',
                hasBankStatement: res.data.user.hasBankStatement || false,
            }));
            navigate('/dashboard');
        } catch (err) {
            if (err.response?.status === 404) {
                setError('This wallet is not registered with ChitX. Please register first to bind your MetaMask to your account.');
            } else {
                setError(err.response?.data?.error || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ==================== REGISTER: Process CSV ====================
    const processFinancials = async () => {
        if (formData.hasBankStatement && file) {
            setLoading(true);
            setError(null);
            try {
                const formParams = new FormData();
                formParams.append('statement', file);
                const res = await axios.post('http://localhost:5000/api/auth/upload-statement', formParams);
                setParsedData(res.data.data);
                // Store the session key so we can link the bank statement to the wallet on final submit
                if (res.data.sessionKey) {
                    setBankStatementSessionKey(res.data.sessionKey);
                }
                setFormData(prev => ({
                    ...prev,
                    income: res.data.data.income,
                    expenses: res.data.data.expenses
                }));
                nextStep();
            } catch (err) {
                setError('Failed to parse statement. Ensure backend & AI service are running.');
            } finally {
                setLoading(false);
            }
        } else {
            nextStep();
        }
    };

    // ==================== REGISTER: Submit KYC ====================
    const handleSubmitKYC = async () => {
        setLoading(true);
        setError(null);
        try {
            const trustScore = parsedData ? parsedData.trustScore : 0;
            const response = await axios.post('http://localhost:5000/api/auth/onboarding', {
                ...formData,
                walletAddress: address,
                trustScore,
                // Forward the session key so the backend links the stored bank statement to this wallet
                ...(bankStatementSessionKey ? { bankStatementSessionKey } : {})
            });

            localStorage.setItem('chitx_user', JSON.stringify({
                trustScore: trustScore || response.data.trustScore,
                airdropAmount: response.data.user?.tokensIssued || (response.data.trustScore * 10),
                walletAddress: address,
                name: formData.name,
                income: Number(formData.income) || 0,
                expenses: Number(formData.expenses) || 0,
                employment: formData.employment || 'Salaried',
                hasBankStatement: formData.hasBankStatement || false,
            }));

            setResult(response.data);
            nextStep();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to process KYC. Make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    // Registration steps for the stepper
    const regSteps = [
        { id: 1, title: 'Basic Info', icon: <User className="w-5 h-5" /> },
        { id: 2, title: 'Financial KYC', icon: <FileText className="w-5 h-5" /> },
        { id: 3, title: 'Wallet Setup', icon: <Wallet className="w-5 h-5" /> },
        { id: 4, title: 'Result', icon: <CheckCircle2 className="w-5 h-5" /> }
    ];

    return (
        <div className="min-h-screen pt-20 pb-12 px-6 flex flex-col items-center">
            
            {/* Progress Stepper — only for Register flow */}
            {authMode === 'register' && step > 0 && (
                <div className="w-full max-w-2xl mb-12">
                    <div className="flex justify-between items-center relative">
                        {regSteps.map((s) => (
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
                        <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-800 -z-0">
                            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((step - 1) / (regSteps.length - 1)) * 100}%` }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Form Container */}
            <div className="w-full max-w-xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${authMode}-${step}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-card rounded-3xl p-8 lg:p-10"
                    >

                        {/* ============ STEP 0: MODE SELECTION ============ */}
                        {step === 0 && (
                            <div className="space-y-6 text-center">
                                <div className="mb-8">
                                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Wallet className="w-10 h-10 text-indigo-500" />
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2 text-white">Welcome to ChitX</h2>
                                    <p className="text-slate-400">Choose how you'd like to continue.</p>
                                </div>

                                <div className="space-y-4">
                                    <button 
                                        onClick={() => { setAuthMode('login'); setStep(1); }}
                                        className="w-full p-4 rounded-xl border border-indigo-500/30 hover:border-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all flex items-center gap-4 group"
                                    >
                                        <div className="p-3 bg-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                                            <LogIn className="w-6 h-6 text-white"/>
                                        </div>
                                        <div className="text-left flex-1">
                                            <h3 className="text-indigo-400 font-bold text-lg">Login</h3>
                                            <p className="text-indigo-300/70 text-sm">Sign in with your registered MetaMask wallet</p>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => { setAuthMode('register'); setStep(1); }}
                                        className="w-full p-4 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800 transition-all flex items-center gap-4 group"
                                    >
                                        <div className="p-3 bg-slate-700 rounded-lg group-hover:scale-110 transition-transform">
                                            <UserPlus className="w-6 h-6 text-white"/>
                                        </div>
                                        <div className="text-left flex-1">
                                            <h3 className="text-white font-bold text-lg">Register</h3>
                                            <p className="text-slate-400 text-sm">Create a new account, build your trust score & earn CTX</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============ LOGIN FLOW (Step 1) ============ */}
                        {step === 1 && authMode === 'login' && (
                            <div className="space-y-6 text-center">
                                <div className="mb-8">
                                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <LogIn className="w-10 h-10 text-indigo-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-white">Welcome Back</h2>
                                    <p className="text-slate-400">Connect your MetaMask wallet to sign in.</p>
                                </div>

                                <div className="p-8 bg-slate-950/50 rounded-2xl border border-slate-800 flex flex-col items-center gap-6">
                                    <ConnectButton label="Connect MetaMask" />
                                    {isConnected && (
                                        <div className="flex items-center gap-2 text-green-500 text-sm font-medium animate-pulse">
                                            <ShieldCheck className="w-4 h-4" /> {address?.slice(0,6)}...{address?.slice(-4)} connected
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-left">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="flex-1 bg-slate-800 px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-all text-white">
                                        Back
                                    </button>
                                    <button onClick={handleLogin} disabled={!isConnected || loading}
                                        className="flex-[2] btn-primary disabled:opacity-50 flex items-center justify-center gap-2">
                                        {loading ? 'Verifying...' : 'Sign In'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============ REGISTER STEP 1: BASIC INFO ============ */}
                        {step === 1 && authMode === 'register' && (
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
                                            <input name="name" value={formData.name} onChange={handleInputChange} type="text" placeholder="John Doe"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-400 mb-1.5 block">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                                            <input name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="+91 9876543210"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-4">
                                    <button onClick={prevStep} className="flex-1 bg-slate-800 px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-all text-white">
                                        Back
                                    </button>
                                    <button onClick={nextStep} disabled={!formData.name || !formData.phone}
                                        className="flex-[2] btn-primary disabled:opacity-50 flex items-center justify-center gap-2">
                                        Continue <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============ REGISTER STEP 2: FINANCIAL KYC ============ */}
                        {step === 2 && authMode === 'register' && (
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
                                                <input disabled={file !== null} name="income" value={formData.income} onChange={handleInputChange} type="number"
                                                    placeholder={file ? "AI Managed" : "50000"}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-400 mb-1.5 block">Expenses</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                                                <input disabled={file !== null} name="expenses" value={formData.expenses} onChange={handleInputChange} type="number"
                                                    placeholder={file ? "AI Managed" : "20000"}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-400 mb-1.5 block">Employment Type</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Student', 'Salaried', 'Business'].map(type => (
                                                <button key={type}
                                                    onClick={() => setFormData(prev => ({ ...prev, employment: type }))}
                                                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                                                        formData.employment === type 
                                                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                                    }`}>
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CSV Upload */}
                                    <div className="pt-4 border-t border-slate-800 mt-4 space-y-4">
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer hover:border-indigo-500/30 transition-all"
                                             onClick={() => {
                                                 if (formData.hasBankStatement) { setFile(null); }
                                                 setFormData(prev => ({ ...prev, hasBankStatement: !prev.hasBankStatement }));
                                             }}>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.hasBankStatement ? 'bg-indigo-600 border-indigo-500' : 'border-slate-700'}`}>
                                                {formData.hasBankStatement && <CheckCircle2 className="w-4 h-4 text-white" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">I have a bank statement to upload</p>
                                                <p className="text-xs text-slate-500">AI will parse your CSV and run the ML trust model</p>
                                            </div>
                                        </div>

                                        {formData.hasBankStatement && (
                                            <motion.label initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/10 transition-all relative overflow-hidden group">
                                                <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                                                <div className="bg-indigo-500/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                                    {file ? <CheckCircle2 className="w-6 h-6 text-indigo-400" /> : <UploadCloud className="w-6 h-6 text-indigo-400" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-indigo-300">{file ? file.name : "Select CSV File..."}</p>
                                                    <p className="text-xs text-indigo-400/70">{file ? "File ready for AI extraction" : "Click to upload bank statement"}</p>
                                                </div>
                                            </motion.label>
                                        )}
                                        <p className="text-xs text-slate-500 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> CSV upload runs ML trust model + Groq CIBIL estimation</p>
                                    </div>
                                    
                                    {error && <div className="text-red-400 text-sm">{error}</div>}
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="flex-1 bg-slate-800 px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-all text-white">
                                        <ChevronLeft className="w-5 h-5 inline" /> Back
                                    </button>
                                    <button onClick={processFinancials}
                                        disabled={loading || (formData.hasBankStatement && !file) || (!formData.hasBankStatement && (!formData.income || !formData.expenses))}
                                        className="flex-[2] btn-primary disabled:opacity-50 flex items-center justify-center gap-2">
                                        {loading ? 'Processing AI...' : 'Next'} <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============ REGISTER STEP 3: WALLET CONNECT ============ */}
                        {step === 3 && authMode === 'register' && (
                            <div className="space-y-6 text-center">
                                <div className="mb-8">
                                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Wallet className="w-10 h-10 text-indigo-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-white">Connect Your Wallet</h2>
                                    <p className="text-slate-400">Final step: Link your MetaMask wallet to bind it to your ChitX account.</p>
                                </div>

                                <div className="p-8 bg-slate-950/50 rounded-2xl border border-slate-800 flex flex-col items-center gap-6">
                                    <ConnectButton label="Authenticate Wallet" />
                                    {isConnected && (
                                        <div className="flex items-center gap-2 text-green-500 text-sm font-medium animate-pulse">
                                            <ShieldCheck className="w-4 h-4" /> Connected: {address?.slice(0,6)}...{address?.slice(-4)}
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{error}</div>
                                )}

                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="flex-1 bg-slate-800 px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-all text-white">
                                        Back
                                    </button>
                                    <button onClick={handleSubmitKYC} disabled={!isConnected || loading}
                                        className="flex-[2] btn-primary disabled:opacity-50 flex items-center justify-center gap-2">
                                        {loading ? 'Calculating Score...' : 'Finish & View Score'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============ REGISTER STEP 4: RESULT ============ */}
                        {step === 4 && authMode === 'register' && result && (
                            <div className="space-y-8 text-center animate-in fade-in duration-700">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                                    <div className="relative w-48 h-48 mx-auto flex flex-col items-center justify-center border-4 border-indigo-500/30 rounded-full bg-slate-950/80 shadow-2xl shadow-indigo-500/20">
                                        <span className="text-5xl font-extrabold gradient-text">{result.trustScore}</span>
                                        <span className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Trust Score</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold text-white">Onboarding Complete!</h2>
                                    <p className="text-slate-400">Based on your score, you have been allocated:</p>
                                </div>

                                <div className="p-6 glass-card rounded-2xl border-indigo-500/20 flex flex-col items-center">
                                    <div className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 text-5xl font-black mb-2">
                                        {result.trustScore * 10} CTX
                                    </div>
                                    <div className="text-sm text-indigo-200/60 font-medium tracking-wide mb-6">Allocated securely on-chain</div>
                                    
                                    <div className="flex items-start gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-left w-full">
                                        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            <span className="font-semibold text-slate-300">CTX</span> is the native utility and governance token of ChitX, used for pool staking and trust verification.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800">
                                    <button className="w-full btn-primary" onClick={() => {
                                        localStorage.setItem('chitx_user', JSON.stringify({
                                            trustScore: result.trustScore,
                                            airdropAmount: result.trustScore * 10,
                                            walletAddress: address,
                                            name: formData.name,
                                            income: Number(formData.income) || 0,
                                            expenses: Number(formData.expenses) || 0,
                                            employment: formData.employment || 'Salaried',
                                            hasBankStatement: formData.hasBankStatement || false,
                                        }));
                                        navigate('/dashboard');
                                    }}>
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
