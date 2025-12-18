import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentFailure } from './pages/PaymentFailure';
import { PaymentConfirmation } from './pages/PaymentConfirmation';
import './index.css';

// Import i18n configuration
import './i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/TikTokCoins-PayOol">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/payment/confirmation" element={<PaymentConfirmation />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
