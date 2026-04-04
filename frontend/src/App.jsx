import React from 'react';
import { Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
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
      </Routes>
    </Layout>
  )
}

export default App;
