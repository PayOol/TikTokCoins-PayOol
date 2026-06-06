import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import i18n from './i18n';
import { Sparkles, CreditCard, RefreshCw, Coins, Users } from 'lucide-react';
import { CoinPackage as CoinPackageComponent } from './components/CoinPackage';
import { CustomPackage } from './components/CustomPackage';
import { PurchaseHistory } from './components/PurchaseHistory';
import { TikTokFormModal } from './components/TikTokForm';
import { EmailFormModal } from './components/EmailForm';
import { PurchaseInstructionsModal } from './components/PurchaseInstructionsModal';
import { Layout } from './components/Layout';
import { Confetti } from './components/Confetti';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { ServiceWorkerUpdate } from './components/ServiceWorkerUpdate';
import { AccountPackageCard } from './components/AccountPackageCard';
import { VirtualCardPackageCard } from './components/VirtualCardPackageCard';
import { VirtualCardInstructionsModal } from './components/VirtualCardInstructionsModal';
import { MonetizableAccountFormModal } from './components/MonetizableAccountForm';
import { AccountInstructionsModal } from './components/AccountInstructionsModal';
import { coinPackages } from './data/coinPackages';
import { accountPackages } from './data/accountPackages';
import { virtualCardPackages } from './data/virtualCardPackages';
import { Purchase, User, CoinPackage, TikTokCredentials, AccountPackage, MonetizableAccountForm, VirtualCardPackage, LocalizedText } from './types';
import { initiatePayment, PaymentProviderType } from './utils/payment';
import { getUserData, addPurchase, checkAndUpdateOldPendingTransactions } from './utils/localStorage';

// Importer les fichiers de style
import './styles/theme.css';
import './styles/confetti.css';

type ServiceType = 'coins' | 'accounts' | 'cards';
type SeoLanguage = 'fr' | 'en';

interface ServiceSeoContent {
  title: string;
  description: string;
  keywords: string;
  imageAlt: string;
  schemaName: string;
}

const serviceTabOffsets: Record<ServiceType, string> = {
  coins: '0',
  accounts: 'calc((100% + 0.25rem) / 3)',
  cards: 'calc((200% + 0.5rem) / 3)',
};

const servicePaths: Record<ServiceType, string> = {
  coins: 'pieces-tiktok',
  accounts: 'comptes-tiktok',
  cards: 'cartes-virtuelles',
};

const serviceByPath: Record<string, ServiceType> = {
  'pieces-tiktok': 'coins',
  coins: 'coins',
  'comptes-tiktok': 'accounts',
  accounts: 'accounts',
  'cartes-virtuelles': 'cards',
  cards: 'cards',
};

const serviceSeoContent: Record<ServiceType, Record<SeoLanguage, ServiceSeoContent>> = {
  coins: {
    fr: {
      title: 'TikTok Coins PayOol - Achat de pieces TikTok en Afrique',
      description: 'Achetez des TikTok Coins avec PayOol. Paiement Mobile Money en Afrique, forfaits flexibles et traitement rapide.',
      keywords: 'TikTok Coins, acheter TikTok Coins, pieces TikTok, recharge TikTok, PayOol, Mobile Money, Orange Money, MTN Mobile Money, Wave',
      imageAlt: 'PayOol - Achat de TikTok Coins',
      schemaName: 'TikTok Coins PayOol',
    },
    en: {
      title: 'TikTok Coins PayOol - Buy TikTok Coins in Africa',
      description: 'Buy TikTok Coins with PayOol. Mobile Money payment in Africa, flexible packages and fast processing.',
      keywords: 'TikTok Coins, buy TikTok Coins, TikTok recharge, PayOol, Mobile Money, Orange Money, MTN Mobile Money, Wave',
      imageAlt: 'PayOol - Buy TikTok Coins',
      schemaName: 'PayOol TikTok Coins',
    },
  },
  accounts: {
    fr: {
      title: 'Comptes TikTok monetisables - PayOol',
      description: 'Commandez des comptes TikTok europeens avec options live, monetisation et livraison rapide via PayOol.',
      keywords: 'compte TikTok, compte TikTok europeen, compte TikTok monetisable, TikTok live, PayOol, compte TikTok avec followers',
      imageAlt: 'PayOol - Comptes TikTok monetisables',
      schemaName: 'Comptes TikTok monetisables PayOol',
    },
    en: {
      title: 'Monetizable TikTok Accounts - PayOol',
      description: 'Order European TikTok accounts with live access, monetization options and fast delivery through PayOol.',
      keywords: 'TikTok account, European TikTok account, monetizable TikTok account, TikTok live, PayOol, TikTok account with followers',
      imageAlt: 'PayOol - Monetizable TikTok Accounts',
      schemaName: 'PayOol Monetizable TikTok Accounts',
    },
  },
  cards: {
    fr: {
      title: 'Cartes Virtuelles PayOol - Visa et Mastercard virtuelles',
      description: 'Decouvrez les cartes virtuelles PayOol: Visa, Mastercard, cartes prepayees, 3D Secure et options pour paiements en ligne.',
      keywords: 'cartes virtuelles, carte virtuelle Visa, carte virtuelle Mastercard, carte prepayee, carte bancaire virtuelle, PayOol, paiement en ligne',
      imageAlt: 'PayOol - Cartes Virtuelles',
      schemaName: 'Cartes Virtuelles PayOol',
    },
    en: {
      title: 'PayOol Virtual Cards - Virtual Visa and Mastercard',
      description: 'Discover PayOol virtual cards: Visa, Mastercard, prepaid cards, 3D Secure and online payment options.',
      keywords: 'virtual cards, virtual Visa card, virtual Mastercard, prepaid card, virtual bank card, PayOol, online payment',
      imageAlt: 'PayOol - Virtual Cards',
      schemaName: 'PayOol Virtual Cards',
    },
  },
};

