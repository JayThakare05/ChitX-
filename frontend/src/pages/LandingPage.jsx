import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Users, ArrowRight, Wallet, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            {/* Navigation (Transparent) */}
            <nav className="p-8 flex justify-between items-center max-w-7xl mx-auto">
                <div className="text-2xl font-bold flex items-center gap-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <TrendingUp className="text-white" />
                    </div>
                    <span>Chit<span className="text-indigo-500">X</span></span>
                </div>
                <div className="hidden md:flex gap-8 text-slate-400 font-medium">
                    <a href="#" className="hover:text-white transition-colors">How it works</a>
                    <a href="#" className="hover:text-white transition-colors">Pools</a>
                    <a href="#" className="hover:text-white transition-colors">Safety</a>
                </div>
                <button 
                  onClick={() => navigate('/onboarding')}
                  className="bg-slate-800 border border-slate-700 px-6 py-2.5 rounded-full hover:bg-slate-700 transition-all font-semibold"
                >
                    Get Started
                </button>
            </nav>

            {/* Hero Section */}
            <section className="pt-20 pb-32 px-8 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold mb-6">
                            Next-Gen ROSCA Platform
                        </span>
                        <h1 className="text-5xl lg:text-7xl font-extrabold mb-8 leading-[1.1] text-white">
                            AI-Governed <br />
                            <span className="gradient-text">Decentralized</span> <br />
                            Chit Funds.
                        </h1>
                        <p className="text-slate-400 text-xl mb-10 max-w-lg leading-relaxed">
                            A secure, transparent, and fair system where trust is calculated, not assumed. Join decentralized pools governed by autonomous intelligence.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={() => navigate('/onboarding')}
                                className="btn-primary flex items-center justify-center gap-2 group"
                            >
                                Start Your Journey 
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="bg-slate-800/50 border border-slate-700 px-8 py-4 rounded-full font-semibold hover:bg-slate-800 transition-all">
                                Explainer Video
                            </button>
                        </div>
                        
                        <div className="mt-12 flex items-center gap-6">
                             <div className="flex -space-x-3">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800 overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 12}`} alt="Avatar" />
                                    </div>
                                ))}
                             </div>
                             <p className="text-slate-500 text-sm">
                                Join <span className="text-white font-bold">2,000+</span> trust-verified members
                             </p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="glass-card rounded-[2.5rem] p-8 border-indigo-500/10 relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-xl">Pool Intelligence</h3>
                                <div className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-mono border border-green-500/20">
                                    LIVE MONITORING
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-slate-400">Yield Opportunity</span>
                                        <span className="text-xs font-bold text-indigo-400">Tier A++</span>
                                    </div>
                                    <div className="text-2xl font-bold">18.4% APY</div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                        <div className="text-xs text-slate-500 mb-1">Total Assets</div>
                                        <div className="font-bold">$234.5k</div>
                                    </div>
                                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                        <div className="text-xs text-slate-500 mb-1">Active Pools</div>
                                        <div className="font-bold">42</div>
                                    </div>
                                </div>

                                <div className="p-6 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
                                     <div className="flex items-center gap-3 mb-4">
                                         <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                             <Shield className="w-4 h-4 text-white" />
                                         </div>
                                         <div className="font-semibold">Trust Verification Result</div>
                                     </div>
                                     <div className="space-y-3">
                                         <div className="flex items-center gap-3 text-sm text-slate-300">
                                             <Check className="w-4 h-4 text-green-500" />
                                             Income verification complete
                                         </div>
                                         <div className="flex items-center gap-3 text-sm text-slate-300">
                                             <Check className="w-4 h-4 text-green-500" />
                                             Default risk: <span className="text-green-400 font-bold ml-1">0.02%</span>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating elements */}
                        <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute -top-6 -right-6 p-4 glass-card rounded-2xl border-white/5 shadow-2xl"
                        >
                            <Wallet className="w-8 h-8 text-indigo-400" />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Preview */}
            <section className="py-20 px-8 bg-slate-950/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Shield className="text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold">Immutable Trust</h3>
                        <p className="text-slate-500 leading-relaxed">
                            No human foreman means zero corruption. Smart contracts handle payments and payouts automatically.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <TrendingUp className="text-purple-500" />
                        </div>
                        <h3 className="text-xl font-bold">AI Fairness Engine</h3>
                        <p className="text-slate-500 leading-relaxed">
                            Our proprietary algorithm evaluates participation behavior to ensure fair group rotation.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Users className="text-indigo-500" />
                        </div>
                        <h3 className="text-xl font-bold">Flexible Pools</h3>
                        <p className="text-slate-500 leading-relaxed">
                            Join pools that match <i>your</i> financial profile, from small beginner groups to high-value circles.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
