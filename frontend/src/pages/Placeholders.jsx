import React from 'react';

const PageContainer = ({ title, description }) => (
  <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center text-center p-16 bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[60vh]">
    <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-6 border border-teal-100/50">
      <span className="text-2xl font-black text-teal-600 uppercase tracking-widest">
        {title.substring(0, 2)}
      </span>
    </div>
    <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-3">{title}</h2>
    <p className="text-slate-500 font-medium max-w-md leading-relaxed">{description}</p>

    <button className="mt-8 px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold transition-colors text-sm border border-slate-200">
      Coming Soon
    </button>
  </div>
);

export const EmergencyFund = () => <PageContainer title="Emergency Fund" description="Access or contribute to the platform's multi-sig backed emergency safety net." />;

export const AIInsightsPage = () => <PageContainer title="AI Analytics" description="Deep dive into Luminous AI Oracle recommendations and predictive yield analytics." />;

export const TransactionsLog = () => <PageContainer title="Transactions Log" description="A complete, auditable on-chain history of every interaction your wallet has made across protocols." />;

export const NotificationsPage = () => <PageContainer title="Notifications" description="Alerts for governance proposals, pending contributions, and active pool milestones." />;

export const SettingsPage = () => <PageContainer title="Settings" description="Manage your KYC verification, privacy preferences, and wallet connections." />;
