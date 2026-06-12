/**
 * Cloudflare Worker proxy for SebPay API
 * 
 * This proxy handles CORS and forwards requests to SebPay API
 * Credentials are stored as environment variables in Cloudflare Workers
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      const url = new URL(request.url);
      
      // Only proxy requests to /api/sebpay path
      if (!url.pathname.startsWith('/api/sebpay')) {
        return new Response('Not found', { status: 404 });
      }

      // Get SebPay API credentials from environment variables
      const sebpayApiKey = env.SEBPAY_API_KEY;
      const sebpaySecretKey = env.SEBPAY_SECRET_KEY;

      if (!sebpayApiKey || !sebpaySecretKey) {
        return new Response(
          JSON.stringify({ error: 'SebPay credentials not configured' }),
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
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

    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(
        JSON.stringify({ error: 'Proxy error', message: error.message }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
  }
};

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
