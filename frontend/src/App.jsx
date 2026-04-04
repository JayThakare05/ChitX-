import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import MyPools from './pages/MyPools';
import JointPool from './pages/JointPool';
import Payments from './pages/Payments';
import TrustScoreDetails from './pages/TrustScoreDetails';
import EmergencyFund from './pages/EmergencyFund';
import {
  AIInsightsPage,
  TransactionsLog,
  NotificationsPage,
  SettingsPage
} from './pages/Placeholders';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-pools" element={<MyPools />} />
        <Route path="/joint-pool" element={<JointPool />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/trust-score" element={<TrustScoreDetails />} />
        <Route path="/emergency-fund" element={<EmergencyFund />} />
        <Route path="/ai-insights" element={<AIInsightsPage />} />
        <Route path="/transactions" element={<TransactionsLog />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}

export default App;
