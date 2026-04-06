import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Coins, 
  History,
  Info 
} from 'lucide-react';

const GlobalChatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'I am the ChitX Oracle. How can I help you navigate your decentralized journey today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Gather context
      const userStr = localStorage.getItem('chitx_user');
      const user = userStr ? JSON.parse(userStr) : {};
      const userWallet = user.walletAddress?.toLowerCase();

      // Fetch fresh context
      let transactions = [];
      let pools = [];
      
      if (userWallet) {
        try {
          const [txnRes, poolRes] = await Promise.all([
            fetch(`http://localhost:5000/api/transactions/${userWallet}`),
            fetch(`http://localhost:5000/api/pools/user/${userWallet}`)
          ]);
          
          if (txnRes.ok) transactions = (await txnRes.json()).transactions || [];
          if (poolRes.ok) pools = (await poolRes.json()).pools || [];
        } catch (ctxErr) {
          console.error("Context fetch failed:", ctxErr);
        }
      }

      const response = await fetch('http://localhost:8000/ai/global-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.slice(1).map(m => ({ role: m.role, content: m.content })),
          context: {
            user: {
              name: user.name || 'Member',
              trustScore: user.trustScore,
              income: user.income,
              expenses: user.expenses,
              ctxBalance: user.walletBalance || 0
            },
            transactions,
            pools
          }
        })
      });

      const data = await response.json();
      if (data.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error(data.response);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but my connection to the ChitX Oracle mesh is temporarily unstable. Please try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-[60]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[500px] lg:w-[600px] bg-white/80 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.1)] z-[70] flex flex-col font-['Outfit',_sans-serif]"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/60 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1aa08c] to-[#0d9488] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#1aa08c]/20">
                  <Bot size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">ChitX Oracle</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">System Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30"
            >
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border shadow-sm ${
                      msg.role === 'user' 
                      ? 'bg-white border-slate-200 text-slate-500' 
                      : 'bg-[#1aa08c]/10 border-[#1aa08c]/20 text-[#1aa08c]'
                    }`}>
                      {msg.role === 'user' ? <div className="font-bold text-[10px]">YOU</div> : <Sparkles size={18} />}
                    </div>
                    <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                      ? 'bg-[#134e4a] text-white shadow-xl shadow-[#134e4a]/10 rounded-tr-none'
                      : 'bg-white border border-white shadow-md text-slate-700 rounded-tl-none'
                    }`}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-3">
                              <table className="min-w-full border-collapse border border-slate-200" {...props} />
                            </div>
                          ),
                          th: ({node, ...props}) => <th className="border border-slate-200 px-3 py-2 bg-slate-50 text-left font-bold" {...props} />,
                          td: ({node, ...props}) => <td className="border border-slate-200 px-3 py-2 text-slate-600" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-[#134e4a]" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-5 space-y-1 my-3" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal ml-5 space-y-1 my-3" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold my-4 border-b pb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold my-3 text-slate-800" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-md font-bold my-2 text-slate-800" {...props} />,
                          p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                          code: ({node, inline, ...props}) => (
                            inline 
                            ? <code className="bg-slate-100 px-1 rounded text-[#1aa08c]" {...props} />
                            : <code className="block bg-slate-100 p-3 rounded-lg overflow-x-auto my-3 text-sm" {...props} />
                          )
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-4 w-full">
                    <div className="w-10 h-10 bg-[#1aa08c]/10 rounded-xl flex items-center justify-center text-[#1aa08c] animate-pulse border border-[#1aa08c]/20 shrink-0">
                      <Bot size={18} />
                    </div>
                    <div className="flex-1 max-w-[85%] bg-white/40 backdrop-blur-md rounded-2xl p-5 border border-white/60 relative overflow-hidden group">
                      {/* Scanning Line Animation */}
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#1aa08c]/10 to-transparent pointer-events-none"
                      />
                      
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-[#1aa08c] rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-[#1aa08c] rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-[#1aa08c] rounded-full animate-bounce" />
                        </div>
                        <span className="text-[10px] font-bold text-[#1aa08c] uppercase tracking-widest animate-pulse">
                          Scanning Oracle Mesh...
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-3/4 bg-slate-200/50 rounded-full overflow-hidden relative">
                         <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="h-full bg-[#1aa08c]/20"
                         />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            {messages.length === 1 && (
              <div className="px-8 py-6 flex flex-wrap gap-2">
                {[
                  { icon: History, label: 'Recent Transactions' },
                  { icon: Coins, label: 'Pool Eligibility' },
                  { icon: Info, label: 'How to contribute?' }
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(item.label)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white border border-white/60 rounded-xl text-xs font-semibold text-slate-600 transition-all shadow-sm active:scale-95"
                  >
                    <item.icon size={14} className="text-[#1aa08c]" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area - Lifted Up More */}
            <div className="px-8 pb-16 pt-8 border-t border-white/60 bg-white/20">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask the Oracle anything..."
                  className="w-full bg-white border border-white/80 rounded-2xl pl-6 pr-16 py-5 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 ring-teal-500/5 focus:bg-white transition-all shadow-inner"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#134e4a] hover:bg-black text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="mt-4 text-[10px] text-center text-slate-400 font-bold tracking-[0.2em] uppercase">
                Secure Oracle Connection Established
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalChatbot;
