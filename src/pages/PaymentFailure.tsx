import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Purchase } from '../types';
import { getPurchaseHistory, updateTransactionStatus } from '../utils/localStorage';

export const PaymentFailure = () => {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<Purchase | null>(null);
  const location = useLocation();
  
  useEffect(() => {
    // Récupérer l'orderId et le message d'erreur depuis l'URL
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('orderId');
    const error = searchParams.get('error');
    
    if (id) {
      setOrderId(id);
      
      // Mettre à jour le statut de la transaction à 'failed'
      const errorMsg = error ? decodeURIComponent(error) : "Une erreur est survenue lors du traitement de votre paiement.";
      updateTransactionStatus(id, 'failed', errorMsg);
      
      // Récupérer les détails de l'achat depuis le localStorage
      const purchaseHistory = getPurchaseHistory();
      const purchase = purchaseHistory.find(p => p.id === id);
      if (purchase) {
        setPurchaseDetails(purchase);
      }
    }
    
    if (error) {
      setErrorMessage(decodeURIComponent(error));
    } else {
      setErrorMessage("Une erreur est survenue lors du traitement de votre paiement.");
    }
  }, [location.search]);
  
  return (
    <Layout balance={0} hideBalance={true}>
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-[var(--card-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--border-dark)]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-red-900 bg-opacity-20 flex items-center justify-center mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Paiement échoué</h1>
          <p className="text-[var(--text-secondary)] max-w-md">
            Nous n'avons pas pu traiter votre paiement. Veuillez vérifier vos informations et réessayer.
          </p>
        </div>
        
        <div className="bg-[var(--background-elevated-2)] rounded-[var(--radius-md)] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Détails de l'erreur</h2>
          
          <div className="space-y-3">
            {orderId && (
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Numéro de commande</span>
                <span className="font-medium">{orderId}</span>
              </div>
            )}
            
            {purchaseDetails && (
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Montant</span>
                <span className="font-medium">{purchaseDetails.price.toLocaleString()} FCFA</span>
              </div>
            )}
            
            <div className="bg-red-900 bg-opacity-10 p-4 rounded-[var(--radius-sm)] border border-red-900 border-opacity-20">
              <p className="text-red-300">{errorMessage}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-[var(--radius-md)] bg-[var(--background-elevated)] hover:bg-[var(--background-elevated-2)] transition-colors border border-[var(--border-dark)]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour à l'accueil</span>
          </Link>
          
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Réessayer</span>
          </Link>
        </div>
      </div>
    </Layout>
  );
};
