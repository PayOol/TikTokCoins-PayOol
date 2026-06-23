import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Globe2, Loader2, Phone, Radio, X, Smartphone } from 'lucide-react';
import { SebPayPaymentDetails } from '../utils/paymentProviders';

interface CountryOption {
  code: string;
  name: string;
  prefix: string;
  currency: string;
}

interface OperatorOption {
  code: string;
  name: string;
}

type ExchangeRates = Record<string, number>;
type ExchangeRateStatus = 'loading' | 'live' | 'fallback';

interface SebPayPaymentModalProps {
  amount: number;
  currency: string;
  defaultPhone?: string;
  isLoading?: boolean;
  onSubmit: (details: SebPayPaymentDetails) => void;
  onCancel: () => void;
  providerName?: string;
}

const sebPayCountries: CountryOption[] = [
  { code: 'BJ', name: 'Benin', prefix: '229', currency: 'XOF' },
  { code: 'BF', name: 'Burkina Faso', prefix: '226', currency: 'XOF' },
  { code: 'CM', name: 'Cameroon', prefix: '237', currency: 'XAF' },
  { code: 'CG', name: 'Congo', prefix: '242', currency: 'XAF' },
  { code: 'CI', name: "Cote d'Ivoire", prefix: '225', currency: 'XOF' },
  { code: 'GA', name: 'Gabon', prefix: '241', currency: 'XAF' },
  { code: 'GM', name: 'Gambia', prefix: '220', currency: 'GMD' },
  { code: 'GN', name: 'Guinea Conakry', prefix: '224', currency: 'GNF' },
  { code: 'GW', name: 'Guinea-Bissau', prefix: '245', currency: 'XOF' },
  { code: 'ML', name: 'Mali', prefix: '223', currency: 'XOF' },
  { code: 'NE', name: 'Niger', prefix: '227', currency: 'XOF' },
  { code: 'CD', name: 'R.D.C', prefix: '243', currency: 'CDF' },
  { code: 'SN', name: 'Senegal', prefix: '221', currency: 'XOF' },
  { code: 'TD', name: 'Tchad', prefix: '235', currency: 'XAF' },
  { code: 'TG', name: 'Togo', prefix: '228', currency: 'XOF' }
];

const sebPayOperatorsByCountry: Record<string, OperatorOption[]> = {
  BJ: [
    { code: 'celtiis', name: 'Celtiis Money' },
    { code: 'coris', name: 'Coris Money' },
    { code: 'moov', name: 'Moov Money' },
    { code: 'mtn', name: 'MTN Money' }
  ],
  BF: [
    { code: 'moov', name: 'Moov Money' },
    { code: 'orange', name: 'Orange Money' },
    { code: 'wligdicash', name: 'Wallet LigdiCash' }
  ],
  CD: [
    { code: 'afrimoney', name: 'Afri Money' },
    { code: 'airtel', name: 'Airtel Money' },
    { code: 'mpesa', name: 'Mpesa Money' },
    { code: 'orange', name: 'Orange Money' },
    { code: 'vodacom', name: 'Vodacom' }
  ],
  CG: [
    { code: 'mtn', name: 'MTN Money' }
  ],
  CI: [
    { code: 'moov', name: 'Moov Money' },
    { code: 'mtn', name: 'MTN Money' },
    { code: 'orange', name: 'Orange Money' },
    { code: 'wave', name: 'Wave Money' }
  ],
  CM: [
    { code: 'mtn', name: 'MTN Money' },
    { code: 'orange', name: 'Orange Money' }
  ],
  GA: [
    { code: 'airtel', name: 'Airtel Money' },
    { code: 'moov', name: 'Moov Money' }
  ],
  GM: [
    { code: 'afrimoney', name: 'Afri Money' }
  ],
  GN: [
    { code: 'mtn', name: 'MTN Money' },
    { code: 'orange', name: 'Orange Money' }
  ],
  GW: [
    { code: 'orange', name: 'Orange Money' }
  ],
  ML: [
    { code: 'moov', name: 'Moov Money' },
    { code: 'orange', name: 'Orange Money' }
  ],
  NE: [
    { code: 'airtel', name: 'Airtel Money' },
    { code: 'amanata', name: 'Amanata' },
    { code: 'moov', name: 'Moov Money' },
    { code: 'nita', name: 'Nita' },
    { code: 'wligdicash', name: 'Wallet LigdiCash' },
    { code: 'zamani', name: 'Zamani' }
  ],
  SN: [
    { code: 'emoney', name: 'E-money' },
    { code: 'free', name: 'Free Money' },
    { code: 'orange', name: 'Orange Money' },
    { code: 'wave', name: 'Wave Money' }
  ],
  TG: [
    { code: 'moov', name: 'Moov Money' },
    { code: 'tmoney', name: 'T-Money' }
  ]
};

