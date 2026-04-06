import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import GlobalChatbot from '../features/GlobalChatbot';
import { Bot } from 'lucide-react';

const Layout = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-800">
      <Sidebar onOpenChat={() => setIsChatOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-12">
            {children}
          </div>
        </main>
      </div>
      
      {/* Floating Action Button - AI Oracle (Hidden when chat is open) */}
      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-[#134e4a] text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-900/40 hover:scale-110 active:scale-95 transition-all z-[80] group"
        >
          <Bot size={28} className="group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Global Chatbot Panel */}
      <GlobalChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
};

export default Layout;
