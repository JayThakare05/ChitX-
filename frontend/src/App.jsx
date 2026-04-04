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
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthFlow from './pages/AuthFlow';
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
          <Router>
            <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/onboarding" element={<AuthFlow />} />
              </Routes>
            </div>
          </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
