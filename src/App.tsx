
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Home from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Functions from '@/pages/Functions';
import Chat from '@/pages/Chat';
import Web3Intro from '@/pages/Web3Intro';
import { ThemeProvider } from '@/components/ThemeProvider';
import { RainbowKitProvider } from '@/components/RainbowKitProvider';
import { TransactionQueueProvider } from '@/hooks/useTransactionQueue';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <ThemeProvider>
      <RainbowKitProvider>
        <TransactionQueueProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/home" element={<Home />} />
              <Route path="/functions" element={<Functions />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/web3-intro" element={<Web3Intro />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </TransactionQueueProvider>
      </RainbowKitProvider>
    </ThemeProvider>
  );
}

export default App;
