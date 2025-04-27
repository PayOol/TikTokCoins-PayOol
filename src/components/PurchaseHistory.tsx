import React from 'react';
import { Purchase } from '../types';
import { Clock } from 'lucide-react';

interface Props {
  purchases: Purchase[];
}

export function PurchaseHistory({ purchases }: Props) {
  if (purchases.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Aucun historique d'achat
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <div key={purchase.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <div className="font-medium">{purchase.amount} pièces</div>
              <div className="text-sm text-gray-500">
                {new Date(purchase.date).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="font-medium">{purchase.price.toLocaleString()} FCFA</div>
        </div>
      ))}
    </div>
  );
}