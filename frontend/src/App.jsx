import React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  polygonAmoy,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthFlow from './pages/AuthFlow';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import MyPools from './pages/MyPools';
import JointPool from './pages/JointPool';
import Payments from './pages/Payments';
import TrustScoreDetails from './pages/TrustScoreDetails';
import {
  EmergencyFund,
  AIInsightsPage,
  TransactionsLog,
  NotificationsPage,
  SettingsPage
} from './pages/Placeholders';
import './index.css';

const config = getDefaultConfig({
  appName: 'ChitX',
  projectId: 'YOUR_PROJECT_ID', // In a real app, this would be an env var
  chains: [polygonAmoy],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#6366f1',
          accentColorForeground: 'white',
          borderRadius: 'large',
          fontStack: 'system',
          overlayBlur: 'small',
        })}>
          <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30">
            <Routes>
              {/* Onboarding and Entry Flow */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/onboarding" element={<AuthFlow />} />
              
              {/* Dashboard and Core App routes wrapped in Layout */}
              <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/my-pools" element={<Layout><MyPools /></Layout>} />
              <Route path="/joint-pool" element={<Layout><JointPool /></Layout>} />
              <Route path="/payments" element={<Layout><Payments /></Layout>} />
              <Route path="/trust-score" element={<Layout><TrustScoreDetails /></Layout>} />
              <Route path="/emergency-fund" element={<Layout><EmergencyFund /></Layout>} />
              <Route path="/ai-insights" element={<Layout><AIInsightsPage /></Layout>} />
              <Route path="/transactions" element={<Layout><TransactionsLog /></Layout>} />
              <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
              <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
