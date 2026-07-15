import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { CheckCircle, ArrowLeft, ArrowRight, Coins, CreditCard, Gamepad2, Home, Link as LinkIcon, Mail, Printer } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Confetti } from '../components/Confetti';
import { Purchase } from '../types';
import { virtualCardPackages } from '../data/virtualCardPackages';
import { getPurchaseHistory, updateTransactionStatus } from '../utils/localStorage';

const CARD_ACCOUNT_URL = 'https://prismcard.net/r/RGBY2OC6';
const SUPPORT_WHATSAPP_URL = 'https://wa.me/237658314543';

const getLocalizedText = (value: { fr: string; en: string }, language: string) => (
  language.startsWith('fr') ? value.fr : value.en
);

const normalizeCardName = (value?: string | null) => {
  const trimmedValue = value?.trim();

  if (!trimmedValue || trimmedValue === '-' || trimmedValue === '—') {
    return null;
  }

  return trimmedValue;
};

const getCardNameFromPendingOrders = (orderId: string | null) => {
  if (!orderId) {
    return null;
  }

  try {
    const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]') as Array<{
      order_id?: string;
      desired_username?: string;
    }>;
    const matchingOrder = pendingOrders.find(order => order.order_id === orderId);

    return normalizeCardName(matchingOrder?.desired_username);
  } catch (error) {
    console.error('Erreur lors de la récupération du nom de la carte:', error);
    return null;
  }
};

