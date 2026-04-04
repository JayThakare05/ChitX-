import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  PlusCircle, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  BrainCircuit, 
  History, 
  Bell, 
  Settings,
  Plus
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Layers, label: 'My Pools', path: '/my-pools' },
  { icon: PlusCircle, label: 'Joint Pool', path: '/joint-pool' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: ShieldCheck, label: 'Trust Score', path: '/trust-score' },
  { icon: AlertCircle, label: 'Emergency Fund', path: '/emergency-fund' },
  { icon: BrainCircuit, label: 'AI Insights', path: '/ai-insights' },
  { icon: History, label: 'Transactions', path: '/transactions' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 h-full bg-white border-r border-slate-200 flex flex-col p-6 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800">Overview</h2>
        <p className="text-xs text-slate-400 font-medium tracking-tight">Protocol V2.0</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              location.pathname === item.path
                ? "bg-teal-50 text-teal-600 font-semibold"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            )}
          >
            <item.icon size={20} className={cn(
                "transition-colors",
                location.pathname === item.path ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      <button className="mt-auto bg-slate-900 text-white rounded-full py-3 px-6 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
        <Plus size={18} />
        <span className="font-semibold text-sm">New Proposal</span>
      </button>
    </div>
  );
};

export default Sidebar;