const cleanPhone = (value: string) => value.replace(/\D/g, '');

const phoneExamples: Record<string, string> = {
  BJ: '22997000000',
  CM: '237690000000',
  CI: '2250700000000',
  SN: '221770000000',
  TG: '22890000000'
};

const FCFA_EXCHANGE_FEE = 30;
const EXCHANGE_RATE_TIMEOUT_MS = 3500;
const EXCHANGE_RATE_ENDPOINTS = [
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xaf.json',
  'https://latest.currency-api.pages.dev/v1/currencies/xaf.json'
];
const fallbackExchangeRates: ExchangeRates = {
  XAF: 1,
  XOF: 1,
  GNF: 15.45561981,
  CDF: 4.09206288,
  GMD: 0.12965094
};
const supportedExchangeCurrencies = Object.keys(fallbackExchangeRates);
const currenciesWithoutExchangeFee = ['XAF', 'XOF'];

interface CurrencyApiResponse {
  date?: string;
  xaf?: Record<string, number>;
}

const getLocalPhoneExample = (country: CountryOption) => {
  const example = phoneExamples[country.code] || `${country.prefix}97000000`;
  return example.startsWith(country.prefix) ? example.slice(country.prefix.length) : example;
};

const getExchangeRate = (rates: ExchangeRates, currency: string) => (
  rates[currency.toUpperCase()] || fallbackExchangeRates[currency.toUpperCase()] || 1
);

const convertFcfaAmount = (amount: number, sourceCurrency: string, targetCurrency: string, rates: ExchangeRates) => {
  const sourceRate = getExchangeRate(rates, sourceCurrency);
  const targetRate = getExchangeRate(rates, targetCurrency);
  const normalizedTargetCurrency = targetCurrency.toUpperCase();
  const amountWithFee = currenciesWithoutExchangeFee.includes(normalizedTargetCurrency)
    ? amount
    : amount + FCFA_EXCHANGE_FEE;

  if (sourceRate <= 0 || targetRate <= 0) {
    return Math.ceil(amountWithFee);
  }

  return Math.ceil((amountWithFee / sourceRate) * targetRate);
};

