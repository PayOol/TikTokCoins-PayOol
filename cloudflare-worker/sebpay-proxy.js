/**
 * Cloudflare Worker proxy for SebPay and AfribaPay APIs
 * 
 * This proxy handles CORS and forwards requests to the respective APIs.
 * Credentials are stored as environment variables in Cloudflare Workers.
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      const url = new URL(request.url);
      
      // Route to AfribaPay proxy
      if (url.pathname.startsWith('/api/afribapay')) {
        return await handleAfribaPay(request, env);
      }

      // Route to SebPay proxy
      if (url.pathname.startsWith('/api/sebpay')) {
        return await handleSebPay(request, env);
      }

      return new Response('Not found', { status: 404, headers: corsHeaders() });

    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(
        JSON.stringify({ error: 'Proxy error', message: error.message }),
        { 
          status: 500,
          headers: corsHeaders()
        }
      );
    }
  }
};

async function handleSebPay(request, env) {
  const url = new URL(request.url);
  // Get SebPay API credentials from environment variables
  const sebpayApiKey = env.SEBPAY_API_KEY;
  const sebpaySecretKey = env.SEBPAY_SECRET_KEY;

  if (!sebpayApiKey || !sebpaySecretKey) {
    return new Response(
      JSON.stringify({ error: 'SebPay credentials not configured' }),
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }

  // Extract the API endpoint from the path
  // /api/sebpay/collections -> https://newapi.sebpay.bj/api/v1/collections
  const apiPath = url.pathname.replace('/api/sebpay', '');
  const sebpayApiUrl = `https://newapi.sebpay.bj/api/v1${apiPath}`;

  // Clone the request and modify headers
  const modifiedHeaders = new Headers(request.headers);
  modifiedHeaders.set('X-Public-Key', sebpayApiKey);
  modifiedHeaders.set('X-Secret-Key', sebpaySecretKey);

  // Forward the request to SebPay API
  const sebpayRequest = new Request(sebpayApiUrl, {
    method: request.method,
    headers: modifiedHeaders,
    body: request.body,
  });

  const response = await fetch(sebpayRequest);
  
  // Clone the response to modify headers
  const modifiedResponse = new Response(response.body, response);
  
  // Add CORS headers
  modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
  modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return modifiedResponse;
}

async function handleAfribaPay(request, env) {
  const url = new URL(request.url);
  const apiUser = env.AFRIBAPAY_API_USER;
  const apiKey = env.AFRIBAPAY_API_KEY;
  const apiEnv = env.AFRIBAPAY_ENVIRONMENT || 'production';

  if (!apiUser || !apiKey) {
    return new Response(
      JSON.stringify({ error: 'AfribaPay API credentials not configured in Worker environment' }),
      { status: 500, headers: corsHeaders() }
    );
  }

  const baseApiUrl = apiEnv === 'sandbox' 
    ? 'https://api-sandbox.afribapay.com/v1' 
    : 'https://api.afribapay.com/v1';

  // Helper to fetch access token
  async function getAccessToken() {
    const authString = btoa(`${apiUser}:${apiKey}`);
    const tokenResponse = await fetch(`${baseApiUrl}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Failed to retrieve AfribaPay token: Status ${tokenResponse.status} - ${errText}`);
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.token || tokenData.access_token || tokenData.accessToken || (tokenData.data && (tokenData.data.token || tokenData.data.access_token));
    if (!token) {
      throw new Error(`No token found in AfribaPay response: ${JSON.stringify(tokenData)}`);
    }
    return token;
  }

  // Route: GET /api/afribapay/countries
  if (request.method === 'GET' && url.pathname.endsWith('/countries')) {
    try {
      const accessToken = await getAccessToken();

      const countriesResponse = await fetch(`${baseApiUrl}/countries`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await countriesResponse.text();
      let countriesData;
      try {
        countriesData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`AfribaPay countries returned non-JSON: ${responseText}`);
      }

      if (!countriesResponse.ok) {
        return new Response(
          JSON.stringify({ 
            error: countriesData.message || countriesData.error || `AfribaPay countries request failed (${countriesResponse.status})` 
          }),
          { status: countriesResponse.status, headers: corsHeaders() }
        );
      }

      return new Response(
        JSON.stringify(countriesData),
        { headers: corsHeaders() }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch countries', message: error.message }),
        { status: 500, headers: corsHeaders() }
      );
    }
  }

  // Route: POST /api/afribapay/payments
  if (request.method === 'POST' && url.pathname.endsWith('/payments')) {
    try {
      const body = await request.json();
      const accessToken = await getAccessToken();

      let notifyUrl = body.successUrl;
      if (notifyUrl && (notifyUrl.includes('localhost') || notifyUrl.includes('127.0.0.1'))) {
        notifyUrl = 'https://coins.payool.net/api/notify';
      }

      const apiBody = {
        operator: body.operator,
        country: body.country,
        phone_number: body.phone,
        amount: body.amount,
        currency: body.currency || 'XOF',
        order_id: body.orderId,
        reference_id: body.orderId,
        merchant_key: env.AFRIBAPAY_MERCHANT_KEY,
        lang: body.lang || 'fr',
        notify_url: notifyUrl
      };
      
      if (body.otpCode) {
        apiBody.otp_code = body.otpCode;
      }

      const payResponse = await fetch(`${baseApiUrl}/pay/payin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiBody)
      });

      const responseText = await payResponse.text();
      let payData;
      try {
        payData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`AfribaPay returned non-JSON response: ${responseText}`);
      }

      if (!payResponse.ok) {
        let errMsg = `AfribaPay request failed with status ${payResponse.status}`;
        if (payData) {
          if (typeof payData.error === 'string') {
            errMsg = payData.error;
          } else if (payData.error && typeof payData.error === 'object') {
            errMsg = payData.error.message || payData.error.status || JSON.stringify(payData.error);
          } else if (payData.message) {
            errMsg = payData.message;
          }
        }
        return new Response(
          JSON.stringify({ error: errMsg }),
          { status: payResponse.status, headers: corsHeaders() }
        );
      }

      // Find checkout page URL (if any, e.g. for Wave)
      const paymentUrl = payData.payment_url || 
                         payData.paymentUrl || 
                         payData.checkout_url || 
                         payData.checkoutUrl || 
                         payData.url || 
                         payData.redirect_url || 
                         payData.redirectUrl || 
                         (payData.data && (payData.data.payment_url || payData.data.paymentUrl || payData.data.url || payData.data.provider_link)) ||
                         null;

      const transactionId = payData.transaction_id || 
                            payData.transactionId || 
                            payData.id || 
                            (payData.data && (payData.data.transaction_id || payData.data.transactionId || payData.data.id)) ||
                            body.orderId;

      return new Response(
        JSON.stringify({
          success: true,
          paymentUrl,
          transactionId,
          data: payData.data || payData
        }),
        { headers: corsHeaders() }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: error.message || 'Failed to initiate payment', 
          message: error.message 
        }),
        { status: 500, headers: corsHeaders() }
      );
    }
  }

  // Route: GET /api/afribapay/payments/:orderId
  const match = url.pathname.match(/\/api\/afribapay\/payments\/([^/]+)$/);
  if (request.method === 'GET' && match) {
    const orderId = decodeURIComponent(match[1]);
    try {
      const accessToken = await getAccessToken();

      const statusResponse = await fetch(`${baseApiUrl}/status?order_id=${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await statusResponse.text();
      let statusData;
      try {
        statusData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`AfribaPay status check returned non-JSON: ${responseText}`);
      }

      if (!statusResponse.ok) {
        return new Response(
          JSON.stringify({ 
            error: statusData.message || statusData.error || `AfribaPay status check failed with status ${statusResponse.status}` 
          }),
          { status: statusResponse.status, headers: corsHeaders() }
        );
      }

      const rawStatus = statusData.status || (statusData.data && statusData.data.status);
      let mappedStatus = 'pending';

      if (rawStatus) {
        const lowerStatus = rawStatus.toLowerCase();
        if (['success', 'approved', 'completed', 'paid', 'successful'].includes(lowerStatus)) {
          mappedStatus = 'success';
        } else if (['failed', 'rejected', 'declined', 'error'].includes(lowerStatus)) {
          mappedStatus = 'failed';
        } else if (['cancelled', 'canceled', 'annule'].includes(lowerStatus)) {
          mappedStatus = 'cancelled';
        }
      }

      const transactionId = statusData.transaction_id || 
                            statusData.transactionId || 
                            statusData.id || 
                            (statusData.data && (statusData.data.transaction_id || statusData.data.transactionId || statusData.data.id));

      return new Response(
        JSON.stringify({
          status: mappedStatus,
          transactionId,
          rawStatus
        }),
        { headers: corsHeaders() }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve payment status', message: error.message }),
        { status: 500, headers: corsHeaders() }
      );
    }
  }

  return new Response('Not found', { status: 404, headers: corsHeaders() });
}

function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}
