import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Globe2, Loader2, Phone, Radio, Wallet, X, AlertCircle, Copy, Check, Smartphone } from 'lucide-react';
import { SebPayPaymentDetails } from '../utils/paymentProviders';
import { getProviderConfig } from '../utils/paymentProviders/config';
import { PaymentProviderType } from '../utils/paymentProviders/types';

/* ────────────────────────────────────────────────
 * Types matching the AfribaPay /v1/countries response
 * ──────────────────────────────────────────────── */

interface AfribaPayOperator {
  operator_code: string;
  operator_name: string;
  otp_required: number;
  ussd_code: string;
  wallet: number;
}

interface AfribaPayCurrency {
  currency: string;
  operators: AfribaPayOperator[];
}

interface AfribaPayCountry {
  country_code: string;
  country_name: string;
  prefix: string;
  taxes: Record<string, unknown>;
  currencies: Record<string, AfribaPayCurrency>;
}

type AfribaPayCountriesMap = Record<string, AfribaPayCountry>;

/* ────────────────────────────────────────────────
 * Component Props
 * ──────────────────────────────────────────────── */

interface AfribaPayPaymentModalProps {
  amount: number;
  currency: string;
  defaultPhone?: string;
  isLoading?: boolean;
  onSubmit: (details: SebPayPaymentDetails) => void;
  onCancel: () => void;
}

const cleanPhone = (value: string) => value.replace(/\D/g, '');

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

/* ──────────────────────────────────────────────── */

