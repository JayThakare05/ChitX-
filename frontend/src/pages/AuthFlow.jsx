import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Phone, Wallet, CheckCircle2, ChevronRight, ChevronLeft,
    DollarSign, FileText, TrendingUp, ShieldCheck, Info, UploadCloud, LogIn, UserPlus, Lock, ArrowRight
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthFlow = () => {
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();

    // Mode: 'login' = login flow, 'register' = registration flow
    const [authMode, setAuthMode] = useState('login');
    const [step, setStep] = useState(1); // Start directly at step 1 with the tab selector
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
            navigate('/'); // Instead of going back to mode selection, navigate to landing page
        } else {
            setStep(prev => prev - 1);
        }
    };

    const toggleMode = (isLogin) => {
        setAuthMode(isLogin ? 'login' : 'register');
        setStep(1);
        setError(null);
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
        <div className="min-h-screen bg-[#f4fcf9] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#1aa08c]/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#134e4a]/10 blur-[100px]" />
                
                {/* Soft floating shapes */}
                <motion.div
                    animate={{ y: [0, -30, 0], x: [0, 20, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-[10%] left-[15%] w-32 h-32 rounded-full bg-gradient-to-br from-[#1aa08c]/20 to-transparent blur-[30px]"
                />
                <motion.div
                    animate={{ y: [0, 40, 0], x: [0, -20, 0], rotate: [0, -10, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-[20%] right-[15%] w-48 h-48 rounded-full bg-gradient-to-br from-[#134e4a]/15 to-transparent blur-[40px]"
                />

                {/* Grid lines */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
                    <defs>
                        <pattern id="light-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#134e4a" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#light-grid)" />
                </svg>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="relative w-full max-w-xl z-10 flex flex-col items-center"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1aa08c] to-[#134e4a] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#1aa08c]/20">
                        C
                    </div>
                    <span className="text-2xl font-bold text-[#134e4a] tracking-tight">ChitX</span>
                </div>

                {/* Progress Stepper — only for Register flow > step 1 */}
                {authMode === 'register' && step > 1 && (
                    <div className="w-full mb-10">
                        <div className="flex justify-between items-center relative">
                            {regSteps.map((s) => (
                                <div key={s.id} className="z-10 flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                        step >= s.id ? 'bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white shadow-md shadow-[#1aa08c]/30' : 'bg-white text-[#134e4a]/40 border border-[#1aa08c]/20'
                                    }`}>
                                        {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-widest mt-2 font-bold ${step >= s.id ? 'text-[#134e4a]' : 'text-[#134e4a]/40'}`}>
                                        {s.title}
                                    </span>
                                </div>
                            ))}
                            <div className="absolute top-5 left-0 w-full h-[2px] bg-[#1aa08c]/20 -z-0">
                                <div className="h-full bg-gradient-to-r from-[#1aa08c] to-[#0d9488] transition-all duration-500" style={{ width: `${((step - 1) / (regSteps.length - 1)) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Toggle Tabs (Only show if at the very beginning of the flow, Step 1) */}
                {step === 1 && (
                    <div className="w-full flex bg-white/60 backdrop-blur-md rounded-2xl p-1.5 mb-6 border border-[#1aa08c]/20 shadow-sm max-w-[480px]">
                        <button
                            type="button"
                            onClick={() => toggleMode(true)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                authMode === 'login'
                                    ? 'bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white shadow-md shadow-[#1aa08c]/20'
                                    : 'text-[#134e4a]/60 hover:text-[#134e4a]'
                            }`}
                        >
                            Log In
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleMode(false)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                authMode === 'register'
                                    ? 'bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white shadow-md shadow-[#1aa08c]/20'
                                    : 'text-[#134e4a]/60 hover:text-[#134e4a]'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                {/* Form Card */}
                <div className="w-full bg-white/80 backdrop-blur-xl rounded-3xl border border-[#1aa08c]/20 p-8 shadow-xl shadow-[#134e4a]/5 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${authMode}-${step}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >

                        {/* ============ LOGIN FLOW (Step 1) ============ */}
                        {step === 1 && authMode === 'login' && (
                            <div className="space-y-6 text-center">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold mb-2 text-[#134e4a]">Welcome back</h2>
                                    <p className="text-[#134e4a]/70 text-sm">Sign in to your decentralized dashboard</p>
                                </div>

                                <div className="p-8 bg-white rounded-2xl border border-[#1aa08c]/20 shadow-sm flex flex-col items-center gap-6">
                                    <ConnectButton label="Connect MetaMask" />
                                    {isConnected && (
                                        <div className="flex items-center gap-2 text-[#1aa08c] text-sm font-bold animate-pulse">
                                            <ShieldCheck className="w-4 h-4" /> {address?.slice(0,6)}...{address?.slice(-4)} connected
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl text-left font-semibold">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="flex-1 bg-white border border-[#1aa08c]/20 px-6 py-4 rounded-xl font-bold hover:bg-[#f4fcf9] transition-all text-[#134e4a]/60">
                                        Cancel
                                    </button>
                                    <button onClick={handleLogin} disabled={!isConnected || loading}
                                        className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1aa08c]/20 hover:shadow-xl hover:shadow-[#1aa08c]/30 disabled:opacity-50 transition-shadow">
                                        {loading ? 'Verifying...' : 'Sign In'} <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============ REGISTER STEP 1: BASIC INFO ============ */}
                        {step === 1 && authMode === 'register' && (
                            <div className="space-y-6">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold mb-2 text-[#134e4a]">Create Account</h2>
                                    <p className="text-[#134e4a]/70 text-sm">Join ChitX to start your secure savings journey</p>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-[#134e4a]/80 text-xs font-bold uppercase tracking-widest mb-2 block">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1aa08c] w-5 h-5" />
                                            <input name="name" value={formData.name} onChange={handleInputChange} type="text" placeholder="John Doe"
                                                className="w-full bg-white border border-[#1aa08c]/20 rounded-xl py-3.5 pl-12 pr-4 text-[#134e4a] font-medium placeholder-[#134e4a]/30 focus:outline-none focus:border-[#1aa08c] focus:ring-2 focus:ring-[#1aa08c]/20 transition-all" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[#134e4a]/80 text-xs font-bold uppercase tracking-widest mb-2 block">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1aa08c] w-5 h-5" />
                                            <input name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="+91 9876543210"
                                                className="w-full bg-white border border-[#1aa08c]/20 rounded-xl py-3.5 pl-12 pr-4 text-[#134e4a] font-medium placeholder-[#134e4a]/30 focus:outline-none focus:border-[#1aa08c] focus:ring-2 focus:ring-[#1aa08c]/20 transition-all" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button onClick={nextStep} disabled={!formData.name || !formData.phone}
                                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1aa08c]/20 hover:shadow-xl hover:shadow-[#1aa08c]/30 disabled:opacity-50 transition-shadow">
                                        Continue <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============ REGISTER STEP 2: FINANCIAL KYC ============ */}
                        {step === 2 && authMode === 'register' && (
                            <div className="space-y-6">
                                <div className="mb-6 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2 text-[#134e4a]">Financial Profile</h2>
                                        <p className="text-[#134e4a]/70 text-sm">This data helps AI calculate your Trust Score.</p>
                                    </div>
                                    <div className="bg-[#1aa08c]/10 p-2 rounded-lg border border-[#1aa08c]/20">
                                        <TrendingUp className="text-[#1aa08c] w-6 h-6" />
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[#134e4a]/80 text-xs font-bold uppercase tracking-widest mb-2 block">Monthly Income</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1aa08c]" />
                                                <input disabled={file !== null} name="income" value={formData.income} onChange={handleInputChange} type="number"
                                                    placeholder={file ? "AI Managed" : "50000"}
                                                    className="w-full bg-white border border-[#1aa08c]/20 rounded-xl py-3.5 pl-10 pr-4 text-[#134e4a] font-medium focus:outline-none focus:ring-2 focus:ring-[#1aa08c]/20 disabled:opacity-50 transition-all cursor-text disabled:cursor-not-allowed" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[#134e4a]/80 text-xs font-bold uppercase tracking-widest mb-2 block">Expenses</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1aa08c]" />
                                                <input disabled={file !== null} name="expenses" value={formData.expenses} onChange={handleInputChange} type="number"
                                                    placeholder={file ? "AI Managed" : "20000"}
                                                    className="w-full bg-white border border-[#1aa08c]/20 rounded-xl py-3.5 pl-10 pr-4 text-[#134e4a] font-medium focus:outline-none focus:ring-2 focus:ring-[#1aa08c]/20 disabled:opacity-50 transition-all cursor-text disabled:cursor-not-allowed" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[#134e4a]/80 text-xs font-bold uppercase tracking-widest mb-2 block">Employment Type</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Student', 'Salaried', 'Business'].map(type => (
                                                <button key={type}
                                                    onClick={() => setFormData(prev => ({ ...prev, employment: type }))}
                                                    className={`py-2 px-3 rounded-xl border text-sm font-bold transition-all ${
                                                        formData.employment === type 
                                                        ? 'bg-gradient-to-r from-[#1aa08c] to-[#0d9488] border-transparent text-white shadow-md' 
                                                        : 'bg-white border-[#1aa08c]/20 text-[#134e4a]/60 hover:text-[#1aa08c] hover:border-[#1aa08c]/40'
                                                    }`}>
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CSV Upload */}
                                    <div className="pt-5 border-t border-[#1aa08c]/10 mt-5 space-y-4">
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#f4fcf9] border border-[#1aa08c]/20 cursor-pointer hover:border-[#1aa08c]/40 hover:bg-[#ebf8f4] transition-all"
                                             onClick={() => {
                                                 if (formData.hasBankStatement) { setFile(null); }
                                                 setFormData(prev => ({ ...prev, hasBankStatement: !prev.hasBankStatement }));
                                             }}>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.hasBankStatement ? 'bg-[#1aa08c] border-[#1aa08c]' : 'bg-white border-[#1aa08c]/30'}`}>
                                                {formData.hasBankStatement && <CheckCircle2 className="w-4 h-4 text-white" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#134e4a]">I have a bank statement to upload</p>
                                                <p className="text-xs font-medium text-[#134e4a]/60">AI will parse your CSV and run the ML trust model</p>
                                            </div>
                                        </div>

                                        {formData.hasBankStatement && (
                                            <motion.label initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                className="flex items-center gap-3 p-4 rounded-xl bg-white border border-[#1aa08c]/20 cursor-pointer hover:shadow-md transition-all relative overflow-hidden group">
                                                <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                                                <div className="bg-[#1aa08c]/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                                    {file ? <CheckCircle2 className="w-6 h-6 text-[#1aa08c]" /> : <UploadCloud className="w-6 h-6 text-[#1aa08c]" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#134e4a]">{file ? file.name : "Select CSV File..."}</p>
                                                    <p className="text-xs font-medium text-[#134e4a]/60">{file ? "File ready for AI extraction" : "Click to upload bank statement"}</p>
                                                </div>
                                            </motion.label>
                                        )}
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#134e4a]/40 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> CSV upload runs ML trust model + Groq CIBIL estimation</p>
                                    </div>
                                    
                                    {error && <div className="text-red-500 font-semibold text-sm">{error}</div>}
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button onClick={prevStep} className="flex-1 bg-white border border-[#1aa08c]/20 px-6 py-4 rounded-xl font-bold hover:bg-[#f4fcf9] transition-all text-[#134e4a]/60">
                                        <ChevronLeft className="w-5 h-5 inline" /> Back
                                    </button>
                                    <button onClick={processFinancials}
                                        disabled={loading || (formData.hasBankStatement && !file) || (!formData.hasBankStatement && (!formData.income || !formData.expenses))}
                                        className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1aa08c]/20 hover:shadow-xl hover:shadow-[#1aa08c]/30 disabled:opacity-50 transition-shadow">
                                        {loading ? 'Processing AI...' : 'Next'} <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============ REGISTER STEP 3: WALLET CONNECT ============ */}
                        {step === 3 && authMode === 'register' && (
                            <div className="space-y-6 text-center">
                                <div className="mb-6">
                                    <div className="w-20 h-20 bg-[#1aa08c]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Wallet className="w-10 h-10 text-[#1aa08c]" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-[#134e4a]">Connect Your Wallet</h2>
                                    <p className="text-[#134e4a]/70 text-sm">Final step: Link your MetaMask wallet to bind it to your ChitX account.</p>
                                </div>

                                <div className="p-8 bg-white border border-[#1aa08c]/20 rounded-2xl shadow-sm flex flex-col items-center gap-6">
                                    <ConnectButton label="Authenticate Wallet" />
                                    {isConnected && (
                                        <div className="flex items-center gap-2 text-[#1aa08c] text-sm font-bold animate-pulse">
                                            <ShieldCheck className="w-4 h-4" /> Connected: {address?.slice(0,6)}...{address?.slice(-4)}
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl font-semibold">{error}</div>
                                )}

                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="flex-1 bg-white border border-[#1aa08c]/20 px-6 py-4 rounded-xl font-bold hover:bg-[#f4fcf9] transition-all text-[#134e4a]/60">
                                        Back
                                    </button>
                                    <button onClick={handleSubmitKYC} disabled={!isConnected || loading}
                                        className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1aa08c]/20 hover:shadow-xl hover:shadow-[#1aa08c]/30 disabled:opacity-50 transition-shadow">
                                        {loading ? 'Calculating Score...' : 'Finish & View Score'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============ REGISTER STEP 4: RESULT ============ */}
                        {step === 4 && authMode === 'register' && result && (
                            <div className="space-y-8 text-center animate-in fade-in duration-700">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[#1aa08c]/20 blur-3xl rounded-full" />
                                    <div className="relative w-48 h-48 mx-auto flex flex-col items-center justify-center border-[6px] border-white rounded-full bg-gradient-to-br from-[#1aa08c] to-[#0d9488] shadow-2xl shadow-[#1aa08c]/40">
                                        <span className="text-5xl font-extrabold text-white">{result.trustScore}</span>
                                        <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1">Trust Score</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold text-[#134e4a]">Onboarding Complete!</h2>
                                    <p className="text-[#134e4a]/70 font-medium">Based on your score, you have been allocated:</p>
                                </div>

                                <div className="p-6 bg-[#f4fcf9] rounded-2xl border border-[#1aa08c]/20 flex flex-col items-center">
                                    <div className="text-transparent bg-clip-text bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-5xl font-black mb-2">
                                        {result.trustScore * 10} CTX
                                    </div>
                                    <div className="text-[10px] text-[#1aa08c] uppercase tracking-widest font-bold mb-6">Allocated securely on-chain</div>
                                    
                                    <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-[#1aa08c]/10 text-left w-full shadow-sm">
                                        <Info className="w-5 h-5 text-[#1aa08c] shrink-0 mt-0.5" />
                                        <p className="text-xs text-[#134e4a]/70 leading-relaxed font-medium">
                                            <span className="font-bold text-[#134e4a]">CTX</span> is the native utility and governance token of ChitX, used for pool staking and trust verification.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button className="w-full py-4 rounded-xl bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white font-bold text-sm shadow-lg shadow-[#1aa08c]/20 hover:shadow-xl hover:shadow-[#1aa08c]/30 transition-shadow" onClick={() => {
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
            </motion.div>
        </div>
    );
};

export default AuthFlow;