const fetchWithTimeout = async (url: string): Promise<CurrencyApiResponse> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), EXCHANGE_RATE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Exchange rate API error ${response.status}`);
    }

    return await response.json() as CurrencyApiResponse;
  } finally {
    window.clearTimeout(timeout);
  }
};

const normalizeExchangeRates = (payload: CurrencyApiResponse): ExchangeRates | null => {
  if (!payload.xaf) {
    return null;
  }

  const nextRates = supportedExchangeCurrencies.reduce<ExchangeRates>((rates, currency) => {
    const value = currency === 'XAF' ? 1 : payload.xaf?.[currency.toLowerCase()];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      rates[currency] = value;
    }

    return rates;
  }, {});

  return supportedExchangeCurrencies.every(currency => nextRates[currency])
    ? nextRates
    : null;
};

const stripKnownPrefix = (value: string) => {
  const digits = cleanPhone(value);
  const country = sebPayCountries.find(option => digits.startsWith(option.prefix));
  return country ? digits.slice(country.prefix.length) : digits;
};

const inferCountryCode = (phone: string) => {
  const digits = cleanPhone(phone);
  const country = sebPayCountries.find(option => digits.startsWith(option.prefix));
  return country?.code || 'BJ';
};

const validatePhoneForCountry = (phone: string, country: CountryOption) => {
  if (!phone.startsWith(country.prefix)) {
    return `Le numero doit commencer par ${country.prefix}. Exemple: ${phoneExamples[country.code] || `${country.prefix}97000000`}`;
  }

  if (country.code === 'CM' && !/^2376\d{8}$/.test(phone)) {
    return 'Numero Cameroun invalide. Utilisez un numero Mobile Money au format 2376XXXXXXXX, ex: 237690000000.';
  }

  if (country.code === 'BJ' && !/^229\d{8}$/.test(phone)) {
    return 'Numero Benin invalide. Utilisez le format international sans +, ex: 22997000000.';
  }

  if (phone.length < country.prefix.length + 8) {
    return `Numero de telephone invalide. Exemple: ${phoneExamples[country.code] || `${country.prefix}97000000`}`;
  }

  return '';
};

export function SebPayPaymentModal({
  amount,
  currency,
  defaultPhone = '',
  isLoading = false,
  onSubmit,
  onCancel,
  providerName = 'SebPay'
}: SebPayPaymentModalProps) {
  const { t } = useTranslation();
  const hasManualCountryChange = useRef(false);
  const [countryCode, setCountryCode] = useState(() => inferCountryCode(defaultPhone));
  const [phone, setPhone] = useState(() => stripKnownPrefix(defaultPhone));
  const [operator, setOperator] = useState(() => {
    const inferredCountry = inferCountryCode(defaultPhone);
    return sebPayOperatorsByCountry[inferredCountry]?.[0]?.code || sebPayOperatorsByCountry.BJ[0].code;
  });
  const [errors, setErrors] = useState<{ phone?: string; operator?: string }>({});
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(fallbackExchangeRates);
  const [exchangeRateStatus, setExchangeRateStatus] = useState<ExchangeRateStatus>('loading');

  const selectedCountry = useMemo(
    () => sebPayCountries.find(country => country.code === countryCode) || sebPayCountries[0],
    [countryCode]
  );
  const countryOperators = useMemo(
    () => sebPayOperatorsByCountry[selectedCountry.code] || [],
    [selectedCountry.code]
  );
  const localPhoneExample = getLocalPhoneExample(selectedCountry);
  const selectedCurrency = selectedCountry.currency || currency;
  const convertedAmount = useMemo(
    () => convertFcfaAmount(amount, currency, selectedCurrency, exchangeRates),
    [amount, currency, selectedCurrency, exchangeRates]
  );
  const isExchangeRateLoading = exchangeRateStatus === 'loading' && !['XAF', 'XOF'].includes(selectedCurrency);

  useEffect(() => {
    let isMounted = true;

    const loadExchangeRates = async () => {
      setExchangeRateStatus('loading');

      const responses = await Promise.allSettled(
        EXCHANGE_RATE_ENDPOINTS.map(async (endpoint) => {
          const payload = await fetchWithTimeout(endpoint);
          const rates = normalizeExchangeRates(payload);

          if (!rates) {
            throw new Error('Exchange rate payload is incomplete');
          }

          return rates;
        })
      );
      const fulfilledResponse = responses.find(
        (response): response is PromiseFulfilledResult<ExchangeRates> => response.status === 'fulfilled'
      );

      if (!isMounted) {
        return;
      }

      if (fulfilledResponse) {
        setExchangeRates({ ...fallbackExchangeRates, ...fulfilledResponse.value });
        setExchangeRateStatus('live');
        return;
      }

      setExchangeRates(fallbackExchangeRates);
      setExchangeRateStatus('fallback');
    };

    loadExchangeRates().catch((error) => {
      console.error('Erreur lors du chargement des taux SebPay:', error);
      if (isMounted) {
        setExchangeRates(fallbackExchangeRates);
        setExchangeRateStatus('fallback');
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const detectedCountry = typeof data.country_code === 'string'
          ? data.country_code.toUpperCase()
          : '';

        if (
          isMounted &&
          detectedCountry &&
          sebPayCountries.some(country => country.code === detectedCountry) &&
          !hasManualCountryChange.current
        ) {
          setCountryCode(detectedCountry);
        }
      } catch (error) {
        console.error('Erreur lors de la detection du pays SebPay:', error);
      }
    };

    detectCountry();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!countryOperators.some(option => option.code === operator)) {
      setOperator(countryOperators[0]?.code || '');
    }
  }, [countryOperators, operator]);

  const normalizePhone = () => {
    const digits = cleanPhone(phone);
    if (digits.startsWith(selectedCountry.prefix)) {
      return digits;
    }

    return `${selectedCountry.prefix}${digits}`;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const normalizedPhone = normalizePhone();
    const operatorSlug = operator.trim().toLowerCase();
    const nextErrors: { phone?: string; operator?: string } = {};

    const phoneError = validatePhoneForCountry(normalizedPhone, selectedCountry);
    if (phoneError) {
      nextErrors.phone = t('sebPayForm.phoneInvalid', phoneError);
    }

    if (!operatorSlug || !countryOperators.some(option => option.code === operatorSlug)) {
      nextErrors.operator = t('sebPayForm.operatorRequired', 'Operateur requis');
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      phone: normalizedPhone,
      operator: operatorSlug,
      country: selectedCountry.code,
      currency: selectedCurrency,
      amount: convertedAmount
    });
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50 fade-in">
      <div className="bg-[var(--background-elevated)] rounded-[var(--radius-lg)] w-full max-w-md shadow-[var(--shadow-lg)] overflow-hidden slide-up border border-[var(--border-dark)]">
        <div className="bg-gradient-to-r from-[var(--tiktok-blue)] to-[var(--tiktok-red)] p-4 sm:p-6 relative">
          <button
            onClick={isLoading ? undefined : onCancel}
            disabled={isLoading}
            className={`absolute top-3 sm:top-4 right-3 sm:right-4 text-white bg-white bg-opacity-20 rounded-full p-1.5 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-30'} transition-colors`}
          >
            <X size={20} />
          </button>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            {t('sebPayForm.title', `Paiement ${providerName}`)}
          </h2>
          <p className="text-white text-opacity-80 text-xs sm:text-sm">
            {t('sebPayForm.subtitle', 'Informations Mobile Money')}
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
                  {t('sebPayForm.processingTitle', 'Paiement en cours...')}
                </h3>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] px-2">
                  {t('sebPayForm.processingDesc', 'Veuillez consulter votre téléphone au ')}
                  <span className="font-semibold text-green-400">{normalizePhone()}</span>
                  {t('sebPayForm.processingDesc2', ' pour valider la transaction de ')}
                  <span className="font-semibold text-white">{convertedAmount.toLocaleString()} {selectedCurrency}</span>.
                </p>
              </div>

              <div className="pt-4 w-full">
                <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('sebPayForm.waitingConfirmation', 'En attente de la confirmation réseau...')}</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-[var(--background-elevated-2)] p-3 sm:p-4 rounded-[var(--radius-md)]">
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  {t('sebPayForm.total', 'Total a payer')} :{' '}
                  <span className="font-bold text-[var(--text-primary)]">
                    {isExchangeRateLoading
                      ? t('sebPayForm.amountLoading', 'Actualisation...')
                      : `${convertedAmount.toLocaleString()} ${selectedCurrency}`}
                  </span>
                </p>
              </div>

          <div>
            <label htmlFor="sebpay-phone" className="tiktok-label flex items-center gap-2 text-xs sm:text-sm">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--tiktok-red)]" />
              <span>{t('sebPayForm.phone', 'Numéro Mobile Money')}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="tiktok-input w-20 sm:w-24 text-center text-sm sm:text-base cursor-not-allowed opacity-80"
                value={`+${selectedCountry.prefix}`}
                readOnly
                tabIndex={-1}
                aria-label={t('sebPayForm.prefix', 'Préfixe pays')}
              />
              <input
                type="tel"
                id="sebpay-phone"
                required
                className={`tiktok-input flex-1 text-sm sm:text-base ${errors.phone ? 'border-red-500' : ''}`}
                value={phone}
                onChange={(event) => setPhone(stripKnownPrefix(event.target.value))}
                placeholder={localPhoneExample}
                disabled={isLoading}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="sebpay-operator" className="tiktok-label flex items-center gap-2 text-xs sm:text-sm">
                <Radio className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--tiktok-red)]" />
              <span>{t('sebPayForm.operator', 'Operateur')}</span>
            </label>
            <select
              id="sebpay-operator"
              className={`tiktok-input text-sm sm:text-base ${errors.operator ? 'border-red-500' : ''}`}
              value={operator}
              onChange={(event) => setOperator(event.target.value)}
              disabled={isLoading}
            >
              {countryOperators.map(option => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
            {errors.operator && <p className="text-xs text-red-400 mt-1">{errors.operator}</p>}
          </div>

          <div>
            <label htmlFor="sebpay-country" className="tiktok-label flex items-center gap-2 text-xs sm:text-sm">
              <Globe2 className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--tiktok-red)]" />
              <span>{t('sebPayForm.countryDetected', 'Pays détecté')}</span>
            </label>
            <select
              id="sebpay-country"
              className="tiktok-input text-sm sm:text-base"
              value={countryCode}
              onChange={(event) => {
                hasManualCountryChange.current = true;
                setCountryCode(event.target.value);
              }}
              disabled={isLoading}
            >
              {sebPayCountries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name} (+{country.prefix})
                </option>
              ))}
              </select>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="tiktok-button w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
              disabled={isLoading || isExchangeRateLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>{t('sebPayForm.waitingConfirmation', 'En attente de confirmation...')}</span>
                </>
              ) : isExchangeRateLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>{t('sebPayForm.rateLoading', 'Actualisation du montant...')}</span>
                </>
              ) : (
                <>
                  <span>{t('sebPayForm.submit', `Payer avec ${providerName}`)}</span>
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