export function AfribaPayPaymentModal({
  amount,
  currency,
  defaultPhone = '',
  isLoading = false,
  onSubmit,
  onCancel
}: AfribaPayPaymentModalProps) {
  const { t } = useTranslation();
  const hasManualCountryChange = useRef(false);

  // AfribaPay countries fetched from API
  const [countriesMap, setCountriesMap] = useState<AfribaPayCountriesMap>({});
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  // Form state
  const [countryCode, setCountryCode] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [operatorCode, setOperatorCode] = useState('');
  const [phone, setPhone] = useState(() => cleanPhone(defaultPhone));
  const [otpCode, setOtpCode] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; operator?: string; otp?: string }>({});
  const [copiedUssd, setCopiedUssd] = useState(false);

  // Exchange rates state
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  // Derived data
  const countriesList = useMemo(
    () => Object.values(countriesMap).sort((a, b) => a.country_name.localeCompare(b.country_name)),
    [countriesMap]
  );

  const selectedCountry = useMemo(
    () => countriesMap[countryCode] || null,
    [countriesMap, countryCode]
  );

  const availableCurrencies = useMemo(() => {
    if (!selectedCountry) return [];
    return Object.entries(selectedCountry.currencies).map(([code, info]) => ({
      code,
      name: info.currency
    }));
  }, [selectedCountry]);

  const availableOperators = useMemo(() => {
    if (!selectedCountry || !currencyCode) return [];
    const cur = selectedCountry.currencies[currencyCode];
    if (!cur) return [];
    return cur.operators;
  }, [selectedCountry, currencyCode]);

  const selectedOperator = useMemo(
    () => availableOperators.find(op => op.operator_code === operatorCode) || null,
    [availableOperators, operatorCode]
  );

  // ── Fetch countries from proxy ──
  useEffect(() => {
    let isMounted = true;
    const proxyUrl = getProviderConfig(PaymentProviderType.AFRIBAPAY)?.proxyUrl || '';

    if (!proxyUrl) {
      setCountriesError('Proxy AfribaPay non configuré');
      setCountriesLoading(false);
      return;
    }

    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        setCountriesError(null);
        const response = await fetch(`${proxyUrl}/countries`);

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.error || `Erreur ${response.status}`);
        }

        const data = await response.json();

        if (!isMounted) return;

        // The API may return data directly as a map or wrapped in a "data" key
        const map: AfribaPayCountriesMap = data.data || data;

        if (typeof map !== 'object' || Object.keys(map).length === 0) {
          throw new Error('Aucun pays disponible');
        }

        setCountriesMap(map);
      } catch (error) {
        if (isMounted) {
          setCountriesError(error instanceof Error ? error.message : 'Erreur inconnue');
        }
      } finally {
        if (isMounted) {
          setCountriesLoading(false);
        }
      }
    };

    fetchCountries();
    return () => { isMounted = false; };
  }, []);

  // ── Fetch exchange rates ──
  useEffect(() => {
    let isMounted = true;
    const fetchRates = async () => {
      try {
        // Use the base currency (e.g. XAF or XOF)
        const baseCur = currency === 'FCFA' ? 'XOF' : currency;
        const response = await fetch(`https://open.er-api.com/v6/latest/${baseCur}`);
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && data && data.rates) {
          setExchangeRates(data.rates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
      }
    };
    fetchRates();
    return () => { isMounted = false; };
  }, [currency]);

  // ── Compute converted amount ──
  const convertedAmount = useMemo(() => {
    if (!currencyCode) return amount;
    // FCFA to XOF or XAF is 1:1
    if (currencyCode === currency || (currency === 'XOF' && currencyCode === 'XAF') || (currency === 'XAF' && currencyCode === 'XOF')) {
      return amount;
    }
    const rate = exchangeRates[currencyCode];
    if (!rate) return amount;
    return Math.round(amount * rate);
  }, [amount, currency, currencyCode, exchangeRates]);

  const matchedPhoneCountryCode = useMemo(() => {
    if (!defaultPhone || countriesList.length === 0) return null;
    const cleaned = cleanPhone(defaultPhone);
    const matched = countriesList.find(c => cleaned.startsWith(c.prefix));
    return matched ? matched.country_code : null;
  }, [defaultPhone, countriesList]);

  // ── Auto-detect country by IP (only if no phone match) ──
  useEffect(() => {
    if (countriesList.length === 0 || hasManualCountryChange.current || matchedPhoneCountryCode) return;
    let isMounted = true;

    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const detected = typeof data.country_code === 'string' ? data.country_code.toUpperCase() : '';

        if (isMounted && detected && countriesMap[detected] && !hasManualCountryChange.current && !matchedPhoneCountryCode) {
          setCountryCode(detected);
        }
      } catch {
        // Ignore detection failure
      }
    };

    detectCountry();
    return () => { isMounted = false; };
  }, [countriesList, countriesMap, matchedPhoneCountryCode]);

  // ── Auto-select country ──
  useEffect(() => {
    if (countriesList.length > 0 && !countryCode && !hasManualCountryChange.current) {
      if (matchedPhoneCountryCode) {
        setCountryCode(matchedPhoneCountryCode);
      } else {
        setCountryCode(countriesList[0].country_code);
      }
    }
  }, [countriesList, countryCode, matchedPhoneCountryCode]);

  // ── Auto-select currency when country changes ──
  useEffect(() => {
    if (availableCurrencies.length === 1) {
      setCurrencyCode(availableCurrencies[0].code);
    } else if (availableCurrencies.length > 1) {
      // Prefer a currency matching the payment currency, or first available
      const match = availableCurrencies.find(c => c.code === currency);
      setCurrencyCode(match ? match.code : availableCurrencies[0].code);
    } else {
      setCurrencyCode('');
    }
  }, [availableCurrencies, currency]);

  // ── Auto-select operator when operators change ──
  useEffect(() => {
    if (availableOperators.length > 0 && !availableOperators.some(op => op.operator_code === operatorCode)) {
      setOperatorCode(availableOperators[0].operator_code);
    }
  }, [availableOperators, operatorCode]);

  // ── Strip country prefix from phone ──
  const stripPrefix = (value: string, country = selectedCountry) => {
    const digits = cleanPhone(value);
    if (country && digits.startsWith(country.prefix)) {
      return digits.slice(country.prefix.length);
    }
    return digits;
  };

  useEffect(() => {
    if (selectedCountry) {
      setPhone(prev => stripPrefix(prev, selectedCountry));
    }
  }, [selectedCountry]);

  const normalizePhone = () => {
    const digits = cleanPhone(phone);
    if (!selectedCountry) return digits;
    if (digits.startsWith(selectedCountry.prefix)) return digits;
    return `${selectedCountry.prefix}${digits}`;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const normalizedPhone = normalizePhone();
    const nextErrors: { phone?: string; operator?: string; otp?: string } = {};

    if (!normalizedPhone || normalizedPhone.length < 8) {
      nextErrors.phone = t('afribaPayForm.phoneInvalid', 'Numéro de téléphone invalide');
    }

    if (!operatorCode) {
      nextErrors.operator = t('afribaPayForm.operatorRequired', 'Veuillez sélectionner un opérateur');
    }
    
    if (selectedOperator?.otp_required === 1 && !otpCode) {
      nextErrors.otp = t('afribaPayForm.otpRequired', 'Code OTP requis pour cet opérateur');
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      phone: normalizedPhone,
      operator: operatorCode,
      country: countryCode,
      currency: currencyCode || currency,
      amount: convertedAmount,
      otpCode: selectedOperator?.otp_required === 1 ? otpCode : undefined
    });
  };

  // ── Loading state ──
  if (countriesLoading) {
    return (
      <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50 fade-in">
        <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-md shadow-[var(--shadow-lg)] overflow-hidden slide-up border border-[var(--border-dark)]">
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4 sm:p-6 relative">
            <button
              onClick={onCancel}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white bg-white bg-opacity-20 rounded-full p-1.5 hover:bg-opacity-30 transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Paiement AfribaPay
            </h2>
            <p className="text-white text-opacity-80 text-xs sm:text-sm">
              Chargement des pays disponibles...
            </p>
          </div>
          <div className="p-6 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-green-500" />
            <p className="text-sm text-[var(--text-secondary)]">
              Récupération des données AfribaPay...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (countriesError) {
    return (
      <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50 fade-in">
        <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-md shadow-[var(--shadow-lg)] overflow-hidden slide-up border border-[var(--border-dark)]">
          <div className="bg-gradient-to-r from-red-600 to-red-500 p-4 sm:p-6 relative">
            <button
              onClick={onCancel}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white bg-white bg-opacity-20 rounded-full p-1.5 hover:bg-opacity-30 transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Paiement AfribaPay
            </h2>
            <p className="text-white text-opacity-80 text-xs sm:text-sm">
              Erreur de chargement
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-3 bg-red-900 bg-opacity-20 p-4 rounded-[var(--radius-md)] mb-4">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{countriesError}</p>
            </div>
            <button onClick={onCancel} className="tiktok-button w-full">
              {t('cancel', 'Fermer')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50 fade-in">
      <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-md shadow-[var(--shadow-lg)] overflow-hidden slide-up border border-[var(--border-dark)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4 sm:p-6 relative">
          <button
            onClick={isLoading ? undefined : onCancel}
            disabled={isLoading}
            className={`absolute top-3 sm:top-4 right-3 sm:right-4 text-white bg-white bg-opacity-20 rounded-full p-1.5 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-30'} transition-colors`}
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <img
              src={`${import.meta.env.BASE_URL}afribapay.png`}
              alt="AfribaPay"
              className="h-8 w-auto object-contain rounded-sm bg-white bg-opacity-90 p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Paiement AfribaPay
            </h2>
          </div>
          <p className="text-white text-opacity-80 text-xs sm:text-sm">
            {t('afribaPayForm.subtitle', 'Paiement Mobile Money sécurisé')}
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[350px] space-y-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="relative mt-4">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-full shadow-lg shadow-green-500/30">
                  <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-pulse" />
                </div>
                <Loader2 className="w-7 h-7 text-white absolute -bottom-2 -right-2 animate-spin bg-[#1a1b26] rounded-full p-1" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {t('afribaPayForm.processingTitle', 'Paiement en cours...')}
                </h3>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] px-2">
                  {t('afribaPayForm.processingDesc', 'Veuillez consulter votre téléphone au ')}
                  <span className="font-semibold text-green-400">{normalizePhone()}</span>
                  {t('afribaPayForm.processingDesc2', ' pour valider la transaction de ')}
                  <span className="font-semibold text-white">{convertedAmount.toLocaleString()} {currencyCode || currency}</span>.
                </p>
              </div>

              {selectedOperator?.ussd_code && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-[var(--radius-md)] w-full text-left space-y-2 mt-4">
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                    {t('afribaPayForm.ussdProcessing', 'Si la notification ne s\'affiche pas, composez ce code :')}
                  </p>
                  <div className="flex items-center justify-between gap-2 bg-black/30 p-2 sm:p-3 rounded-md">
                    <code className="text-green-400 font-mono text-sm sm:text-base break-all">
                      {selectedOperator.ussd_code.replace(/montant/ig, convertedAmount.toString())}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOperator.ussd_code!.replace(/montant/ig, convertedAmount.toString()));
                        setCopiedUssd(true);
                        setTimeout(() => setCopiedUssd(false), 2000);
                      }}
                      className="p-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] rounded-md transition-colors text-[var(--text-primary)]"
                    >
                      {copiedUssd ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="pt-4 w-full">
                <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('afribaPayForm.waitingConfirmation', 'En attente de la confirmation réseau...')}</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount display */}
          <div className="bg-[var(--background-elevated-2)] p-3 sm:p-4 rounded-[var(--radius-md)] flex flex-col">
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              {t('afribaPayForm.total', 'Total à payer')} :{' '}
              <span className="font-bold text-[var(--text-primary)]">
                {convertedAmount.toLocaleString()} {currencyCode || currency}
              </span>
            </p>
            {convertedAmount !== amount && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                ≈ {amount.toLocaleString()} {currency} (Taux du marché en temps réel)
              </p>
            )}
          </div>

          {/* Phone input (Moved to top) */}
          <div>
            <label htmlFor="afribapay-phone" className="tiktok-label flex items-center gap-2 text-xs sm:text-sm">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              <span>{t('afribaPayForm.phone', 'Numéro Mobile Money')}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="tiktok-input w-20 sm:w-24 text-center text-sm sm:text-base cursor-not-allowed opacity-80"
                value={selectedCountry ? `+${selectedCountry.prefix}` : '+...'}
                readOnly
                tabIndex={-1}
                aria-label={t('afribaPayForm.prefix', 'Préfixe pays')}
              />
              <input
                type="tel"
                id="afribapay-phone"
                required
                className={`tiktok-input flex-1 text-sm sm:text-base ${errors.phone ? 'border-red-500' : ''}`}
                value={phone}
                onChange={(event) => setPhone(stripPrefix(event.target.value))}
                placeholder={selectedCountry ? `${selectedCountry.prefix}XXXXXXXX`.slice(selectedCountry.prefix.length) : ''}
                disabled={isLoading}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
          </div>

          {/* OTP input (conditionally shown based on operator) */}
          {selectedOperator?.otp_required === 1 && (
            <div>
              <label htmlFor="afribapay-otp" className="tiktok-label flex items-center gap-2 text-xs sm:text-sm">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                <span>{t('afribaPayForm.otp', 'Code de paiement (OTP)')}</span>
              </label>
              {selectedOperator.ussd_code && (() => {
                const ussdWithAmount = selectedOperator.ussd_code.replace(/montant/i, amount.toString());
                return (
                  <div className="text-xs text-[var(--text-secondary)] mb-2 mt-1 bg-[var(--background-elevated-2)] p-2 rounded flex items-center justify-between group">
                    <div>
                      Composez <strong className="text-[var(--text-primary)]">{ussdWithAmount}</strong> sur votre téléphone pour générer votre code.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ussdWithAmount);
                        setCopiedUssd(true);
                        setTimeout(() => setCopiedUssd(false), 2000);
                      }}
                      className="ml-2 p-1.5 text-[var(--text-secondary)] hover:text-green-500 hover:bg-[var(--background-modifier-hover)] rounded transition-colors flex-shrink-0"
                      title="Copier le code USSD"
                    >
                      {copiedUssd ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })()}
              <input
                type="text"
                id="afribapay-otp"
                required
                className={`tiktok-input w-full text-sm sm:text-base ${errors.otp ? 'border-red-500' : ''}`}
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="Code OTP..."
                disabled={isLoading}
              />
              {errors.otp && <p className="text-xs text-red-400 mt-1">{errors.otp}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Operator selector */}
            <div>
            <label htmlFor="afribapay-operator" className="tiktok-label flex items-center gap-2 text-xs sm:text-sm">
              <Radio className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              <span>{t('afribaPayForm.operator', 'Opérateur')}</span>
            </label>
            <select
              id="afribapay-operator"
              className={`tiktok-input text-sm sm:text-base ${errors.operator ? 'border-red-500' : ''}`}
              value={operatorCode}
              onChange={(event) => setOperatorCode(event.target.value)}
              disabled={isLoading || availableOperators.length === 0}
            >
              {availableOperators.length === 0 && (
                <option value="">{t('afribaPayForm.selectCountryFirst', '-- Sélectionnez un pays --')}</option>
              )}
              {availableOperators.map(op => (
                <option key={op.operator_code} value={op.operator_code}>
                  {op.operator_name}
                </option>
              ))}
            </select>
            {errors.operator && <p className="text-xs text-red-400 mt-1">{errors.operator}</p>}
            {selectedOperator && selectedOperator.wallet === 1 && (
              <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                {t('afribaPayForm.walletRedirect', 'Vous serez redirigé vers l\'app de paiement')}
              </p>
            )}
          </div>

          {/* Country selector */}
          <div>
            <label htmlFor="afribapay-country" className="tiktok-label flex items-center gap-2 text-xs sm:text-sm">
              <Globe2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              <span>{t('afribaPayForm.country', 'Pays')}</span>
            </label>
            <select
              id="afribapay-country"
              className="tiktok-input text-sm sm:text-base"
              value={countryCode}
              onChange={(event) => {
                hasManualCountryChange.current = true;
                setCountryCode(event.target.value);
              }}
              disabled={isLoading}
            >
              <option value="">{t('afribaPayForm.selectCountry', '-- Sélectionnez un pays --')}</option>
              {countriesList.map(country => (
                <option key={country.country_code} value={country.country_code}>
                  {getFlagEmoji(country.country_code)} {country.country_name}
                </option>
              ))}
            </select>
          </div>
        </div>

          {/* Currency selector (show only if multiple currencies) */}
          {availableCurrencies.length > 1 && (
            <div>
              <label htmlFor="afribapay-currency" className="tiktok-label flex items-center gap-2 text-xs sm:text-sm">
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                <span>{t('afribaPayForm.currency', 'Devise')}</span>
              </label>
              <select
                id="afribapay-currency"
                className="tiktok-input text-sm sm:text-base"
                value={currencyCode}
                onChange={(event) => setCurrencyCode(event.target.value)}
                disabled={isLoading}
              >
                {availableCurrencies.map(cur => (
                  <option key={cur.code} value={cur.code}>
                    {cur.code} — {cur.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Submit / Cancel */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3 rounded-[var(--radius-md)] font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !countryCode || !operatorCode}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>{t('afribaPayForm.waitingConfirmation', 'En attente de confirmation...')}</span>
                </>
              ) : (
                <>
                  <span>{t('afribaPayForm.submit', 'Payer avec AfribaPay')}</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={isLoading ? undefined : onCancel}
              disabled={isLoading}
              className={`w-full text-center py-2 flex items-center justify-center gap-2 text-xs sm:text-sm text-[var(--text-secondary)] ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-[var(--text-primary)]'} transition-colors`}
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{t('cancel')}</span>
            </button>
          </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