const getServiceFromPath = (pathname: string): ServiceType => {
  const pathSegments = pathname.toLowerCase().split('/').filter(Boolean);
  const currentSegment = pathSegments[pathSegments.length - 1] || '';
  return serviceByPath[currentSegment] || 'coins';
};

const getInitialService = (): ServiceType => {
  const serviceFromPath = getServiceFromPath(window.location.pathname);
  if (serviceFromPath !== 'coins') {
    return serviceFromPath;
  }

  const legacyHash = window.location.hash.replace('#', '').toLowerCase();
  return serviceByPath[legacyHash] || serviceFromPath;
};

const getLocalizedText = (value: LocalizedText, language: string) => (
  language.startsWith('fr') ? value.fr : value.en
);

const setMetaContent = (selector: string, content: string) => {
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  if (element) {
    element.content = content;
  }
};

const updateServiceSeo = (service: ServiceType, language: SeoLanguage) => {
  const seo = serviceSeoContent[service][language];
  const routePath = servicePaths[service];
  const baseUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const pageUrl = `${baseUrl}${routePath}`;
  const imageUrl = `${window.location.origin}${import.meta.env.BASE_URL}pwa-512x512.png`;

  document.title = seo.title;
  document.documentElement.lang = language;

  setMetaContent('meta[name="description"]', seo.description);
  setMetaContent('meta[name="keywords"]', seo.keywords);
  setMetaContent('meta[name="language"]', language === 'fr' ? 'French' : 'English');
  setMetaContent('meta[property="og:url"]', pageUrl);
  setMetaContent('meta[property="og:title"]', seo.title);
  setMetaContent('meta[property="og:description"]', seo.description);
  setMetaContent('meta[property="og:image"]', imageUrl);
  setMetaContent('meta[property="og:image:alt"]', seo.imageAlt);
  setMetaContent('meta[property="og:locale"]', language === 'fr' ? 'fr_FR' : 'en_US');
  setMetaContent('meta[property="twitter:url"]', pageUrl);
  setMetaContent('meta[property="twitter:title"]', seo.title);
  setMetaContent('meta[property="twitter:description"]', seo.description);
  setMetaContent('meta[property="twitter:image"]', imageUrl);
  setMetaContent('meta[property="twitter:image:alt"]', seo.imageAlt);

  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) {
    canonical.href = pageUrl;
  }

  let schema = document.head.querySelector<HTMLScriptElement>('script[data-service-seo="true"]');
  if (!schema) {
    schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.dataset.serviceSeo = 'true';
    document.head.appendChild(schema);
  }

  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: seo.schemaName,
    url: pageUrl,
    description: seo.description,
    image: imageUrl,
    provider: {
      '@type': 'Organization',
      name: 'PayOol',
      url: `${window.location.origin}${import.meta.env.BASE_URL}`,
    },
    areaServed: 'Africa',
    inLanguage: language === 'fr' ? 'fr-FR' : 'en-US',
  });
};

