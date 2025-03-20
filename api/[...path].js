export default async function handler(req, res) {
  // Use the correct API_BASE_URL from environment variables
  const API_URL = 'https://api-server.krontiva.africa/api:uEBBwbSs';
  
  try {
    const endpoint = req.url.replace("/api", "");
    
    // Create headers for the forwarded request
    const forwardHeaders = new Headers();
    forwardHeaders.set('Content-Type', 'application/json');

    // Forward authorization header for login
    if (endpoint === '/auth/login' && req.headers.authorization) {
      forwardHeaders.set('Authorization', req.headers.authorization);
    }

    // Forward X-Xano headers if present
    if (req.headers['x-xano-authorization']) {
      forwardHeaders.set('X-Xano-Authorization', req.headers['x-xano-authorization']);
      forwardHeaders.set('X-Xano-Authorization-Only', 'true');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: req.method,
      headers: forwardHeaders,
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) 
        ? JSON.stringify(req.body) 
        : undefined,
    });

    // Get response data
    const data = await response.json();

    // Set basic response headers
    res.setHeader('Content-Type', 'application/json');
    
    // Forward specific headers we want to keep
    const headersToForward = [
      'access-control-allow-credentials',
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-max-age'
    ];

    // Safely forward headers
    for (const [key, value] of response.headers) {
      if (headersToForward.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// Helper function to get user token (implement this)
async function getUserToken(userId) {
  // Implement secure token retrieval
  // This could be from a database, Redis, or other secure storage
  return process.env[`USER_TOKEN_${userId}`];
}

// Helper function to store user token (implement this)
async function storeUserToken(userId, token) {
  // Implement secure token storage
  // This could be in a database, Redis, or other secure storage
  process.env[`USER_TOKEN_${userId}`] = token;
} 