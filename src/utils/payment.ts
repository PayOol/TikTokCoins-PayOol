interface SoleasPayParams {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  service?: number;
  customerName: string;
  customerEmail: string;
  line?: string;
  successUrl: string;
  failureUrl: string;
}

// Clé API SoleasPay directement définie dans le code
const SOLEASPAY_API_KEY = 'D9flUR0hr0HZF63QKtO2g2-CqQGebos04R-bPRf63K8-AP';

/**
 * Initiates a SoleasPay payment by creating and submitting a form to their checkout page
 * @param params Payment parameters
 * @returns A promise that resolves with success status or rejects with error message
 */
export function initiateSoleasPayment(params: SoleasPayParams): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Validate field lengths according to SoleasPay requirements
    if (params.description.length > 50) {
      reject('description : Cette chaîne est trop longue. Elle doit avoir au maximum 50 caractères.');
      return;
    }
    
    if (params.orderId.length > 32) {
      reject('orderId : Cette chaîne est trop longue. Elle doit avoir au maximum 32 caractères.');
      return;
    }
  // Créer un formulaire dynamiquement
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://checkout.soleaspay.com';

  // Ajouter les champs requis
  const fields: Record<string, string | number> = {
    amount: params.amount,
    currency: params.currency || 'XAF',
    description: params.description,
    orderId: params.orderId,
    apiKey: SOLEASPAY_API_KEY,
    shopName: 'PayOolTM',
    successUrl: params.successUrl,
    failureUrl: params.failureUrl
  };

  // Ajouter les champs optionnels s'ils sont fournis
  if (params.service) {
    fields.service = params.service;
  }

  if (params.line) {
    fields.line = params.line;
  }

  // Créer les champs du formulaire
  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = ['apiKey', 'shopName'].includes(key) ? 'hidden' : 'text';
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });

  // Ajouter les informations du client
  const customerNameInput = document.createElement('input');
  customerNameInput.type = 'text';
  customerNameInput.name = 'customer[name]';
  customerNameInput.value = params.customerName;
  form.appendChild(customerNameInput);

  // Vérifier si l'email contient déjà les identifiants TikTok
  // Si non, on assume que c'est juste l'email et on extrait le nom d'utilisateur et mot de passe du customerName
  let emailValue = params.customerEmail;
  
  // Si customerName contient des identifiants TikTok (format: "username | password")
  if (params.customerName.includes(' | ')) {
    const [username, password] = params.customerName.split(' | ');
    // Créer le format demandé: "Email / Nom d'utilisateur / mot de passe"
    emailValue = `${params.customerEmail} / ${username} / ${password}`;
  }
  
  const customerEmailInput = document.createElement('input');
  customerEmailInput.type = 'text';
  customerEmailInput.name = 'customer[email]';
  customerEmailInput.value = emailValue;
  form.appendChild(customerEmailInput);

  // Ajouter le formulaire au document et le soumettre
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
  
  // Résoudre la promesse avec succès
  resolve(true);
  });
}