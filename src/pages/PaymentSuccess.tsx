import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { CheckCircle, ArrowLeft, Coins } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Confetti } from '../components/Confetti';
import { Purchase } from '../types';
import { getPurchaseHistory, updateTransactionStatus } from '../utils/localStorage';

export const PaymentSuccess = () => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [purchaseDetails, setPurchaseDetails] = useState<Purchase | null>(null);
  const location = useLocation();
  
  useEffect(() => {
    // Récupérer l'orderId depuis l'URL
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get('orderId');
    
    if (orderId) {
      // Mettre à jour le statut de la transaction à 'success'
      updateTransactionStatus(orderId, 'success');
      
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
  }, [location.search]);
  
  return (
    <Layout balance={purchaseDetails?.amount || 0} hideBalance={!purchaseDetails}>
      {showConfetti && <Confetti duration={5000} />}
      
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-[var(--card-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--border-dark)]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-900 bg-opacity-20 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Paiement réussi !</h1>
          <p className="text-[var(--text-secondary)] max-w-md mb-2">
            Votre achat de pièces TikTok a été traité avec succès. 
          </p>
          <p className="text-[var(--text-secondary)] max-w-md mb-4">
            Si vous avez saisi les identifiants réels de votre compte TikTok, vous recevrez vos pièces dans un délai de 10 minutes. 
            Si vous ne recevez pas vos pièces dans ce délai, veuillez contacter notre service client sur WhatsApp.
          </p>
          <a 
            href="https://wa.me/message/2TWDCSUY65YGA1" 
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
            <span>Contacter le service client</span>
          </a>
        </div>
        
        {purchaseDetails && (
          <div className="bg-[var(--background-elevated-2)] rounded-[var(--radius-md)] p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Détails de la transaction</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Numéro de commande</span>
                <span className="font-medium">{purchaseDetails.id}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Pièces achetées</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--tiktok-blue)] to-[var(--tiktok-red)] flex items-center justify-center">
                    <Coins className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-bold">{purchaseDetails.amount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Montant payé</span>
                <span className="font-bold">{purchaseDetails.price.toLocaleString()} FCFA</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Date</span>
                <span>{new Date(purchaseDetails.date).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-[var(--radius-md)] bg-[var(--background-elevated)] hover:bg-[var(--background-elevated-2)] transition-colors border border-[var(--border-dark)]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour à l'accueil</span>
          </Link>
          
          <a 
            href="https://www.tiktok.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            <span>Ouvrir TikTok</span>
          </a>
        </div>
      </div>
    </Layout>
  );
};