export const PaymentSuccess = () => {
  const { t, i18n } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(true);
  const [purchaseDetails, setPurchaseDetails] = useState<Purchase | null>(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const urlType = searchParams.get('type');
  const [serviceType, setServiceType] = useState<'coins' | 'accounts' | 'cards' | 'efootball'>(
    urlType === 'account' ? 'accounts' : urlType === 'card' ? 'cards' : urlType === 'efootball' ? 'efootball' : 'coins'
  );
  const isAccount = serviceType === 'accounts';
  const isCard = serviceType === 'cards';
  const isEFootball = serviceType === 'efootball';
  const isNonCoinPurchase = isAccount || isCard || isEFootball;

  useEffect(() => {
    if (orderId) {
      // Mettre à jour le statut de la transaction à 'success'
      updateTransactionStatus(orderId, 'success');

      // Récupérer les détails de l'achat depuis le localStorage
      const purchaseHistory = getPurchaseHistory();
      const purchase = purchaseHistory.find(p => p.id === orderId);
      if (purchase) {
        setPurchaseDetails(purchase);
        setServiceType(purchase.serviceType || 'coins');
      } else if (urlType) {
        setServiceType(urlType === 'account' ? 'accounts' : urlType === 'card' ? 'cards' : urlType === 'efootball' ? 'efootball' : 'coins');
      }
    }

    // Arrêter les confettis après 5 secondes
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [location.search]);

  const orderDate = purchaseDetails?.date ? new Date(purchaseDetails.date) : new Date();
  const formattedCardOrderDate = orderDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const cardPackageFromUrl = searchParams.get('package');
  const cardPriceFromUrl = searchParams.get('price');
  const cardPrice = purchaseDetails?.price || Number(cardPriceFromUrl) || 0;
  const fallbackCardPackage = virtualCardPackages.find(pkg => (
    pkg.id === Number(cardPackageFromUrl || purchaseDetails?.packageId)
  )) || virtualCardPackages.find(pkg => (
    pkg.price === Number(cardPriceFromUrl || purchaseDetails?.price)
  ));
  const cardArticleLabel = normalizeCardName(purchaseDetails?.label)
    || normalizeCardName(searchParams.get('card'))
    || getCardNameFromPendingOrders(orderId)
    || (fallbackCardPackage ? getLocalizedText(fallbackCardPackage.name, i18n.language) : 'Carte Virtuelle');
  const cardWhatsappMessage = encodeURIComponent(
    `Bonjour PayOol, ma commande ${cardArticleLabel}${orderId ? ` ${orderId}` : ''} est confirmee. Voici l'adresse e-mail associee a mon compte PrismCard : `
  );
  const cardWhatsappUrl = `${SUPPORT_WHATSAPP_URL}?text=${cardWhatsappMessage}`;

  if (isCard) {
    return (
      <Layout balance={0} hideBalance={true}>
        {showConfetti && <Confetti duration={5000} />}

        <section className="mx-auto max-w-5xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-dark)] bg-[var(--card-bg)] p-5 text-[var(--text-primary)] shadow-[var(--shadow-lg)] sm:p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30 sm:h-24 sm:w-24">
              <CheckCircle className="h-14 w-14 sm:h-16 sm:w-16" />
            </div>
          </div>

          <div className="mb-6 rounded-[var(--radius-md)] bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-6 text-center text-white shadow-md sm:px-8">
            <h1 className="text-2xl font-black leading-tight sm:text-3xl">Paiement Réussi !</h1>
            <p className="mt-2 text-sm font-medium text-white/90">
              Votre commande a été confirmée avec succès
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-[var(--border-dark)] bg-[var(--background-elevated)] p-5">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Détails de la commande</h2>
              </div>

              <div className="space-y-4 text-sm sm:text-base">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--border-dark)] pb-3">
                  <span className="text-[var(--text-secondary)]">Article commandé</span>
                  <span className="text-right font-bold text-[var(--text-primary)]">{cardArticleLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-[var(--border-dark)] pb-3">
                  <span className="text-[var(--text-secondary)]">Prix</span>
                  <span className="text-right font-black text-emerald-400">{cardPrice.toLocaleString()} FCFA</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-[var(--border-dark)] pb-3">
                  <span className="text-[var(--text-secondary)]">Date de commande</span>
                  <span className="text-right font-bold text-[var(--text-primary)]">{formattedCardOrderDate}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--border-dark)] bg-[var(--background-elevated)] p-5">
              <div className="mb-5 flex items-center gap-2 text-[var(--text-primary)]">
                <ArrowRight className="h-5 w-5 text-[var(--tiktok-blue)]" />
                <h2 className="text-lg font-bold">Prochaines étapes</h2>
              </div>

              <div className="space-y-5 text-sm leading-relaxed text-[var(--text-secondary)]">
                <div className="flex gap-4">
                  <LinkIcon className="mt-1 h-5 w-5 shrink-0 text-[var(--tiktok-blue)]" />
                  <div>
                    <p>Veuillez cliquer sur le lien suivant afin d'ouvrir votre compte :</p>
                    <a
                      href={CARD_ACCOUNT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex rounded-[var(--radius-sm)] border border-[var(--border-dark)] bg-[var(--background-elevated-2)] px-4 py-2 font-bold text-[var(--text-primary)] transition-colors hover:border-[var(--tiktok-blue)]"
                    >
                      prismcard.net/r/RGBY2OC6
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-[var(--tiktok-blue)]" />
                  <p>
                    Une fois votre compte créé et vérifié, nous vous prions de bien vouloir nous envoyer
                    l'adresse e-mail associée par WhatsApp. Nous procéderons alors à l'ajout de la carte
                    dans votre compte.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 print:hidden sm:grid-cols-3">
            <a
              href={cardWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-emerald-600 px-4 py-3 text-center font-bold text-white shadow-md transition-colors hover:bg-emerald-700"
            >
              <Mail className="h-5 w-5" />
              <span>Envoyer l'email sur WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-dark)] bg-[var(--background-elevated)] px-4 py-3 font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--background-elevated-2)]"
            >
              <Printer className="h-5 w-5" />
              <span>Imprimer le reçu</span>
            </button>
            <Link
              to="/"
              className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-dark)] bg-[var(--background-elevated)] px-4 py-3 font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--background-elevated-2)]"
            >
              <Home className="h-5 w-5" />
              <span>Retour à l'accueil</span>
            </Link>
          </div>

          <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
            Merci de votre confiance !
          </p>
        </section>
      </Layout>
    );
  }
  
  return (
    <Layout balance={purchaseDetails?.amount || 0} hideBalance={!purchaseDetails || isNonCoinPurchase}>
      {showConfetti && <Confetti duration={5000} />}
      
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-[var(--card-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--border-dark)]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-900 bg-opacity-20 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{t('paymentSuccessful')}</h1>
          <p className="text-[var(--text-secondary)] max-w-md mb-2">
            {t('thankYou')} 
          </p>
          <p className="text-[var(--text-secondary)] max-w-md mb-4">
            {isAccount
              ? t('successMessageAccount', 'Votre paiement a été traité avec succès. Vous recevrez les identifiants de votre compte TikTok par email dans un délai de 2-4h. Si vous ne recevez pas vos identifiants dans ce délai, veuillez contacter notre service client sur WhatsApp.')
              : isCard
                ? t('successMessageCard', 'Votre paiement a ete traite avec succes. Votre carte virtuelle sera preparee et les informations de livraison seront envoyees par email.')
                : isEFootball
                  ? t('efootball.successMessage')
                  : t('successMessage', 'Votre paiement a été traité avec succès. Vous recevrez vos pièces dans un délai de 10 minutes. Si vous ne recevez pas vos pièces dans ce délai, veuillez contacter notre service client sur WhatsApp.')
            }
          </p>
          <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-[var(--radius-md)] text-green-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{t('paymentProcessed', 'Paiement traité')}</span>
            </div>
            <p className="text-sm">
              {isAccount
                ? t('paymentConfirmationAccount', 'Votre paiement a été traité avec succès. Votre compte TikTok sera créé et les identifiants vous seront envoyés par email.')
                : isCard
                  ? t('paymentConfirmationCard', 'Votre commande de carte virtuelle est confirmee. PayOol va traiter la livraison apres validation.')
                  : isEFootball
                    ? t('efootball.paymentConfirmation')
                    : t('paymentConfirmation', 'Votre paiement a été traité avec succès. Vos pièces seront créditées sur votre compte TikTok dans les prochaines minutes.')
              }
            </p>
          </div>
          
          <a 
            href="https://short.prismcard.net/r/whatsapp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-full transition-colors mb-6 max-w-xs mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
              <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
              <path d="M9.5 13.5c.5 1 1.5 1 2.5 1s2-.5 2.5-1" />
            </svg>
            <span>{t('contactSupport', 'Contacter le service client')}</span>
          </a>
        </div>
        
        {purchaseDetails && (
          <div className="bg-[var(--background-elevated-2)] rounded-[var(--radius-md)] p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('transactionDetails', 'Détails de la transaction')}</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t('orderNumber', 'Numéro de commande')}</span>
                <span className="font-medium">{purchaseDetails.id}</span>
              </div>
              
              {!isAccount && !isCard && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">
                    {isEFootball ? t('efootball.purchasedCoins') : t('purchasedCoins', 'Pièces achetées')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--tiktok-blue)] to-[var(--tiktok-red)] flex items-center justify-center">
                      {isEFootball ? <Gamepad2 className="w-3 h-3 text-white" /> : <Coins className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-bold">{purchaseDetails.amount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {isCard && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">{t('virtualCards.card', 'Carte')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                      <CreditCard className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-bold">{purchaseDetails.label || t('virtualCards.title')}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t('amountPaid', 'Montant payé')}</span>
                <span className="font-bold">{purchaseDetails.price.toLocaleString()} FCFA</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t('date')}</span>
                <span>{new Date(purchaseDetails.date).toLocaleString(i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US')}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className={`flex gap-4 ${isNonCoinPurchase ? 'justify-center' : 'flex-col sm:flex-row'}`}>
          <Link
            to={isCard ? '/cartes-virtuelles' : isAccount ? '/comptes-tiktok' : isEFootball ? '/pieces-efootball' : '/'}
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-[var(--radius-md)] bg-[var(--background-elevated)] hover:bg-[var(--background-elevated-2)] transition-colors border border-[var(--border-dark)]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('backToHome')}</span>
          </Link>

          {!isNonCoinPurchase && (
            <a
              href="https://www.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              <span>{t('openTikTok', 'Ouvrir TikTok')}</span>
            </a>
          )}
        </div>
      </div>
    </Layout>
  );
};
