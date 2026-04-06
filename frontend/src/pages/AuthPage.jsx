import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Shield, Zap, ArrowRight, ChevronRight, Lock
} from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', otp: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true); // Simulate sending OTP
    } else {
      if (isLogin) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  };

  const toggleMode = (loginMode) => {
    setIsLogin(loginMode);
    setOtpSent(false); // Reset OTP state if switching tabs
    setFormData({ name: '', phone: '', otp: '' });
  };

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 400 : -400, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction > 0 ? -400 : 400, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-[#f4fcf9] flex items-center justify-center p-4 relative overflow-hidden">
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
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#134e4a" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#light-grid)" />
        </svg>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative w-full max-w-[480px] z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1aa08c] to-[#134e4a] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#1aa08c]/20">
            C
          </div>
          <span className="text-2xl font-bold text-[#134e4a] tracking-tight">ChitX</span>
        </div>

        {/* Toggle Tabs (Only show if OTP not sent yet) */}
        {!otpSent && (
          <div className="flex bg-white/60 backdrop-blur-md rounded-2xl p-1.5 mb-6 border border-[#1aa08c]/20 shadow-sm">
            <button
              type="button"
              onClick={() => toggleMode(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${isLogin
                  ? 'bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white shadow-md shadow-[#1aa08c]/20'
                  : 'text-[#134e4a]/60 hover:text-[#134e4a]'
                }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => toggleMode(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${!isLogin
                  ? 'bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white shadow-md shadow-[#1aa08c]/20'
                  : 'text-[#134e4a]/60 hover:text-[#134e4a]'
                }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-[#1aa08c]/20 p-8 shadow-xl shadow-[#134e4a]/5 overflow-hidden">
          <AnimatePresence mode="wait" custom={isLogin ? -1 : 1}>

            {/* --- OTP Verification State --- */}
            {otpSent ? (
              <motion.div
                key="otp"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[#1aa08c]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="text-[#1aa08c]" size={28} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#134e4a] mb-2">Verify Phone</h2>
                  <p className="text-[#134e4a]/70 text-sm">
                    We sent a code to <span className="font-semibold">{formData.phone}</span>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-[#134e4a]/80 text-xs font-bold uppercase tracking-widest mb-2 block text-center">Enter OTP</label>
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      placeholder="• • • • • •"
                      className="w-full bg-white border border-[#1aa08c]/20 rounded-xl py-4 text-center text-2xl tracking-[0.5em] font-bold text-[#134e4a] placeholder-[#1aa08c]/30 focus:outline-none focus:border-[#1aa08c] focus:ring-2 focus:ring-[#1aa08c]/20 transition-all"
                      maxLength={6}
                      autoFocus
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1aa08c]/20 hover:shadow-xl hover:shadow-[#1aa08c]/30 transition-shadow"
                  >
                    Verify & Proceed <ArrowRight size={18} />
                  </motion.button>

                  <div className="text-center">
                    <button type="button" onClick={() => setOtpSent(false)} className="text-[#1aa08c] text-sm font-semibold hover:text-[#0d9488]">
                      Wrong number? Go back
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (


              /* --- LOGIN / SIGNUP STATE --- */
              <motion.div
                key={isLogin ? "login" : "signup"}
                custom={isLogin ? -1 : 1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[#134e4a] mb-2">
                    {isLogin ? "Welcome back" : "Create Account"}
                  </h2>
                  <p className="text-[#134e4a]/70 text-sm">
                    {isLogin ? "Sign in to your decentralized dashboard" : "Join ChitX to start your secure savings journey"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Name field (Only for Sign Up) */}
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="text-[#134e4a]/80 text-xs font-bold uppercase tracking-widest mb-2 block">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1aa08c]" size={18} />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="w-full bg-white border border-[#1aa08c]/20 rounded-xl py-3.5 pl-12 pr-4 text-[#134e4a] font-medium placeholder-[#134e4a]/30 focus:outline-none focus:border-[#1aa08c] focus:ring-2 focus:ring-[#1aa08c]/20 transition-all font-sans"
                            required={!isLogin}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Phone Number (Both) */}
                  <div>
                    <label className="text-[#134e4a]/80 text-xs font-bold uppercase tracking-widest mb-2 block">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1aa08c]" size={18} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white border border-[#1aa08c]/20 rounded-xl py-3.5 pl-12 pr-4 text-[#134e4a] font-medium placeholder-[#134e4a]/30 focus:outline-none focus:border-[#1aa08c] focus:ring-2 focus:ring-[#1aa08c]/20 transition-all font-sans"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1aa08c]/20 hover:shadow-xl hover:shadow-[#1aa08c]/30 transition-shadow mt-2"
                  >
                    Send OTP <ArrowRight size={16} />
                  </motion.button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-8">
                  <div className="flex-1 h-px bg-[#1aa08c]/20" />
                  <span className="text-[#134e4a]/50 text-xs font-bold uppercase tracking-wider">or connect with</span>
                  <div className="flex-1 h-px bg-[#1aa08c]/20" />
                </div>

                {/* Web3 Logins */}
                <button className="w-full py-3.5 rounded-xl border border-[#1aa08c]/20 bg-white text-[#134e4a] font-bold text-sm hover:border-[#1aa08c] hover:bg-[#f4fcf9] transition-all flex items-center justify-center gap-3 shadow-sm">
                  <Shield size={18} className="text-[#F6851B]" />
                  Continue with MetaMask
                </button>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