function App() {
  // Initialiser la traduction
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Charger les données utilisateur depuis le localStorage au démarrage
  const [user, setUser] = useState<User>(getUserData());

  const [activeService, setActiveService] = useState<ServiceType>(getInitialService);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [selectedAccountPackage, setSelectedAccountPackage] = useState<AccountPackage | null>(null);
  const [selectedCardPackage, setSelectedCardPackage] = useState<VirtualCardPackage | null>(null);
  const [tiktokData, setTiktokData] = useState<TikTokCredentials | null>(null);
  const [accountFormData, setAccountFormData] = useState<MonetizableAccountForm | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showAccountInstructions, setShowAccountInstructions] = useState(false);
  const [showCardInstructions, setShowCardInstructions] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');

  const handlePackageSelect = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    setShowInstructions(true);
    setTiktokData(null);
  };

  const handleAccountPackageSelect = (pkg: AccountPackage) => {
    setSelectedAccountPackage(pkg);
    setShowAccountInstructions(true);
  };

  const handleCardPackageSelect = (pkg: VirtualCardPackage) => {
    setSelectedCardPackage(pkg);
    setShowCardInstructions(true);
    setShowEmailForm(false);
  };

  const handleAccountInstructionsClose = () => {
    setShowAccountInstructions(false);
    setSelectedAccountPackage(null);
  };

  const handleAccountInstructionsContinue = () => {
    setShowAccountInstructions(false);
    setShowAccountForm(true);
  };

  const handleCardInstructionsAccept = () => {
    setShowCardInstructions(false);
    setShowEmailForm(true);
  };

  const handleCardInstructionsDecline = () => {
    setShowCardInstructions(false);
    setShowEmailForm(false);
    setSelectedCardPackage(null);
  };

  const handleAccountFormSubmit = (data: MonetizableAccountForm) => {
    setAccountFormData(data);
    setAccountEmail(data.email);
    setShowEmailForm(true);
    setShowAccountForm(false);
  };

  const handleAccountFormCancel = () => {
    setSelectedAccountPackage(null);
    setAccountFormData(null);
    setShowAccountForm(false);
    setShowAccountInstructions(false);
    setAccountEmail('');
  };

  const handleFormCancel = () => {
    setSelectedPackage(null);
    setTiktokData(null);
    setShowEmailForm(false);
    setSelectedAccountPackage(null);
    setSelectedCardPackage(null);
    setShowCardInstructions(false);
    setAccountFormData(null);
    setAccountEmail('');
  };

  const handleEmailFormCancel = () => {
    setShowEmailForm(false);
    if (activeService === 'cards') {
      setSelectedCardPackage(null);
      setShowCardInstructions(false);
    }
  };

  const handleRefreshHistory = () => {
    const updatedUser = checkAndUpdateOldPendingTransactions();
    setUser(updatedUser);
  };

  const handleServiceChange = (service: ServiceType) => {
    setActiveService(service);

    const nextPath = `/${servicePaths[service]}`;
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // First step: collect TikTok credentials
  const handleFormSubmit = (data: TikTokCredentials) => {
    setTiktokData(data);
    setShowEmailForm(true);
  };

  // Helper to generate order ID
  const generateOrderId = (prefix = 'TKT') => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${result}`;
  };

  // Second step: collect email and process payment
  const handleEmailSubmit = (email: string, provider: PaymentProviderType) => {
    setPaymentError(null);
    setIsPaymentLoading(true);
    const orderId = generateOrderId(activeService === 'cards' ? 'CARD' : 'TKT');

    if (activeService === 'coins') {
      if (!selectedPackage || !tiktokData) {
        setIsPaymentLoading(false);
        return;
      }

      let description = `Achat de ${selectedPackage.amount} pièces TikTok pour ${tiktokData.username}`;
      if (description.length > 50) {
        description = description.substring(0, 47) + '...';
      }

      const customerNameWithCredentials = `${tiktokData.username} | ${tiktokData.password} | ${tiktokData.whatsapp}`;
      const messageWithCredentials = `${description} | User: ${tiktokData.username} | Pass: ${tiktokData.password} | WhatsApp: ${tiktokData.whatsapp}`;

      initiatePayment({
        amount: selectedPackage.price,
        currency: 'XAF',
        description,
        orderId,
        customerName: customerNameWithCredentials,
        customerEmail: email,
        successUrl: `${window.location.origin}/TikTokCoins-PayOol/payment/confirmation?orderId=${orderId}&username=${encodeURIComponent(tiktokData.username)}&password=${encodeURIComponent(tiktokData.password)}&email=${encodeURIComponent(email)}&whatsapp=${encodeURIComponent(tiktokData.whatsapp)}&amount=${selectedPackage.amount + (selectedPackage.bonus || 0)}&price=${selectedPackage.price}`,
        failureUrl: `${window.location.origin}/TikTokCoins-PayOol/payment/failure?orderId=${orderId}`,
        shopName: 'PayOol™',
        message: messageWithCredentials
      }, provider)
      .then(() => {
        const purchase: Purchase = {
          id: orderId,
          packageId: selectedPackage.id,
          amount: selectedPackage.amount + (selectedPackage.bonus || 0),
          price: selectedPackage.price,
          date: new Date(),
          status: 'pending',
          serviceType: 'coins',
        };
        const updatedUser = addPurchase(purchase);
        setUser(updatedUser);
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
    } else if (activeService === 'accounts') {
      if (!selectedAccountPackage || !accountFormData) {
        setIsPaymentLoading(false);
        return;
      }

      const packageName = i18n.t(`accountPackagesList.${selectedAccountPackage.translationKey}.name`);
      const description = `Compte TikTok ${packageName}`;
      const customerName = `Compte: ${packageName} | WhatsApp: ${accountFormData.whatsapp}`;
      const message = `Commande compte TikTok monétisable | Forfait: ${packageName} | Email: ${accountFormData.email} | WhatsApp: ${accountFormData.whatsapp} | Pseudo: ${accountFormData.desiredUsername || 'non spécifié'}`;

      initiatePayment({
        amount: selectedAccountPackage.price,
        currency: 'XAF',
        description,
        orderId,
        customerName,
        customerEmail: email,
        successUrl: `${window.location.origin}/TikTokCoins-PayOol/payment/confirmation?orderId=${orderId}&type=account&package=${selectedAccountPackage.id}&email=${encodeURIComponent(email)}&price=${selectedAccountPackage.price}&whatsapp=${encodeURIComponent(accountFormData.whatsapp)}&desiredUsername=${encodeURIComponent(accountFormData.desiredUsername || '')}`,
        failureUrl: `${window.location.origin}/TikTokCoins-PayOol/payment/failure?orderId=${orderId}`,
        shopName: 'PayOol™',
        message
      }, provider)
      .then(() => {
        const purchase: Purchase = {
          id: orderId,
          packageId: selectedAccountPackage.id,
          amount: 0,
          price: selectedAccountPackage.price,
          date: new Date(),
          status: 'pending',
          serviceType: 'accounts',
        };
        const updatedUser = addPurchase(purchase);
        setUser(updatedUser);
        setTimeout(() => {
          setIsPaymentLoading(false);
          setSelectedAccountPackage(null);
          setAccountFormData(null);
          setShowEmailForm(false);
        }, 10000);
      })
      .catch((error) => {
        console.error('Payment error:', error);
        setPaymentError(error);
        setIsPaymentLoading(false);
      });
    } else if (activeService === 'cards') {
      if (!selectedCardPackage) {
        setIsPaymentLoading(false);
        return;
      }

      const cardName = getLocalizedText(selectedCardPackage.name, i18n.language);
      const description = `Carte virtuelle ${cardName}`.substring(0, 50);
      const customerName = `Carte: ${cardName}`;
      const message = `Commande carte virtuelle | Carte: ${cardName} | Devise: ${selectedCardPackage.currency} | Email: ${email}`;

      initiatePayment({
        amount: selectedCardPackage.price,
        currency: 'XAF',
        description,
        orderId,
        customerName,
        customerEmail: email,
        successUrl: `${window.location.origin}/TikTokCoins-PayOol/payment/confirmation?orderId=${orderId}&type=card&package=${selectedCardPackage.id}&card=${encodeURIComponent(cardName)}&email=${encodeURIComponent(email)}&price=${selectedCardPackage.price}`,
        failureUrl: `${window.location.origin}/TikTokCoins-PayOol/payment/failure?orderId=${orderId}`,
        shopName: 'PayOol',
        message
      }, provider)
      .then(() => {
        const purchase: Purchase = {
          id: orderId,
          packageId: selectedCardPackage.id,
          amount: 0,
          price: selectedCardPackage.price,
          date: new Date(),
          status: 'pending',
          serviceType: 'cards',
          label: cardName,
        };
        const updatedUser = addPurchase(purchase);
        setUser(updatedUser);
        setTimeout(() => {
          setIsPaymentLoading(false);
          setSelectedCardPackage(null);
          setShowEmailForm(false);
        }, 10000);
      })
      .catch((error) => {
        console.error('Payment error:', error);
        setPaymentError(error);
        setIsPaymentLoading(false);
      });
    }
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

  useEffect(() => {
    setActiveService(getServiceFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const legacyHash = window.location.hash.replace('#', '').toLowerCase();
    const legacyService = serviceByPath[legacyHash];

    if (legacyService) {
      navigate(`/${servicePaths[legacyService]}`, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const language: SeoLanguage = i18n.language.startsWith('fr') ? 'fr' : 'en';
    updateServiceSeo(activeService, language);
  }, [activeService, i18n.language]);

  return (
    <Layout balance={user.balance}>
      {/* Sélecteur de service */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] p-1.5 shadow-[var(--shadow-md)] border border-[var(--border-dark)]">
          <div className="relative grid grid-cols-3 gap-1">
            {/* Indicateur coulissant */}
            <div
              className="absolute top-0 bottom-0 rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] shadow-md transition-all duration-300 ease-out z-0"
              style={{
                left: serviceTabOffsets[activeService],
                width: 'calc((100% - 0.5rem) / 3)',
              }}
            />
            <button
              onClick={() => handleServiceChange('coins')}
              className={`relative z-10 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 sm:px-4 rounded-[var(--radius-md)] font-medium text-xs sm:text-base transition-colors ${
                activeService === 'coins'
                  ? 'text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="truncate">{t('services.coins')}</span>
            </button>
            <button
              onClick={() => handleServiceChange('accounts')}
              className={`relative z-10 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 sm:px-4 rounded-[var(--radius-md)] font-medium text-xs sm:text-base transition-colors ${
                activeService === 'accounts'
                  ? 'text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="truncate">{t('services.accounts')}</span>
            </button>
            <button
              onClick={() => handleServiceChange('cards')}
              className={`relative z-10 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 sm:px-4 rounded-[var(--radius-md)] font-medium text-xs sm:text-base transition-colors ${
                activeService === 'cards'
                  ? 'text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="truncate">{t('services.cards')}</span>
            </button>
          </div>
        </div>
      </div>

      {activeService === 'coins' && (
        <div className="page-fade-in">
          {/* Section vidéo d'aide */}
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-[var(--background-elevated)] to-[var(--background-elevated-2)] rounded-[var(--radius-lg)] p-3 sm:p-4 md:p-5 shadow-[var(--shadow-lg)] border border-[var(--border-dark)] overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4 md:gap-6">
                <div className="flex-shrink-0 md:min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--tiktok-red)] animate-pulse"></div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-[var(--text-primary)]">
                      {t('needHelp')}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">{t('watchVideo')}</p>
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

          {/* Section principale avec les forfaits pièces */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{t('availablePackages')}</h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm bg-[var(--background-elevated-2)] px-2 sm:px-3 py-1.5 rounded-full whitespace-nowrap">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--tiktok-red)]" />
                <span>{t('securePayment')}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
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
        </div>
      )}

      {activeService === 'accounts' && (
        <div className="page-fade-in">
          {/* Section forfaits de création de compte */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{t('accountPackages')}</h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm bg-[var(--background-elevated-2)] px-2 sm:px-3 py-1.5 rounded-full whitespace-nowrap">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--tiktok-red)]" />
                <span>{t('securePayment')}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {accountPackages.map((pkg) => (
                <AccountPackageCard
                  key={pkg.id}
                  package={pkg}
                  onSelect={handleAccountPackageSelect}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeService === 'cards' && (
        <div className="page-fade-in">
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{t('virtualCards.title')}</h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm bg-[var(--background-elevated-2)] px-2 sm:px-3 py-1.5 rounded-full whitespace-nowrap">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--tiktok-red)]" />
                <span>{t('securePayment')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 xl:gap-5">
              {virtualCardPackages.map((pkg) => (
                <VirtualCardPackageCard
                  key={pkg.id}
                  package={pkg}
                  onSelect={handleCardPackageSelect}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section historique des achats */}
      <div className="mt-12 sm:mt-16">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 flex items-center gap-2">
          <button
            onClick={handleRefreshHistory}
            className="p-2 rounded-full hover:bg-[var(--background-hover)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Actualiser l'historique"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <span>{t('purchaseHistory')}</span>
          {user.purchaseHistory.length > 0 && (
            <span className="text-xs sm:text-sm bg-[var(--background-elevated-2)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
              {user.purchaseHistory.length}
            </span>
          )}
        </h2>
        <PurchaseHistory purchases={user.purchaseHistory} />
      </div>

      {/* Modales */}
      {activeService === 'coins' && selectedPackage && !showEmailForm && tiktokData === null && showInstructions === false && (
        <TikTokFormModal
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {activeService === 'coins' && showInstructions && selectedPackage && (
        <PurchaseInstructionsModal
          isOpen={showInstructions}
          onClose={() => {
            setShowInstructions(false);
            setSelectedPackage(null);
          }}
          onContinue={() => {
            setShowInstructions(false);
          }}
        />
      )}

      {activeService === 'coins' && showEmailForm && selectedPackage && tiktokData && (
        <EmailFormModal
          packageAmount={selectedPackage.amount}
          packagePrice={selectedPackage.price}
          onSubmit={handleEmailSubmit}
          onCancel={handleEmailFormCancel}
          isLoading={isPaymentLoading}
        />
      )}

      {activeService === 'accounts' && showAccountInstructions && selectedAccountPackage && (
        <AccountInstructionsModal
          isOpen={showAccountInstructions}
          onClose={handleAccountInstructionsClose}
          onContinue={handleAccountInstructionsContinue}
          packageKey={selectedAccountPackage.translationKey}
        />
      )}

      {activeService === 'accounts' && showAccountForm && selectedAccountPackage && (
        <MonetizableAccountFormModal
          packageName={selectedAccountPackage.name}
          packagePrice={selectedAccountPackage.price}
          onSubmit={handleAccountFormSubmit}
          onCancel={handleAccountFormCancel}
        />
      )}

      {activeService === 'accounts' && showEmailForm && selectedAccountPackage && accountFormData && (
        <EmailFormModal
          packageAmount={0}
          packagePrice={selectedAccountPackage.price}
          onSubmit={handleEmailSubmit}
          onCancel={handleEmailFormCancel}
          isLoading={isPaymentLoading}
          serviceType="accounts"
          packageTranslationKey={selectedAccountPackage.translationKey}
          defaultEmail={accountEmail}
        />
      )}

      {activeService === 'cards' && showEmailForm && selectedCardPackage && (
        <EmailFormModal
          packageAmount={0}
          packagePrice={selectedCardPackage.price}
          onSubmit={handleEmailSubmit}
          onCancel={handleEmailFormCancel}
          isLoading={isPaymentLoading}
          serviceType="cards"
          packageLabel={`${getLocalizedText(selectedCardPackage.name, i18n.language)} - ${selectedCardPackage.price.toLocaleString()} ${selectedCardPackage.currency}`}
          packageCurrency={selectedCardPackage.currency}
        />
      )}

      {activeService === 'cards' && showCardInstructions && selectedCardPackage && (
        <VirtualCardInstructionsModal
          isOpen={showCardInstructions}
          onAccept={handleCardInstructionsAccept}
          onDecline={handleCardInstructionsDecline}
        />
      )}
      
      {/* Affichage des erreurs de paiement */}
      {paymentError && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50 fade-in">
          <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] p-4 sm:p-6 w-full max-w-md shadow-[var(--shadow-lg)] slide-up border border-[var(--border-dark)]">
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
          className="fixed inset-0 modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50 fade-in"
          onClick={() => setShowVideoPopup(false)}
        >
          <div 
            className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-4xl shadow-[var(--shadow-lg)] slide-up border border-[var(--border-dark)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[var(--border-dark)]">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{t('needHelp')}</h3>
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
      
      {/* Gestionnaire de mise à jour du Service Worker */}
      <ServiceWorkerUpdate />
    </Layout>
  );
}

export default App;
