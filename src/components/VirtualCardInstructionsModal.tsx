import { CreditCard, X, XCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const usageStats = [
  {
    label: 'Période de validité',
    value: '3 ans',
  },
  {
    label: 'Limite par transaction',
    value: '10 000 $',
  },
  {
    label: 'Limite du solde',
    value: '100 000 $',
  },
  {
    label: "Frais d'échec",
    value: '0.5 $ / trans.',
  },
];

const warnings = [
  'Les cartes sont résiliées après 3 à 5 refus successifs',
  'Les cartes sont résiliées si elles ne sont pas rechargées 3 semaines après leur achat',
];

export function VirtualCardInstructionsModal({ isOpen, onAccept, onDecline }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop fade-in">
      <div className="slide-up max-h-[90vh] w-full max-w-md overflow-hidden overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border-dark)] bg-[var(--card-bg)] shadow-[var(--shadow-lg)]">
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 text-white sm:px-5">
          <button
            type="button"
            onClick={onDecline}
            aria-label="Fermer"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="pr-10 text-xl font-black leading-tight">Notes d'utilisation</h2>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="rounded-[var(--radius-md)] border border-blue-400/30 bg-blue-500/10 p-3.5">
            <div className="mb-2 flex items-center gap-2 text-sm font-black text-blue-500">
              <CreditCard className="h-4 w-4" />
              <span>CARTES VIRTUELLES</span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Nous émettons des cartes virtuelles Mastercard et Visa (USD) qui fonctionnent sur toutes
              les plateformes à l'exception des plateformes de paris sportifs, de crypto monnaie, Wise
              et des films pour adulte.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {usageStats.map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--radius-sm)] border border-[var(--border-dark)] bg-[var(--background-elevated)] p-3"
              >
                <p className="text-xs font-semibold leading-tight text-[var(--text-secondary)]">{item.label}</p>
                <p className="mt-1 text-sm font-black text-[var(--text-primary)]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-[var(--radius-md)] border border-red-400/25 bg-red-500/10 p-3">
            {warnings.map((warning) => (
              <div key={warning} className="flex items-start gap-2 text-sm leading-relaxed text-red-500">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onAccept}
              className="flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-black text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              J'accepte
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--background-elevated-2)] px-4 text-sm font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--background-hover)]"
            >
              Refuser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
