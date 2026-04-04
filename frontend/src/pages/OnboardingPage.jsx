import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, FileText, Wallet, CheckCircle2,
  ChevronLeft, ChevronRight, DollarSign, Phone,
  TrendingUp, Upload, Info, Shield, Sparkles
} from 'lucide-react';

const STEPS = [
  { id: 0, label: 'Basic Info', icon: User },
  { id: 1, label: 'Financial KYC', icon: FileText },
  { id: 2, label: 'Wallet Setup', icon: Wallet },
  { id: 3, label: 'Result', icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    income: '',
    expenses: '',
    employmentType: 'Salaried',
    hasBankStatement: false,
    walletType: 'auto',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToDashboard = () => navigate('/dashboard');

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 500 : -500, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir) => ({ x: dir > 0 ? -500 : 500, opacity: 0, scale: 0.95 }),
  };

  return (
    <div className="min-h-screen bg-[#f4fcf9] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-[#134e4a]">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#1aa08c]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#134e4a]/10 blur-[100px]" />
        
        {/* Soft grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
          <defs>
            <pattern id="light-grid2" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#134e4a" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#light-grid2)" />
        </svg>
      </div>

      {/* Step Progress Indicator */}
      <div className="relative z-10 w-full max-w-[600px] mb-10">
        <div className="flex items-center justify-between relative">
          {/* Progress Line Background */}
          <div className="absolute top-6 left-[12%] right-[12%] h-[2px] bg-[#1aa08c]/20" />
          {/* Progress Line Active */}
          <motion.div
            className="absolute top-6 left-[12%] h-[2px] bg-gradient-to-r from-[#1aa08c] to-[#0d9488]"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / (STEPS.length - 1)) * 76}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />

          {STEPS.map((step, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center relative z-10 bg-[#f4fcf9] px-2">
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    borderColor: isActive ? '#1aa08c' : isCompleted ? '#1aa08c' : '#1aa08c',
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-gradient-to-br from-[#1aa08c] to-[#0d9488] border-[#1aa08c] text-white shadow-md shadow-[#1aa08c]/20'
                      : isActive
                      ? 'bg-white border-[#1aa08c] text-[#1aa08c] shadow-md shadow-[#1aa08c]/20'
                      : 'bg-white/50 border-[#1aa08c]/20 text-[#1aa08c]/40'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                </motion.div>
                <span className={`mt-3 text-xs font-bold transition-colors ${
                  isActive ? 'text-[#1aa08c]' : isCompleted ? 'text-[#1aa08c]/70' : 'text-[#134e4a]/40'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="relative z-10 w-full max-w-[600px]">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-[#1aa08c]/20 p-8 md:p-10 shadow-xl shadow-[#134e4a]/5 overflow-hidden min-h-[420px]">
          <AnimatePresence mode="wait" custom={direction}>
            
            {/* --- STEP 0: BASIC INFO --- */}
            {currentStep === 0 && (
              <StepContent key="step0" direction={direction} variants={slideVariants}>
                <StepHeader title="Let's get started" subtitle="Confirm your basic details to build your profile." />
                <div className="space-y-5 mt-8">
                  <InputField
                    label="Full Name"
                    icon={User}
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                  <InputField
                    label="Phone Number"
                    icon={Phone}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    type="tel"
                  />
                </div>
              </StepContent>
            )}

            {/* --- STEP 1: FINANCIAL KYC --- */}
            {currentStep === 1 && (
              <StepContent key="step1" direction={direction} variants={slideVariants}>
                <div className="flex items-start justify-between">
                  <StepHeader title="Financial Profile" subtitle="This data helps our AI calculate your Trust Score." />
                  <div className="w-12 h-12 rounded-2xl bg-[#1aa08c]/10 flex items-center justify-center text-[#1aa08c] shadow-inner border border-[#1aa08c]/20">
                    <TrendingUp size={24} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <InputField
                    label="Monthly Income"
                    icon={DollarSign}
                    name="income"
                    value={formData.income}
                    onChange={handleChange}
                    placeholder="50,000"
                    type="number"
                  />
                  <InputField
                    label="Expenses"
                    icon={DollarSign}
                    name="expenses"
                    value={formData.expenses}
                    onChange={handleChange}
                    placeholder="20,000"
                    type="number"
                  />
                </div>

                {/* Employment Type */}
                <div className="mt-8">
                  <label className="text-[#134e4a]/80 text-xs font-bold uppercase tracking-widest mb-3 block">Employment Type</label>
                  <div className="flex gap-3">
                    {['Student', 'Salaried', 'Business'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFormData(prev => ({ ...prev, employmentType: type }))}
                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold border-2 transition-all duration-300 ${
                          formData.employmentType === type
                            ? 'bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white border-[#1aa08c]/0 shadow-md shadow-[#1aa08c]/20'
                            : 'bg-white text-[#134e4a]/60 border-[#1aa08c]/20 hover:border-[#1aa08c]/50 hover:bg-[#1aa08c]/5'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Statement */}
                <div className="mt-6 bg-white rounded-2xl p-5 border-2 border-[#1aa08c]/10 hover:border-[#1aa08c]/20 transition-colors shadow-sm">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      name="hasBankStatement"
                      checked={formData.hasBankStatement}
                      onChange={handleChange}
                      className="mt-1 flex-shrink-0 w-5 h-5 rounded border-[#1aa08c]/40 text-[#1aa08c] focus:ring-[#1aa08c]/30 accent-[#1aa08c] cursor-pointer"
                    />
                    <div>
                      <span className="text-[#134e4a] text-sm font-bold block">I have a bank statement to upload</span>
                      <span className="text-[#134e4a]/60 text-xs mt-1 block leading-relaxed">Boost your Trust Score. Our AI will automatically parse the data securely.</span>
                    </div>
                  </label>
                </div>

                {formData.hasBankStatement && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4"
                  >
                    <div className="border-2 border-dashed border-[#1aa08c]/30 bg-[#1aa08c]/5 rounded-2xl p-8 text-center hover:border-[#1aa08c]/50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="text-[#1aa08c]" size={20} />
                      </div>
                      <p className="text-[#134e4a] text-sm font-bold">Drop your CSV here or click to browse</p>
                      <p className="text-[#1aa08c] text-xs mt-1 font-medium">Max 5MB · CSV format only</p>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-start gap-2 mt-6 p-4 bg-[#1aa08c]/10 rounded-xl text-[#134e4a]/70">
                  <Info size={16} className="text-[#1aa08c] mt-0.5 shrink-0" />
                  <span className="text-xs font-medium leading-relaxed">
                    CSV upload instantly runs our AI trust model and Groq-powered CIBIL estimation for a higher Trust Score.
                  </span>
                </div>
              </StepContent>
            )}

            {/* --- STEP 2: WALLET SETUP --- */}
            {currentStep === 2 && (
              <StepContent key="step2" direction={direction} variants={slideVariants}>
                <StepHeader title="Connect Wallet" subtitle="Choose how to secure your Web3 assets." />

                <div className="space-y-4 mt-8">
                  {/* Auto Wallet */}
                  <WalletOption
                    selected={formData.walletType === 'auto'}
                    onClick={() => setFormData(prev => ({ ...prev, walletType: 'auto' }))}
                    title="Auto-Create Wallet"
                    desc="We'll create a seamless invisible wallet using Web3Auth. No extensions needed."
                    icon={Sparkles}
                    badge="Recommended"
                  />

                  {/* MetaMask */}
                  <WalletOption
                    selected={formData.walletType === 'metamask'}
                    onClick={() => setFormData(prev => ({ ...prev, walletType: 'metamask' }))}
                    title="Connect MetaMask"
                    desc="Use your existing MetaMask extension via standard Web3 injection."
                    icon={Shield}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-8 py-4 rounded-xl bg-white border-2 border-[#1aa08c]/30 text-[#134e4a] font-bold text-sm flex items-center justify-center gap-2 hover:border-[#1aa08c] hover:bg-[#1aa08c]/5 shadow-sm transition-all"
                >
                  <Wallet size={18} className="text-[#1aa08c]" />
                  {formData.walletType === 'auto' ? 'Generate Secure Wallet' : 'Connect MetaMask Extension'}
                </motion.button>
              </StepContent>
            )}

            {/* --- STEP 3: RESULT --- */}
            {currentStep === 3 && (
              <StepContent key="step3" direction={direction} variants={slideVariants}>
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1aa08c] to-[#0d9488] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#1aa08c]/30"
                  >
                    <CheckCircle2 size={48} className="text-white" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-[#134e4a] mb-3"
                  >
                    You're All Set!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-[#134e4a]/70 mb-8 max-w-sm mx-auto font-medium"
                  >
                    Your profile has been created. Our AI is now calculating your Trust Score and Token Allocation.
                  </motion.p>

                  {/* Stats preview */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-3 gap-4 mb-10"
                  >
                    <div className="bg-white rounded-2xl p-4 border border-[#1aa08c]/20 shadow-sm">
                      <div className="text-2xl font-black text-[#1aa08c]">Cal...</div>
                      <div className="text-[#134e4a]/60 text-xs font-bold uppercase mt-1">Trust Score</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-[#1aa08c]/20 shadow-sm">
                      <div className="text-2xl font-black text-[#1aa08c]">---</div>
                      <div className="text-[#134e4a]/60 text-xs font-bold uppercase mt-1">Tokens</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-[#1aa08c]/20 shadow-sm">
                      <div className="text-2xl font-black text-[#1aa08c]">Wait</div>
                      <div className="text-[#134e4a]/60 text-xs font-bold uppercase mt-1">Risk Level</div>
                    </div>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={goToDashboard}
                    className="w-full py-4.5 rounded-xl bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1aa08c]/20 hover:shadow-xl hover:shadow-[#1aa08c]/30"
                  >
                    Go to Dashboard <ChevronRight size={18} />
                  </motion.button>
                </div>
              </StepContent>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons (Steps 0-2) */}
        {currentStep < 3 && (
          <div className="flex gap-4 mt-8 max-w-[500px] mx-auto px-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={currentStep === 0 ? () => navigate('/') : prevStep}
              className="w-1/3 py-2.5 rounded-full bg-white border border-[#1aa08c]/30 text-[#134e4a] font-bold text-sm flex items-center justify-center gap-2 hover:border-[#1aa08c]/60 shadow-sm transition-all"
            >
              <ChevronLeft size={16} /> Back
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={nextStep}
              className="w-2/3 flex-1 py-2.5 rounded-full bg-[#1aa08c] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-[#158876] transition-colors"
            >
              {currentStep === 2 ? 'Complete Setup' : 'Continue'} <ChevronRight size={16} />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Reusable Sub-Components ──── */

function StepContent({ children, direction, variants }) {
  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

function StepHeader({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#134e4a] mb-2">{title}</h2>
      <p className="text-[#134e4a]/70 text-sm font-medium">{subtitle}</p>
    </div>
  );
}

function InputField({ label, icon: Icon, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-[#134e4a]/80 text-xs font-bold uppercase tracking-widest mb-2 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1aa08c]" size={18} />
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-white border border-[#1aa08c]/20 rounded-xl py-3.5 pl-12 pr-4 text-[#134e4a] font-medium placeholder-[#134e4a]/30 focus:outline-none focus:border-[#1aa08c] focus:ring-2 focus:ring-[#1aa08c]/20 transition-all font-sans"
        />
      </div>
    </div>
  );
}

function WalletOption({ selected, onClick, title, desc, icon: Icon, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
        selected
          ? 'border-[#1aa08c] bg-[#1aa08c]/5 shadow-md shadow-[#1aa08c]/10'
          : 'border-[#1aa08c]/10 bg-white hover:border-[#1aa08c]/30 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          selected ? 'bg-gradient-to-br from-[#1aa08c] to-[#0d9488] text-white shadow-md' : 'bg-[#1aa08c]/10 text-[#1aa08c]'
        }`}>
          <Icon size={22} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[#134e4a] font-bold text-sm">{title}</span>
            {badge && (
              <span className="text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white px-2 py-0.5 rounded-full shadow-sm">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[#134e4a]/60 text-xs mt-1.5 font-medium leading-relaxed">{desc}</p>
        </div>
        {/* Radio indicator */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
          selected ? 'border-[#1aa08c]' : 'border-[#1aa08c]/30'
        }`}>
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#1aa08c]" />}
        </div>
      </div>
    </button>
  );
}
