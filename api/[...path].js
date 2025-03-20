export default async function handler(req, res) {
  // Use the correct API_BASE_URL from environment variables
  const API_URL = 'https://api-server.krontiva.africa/api:uEBBwbSs';
  
  try {
    const endpoint = req.url.replace("/api", "");
    
    // Forward the request to the real API
    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: req.method,
      headers: headers,
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) 
        ? JSON.stringify(req.body) 
        : undefined,
    });

    const data = await response.json();
    
    // Copy response headers
    Object.entries(response.headers.raw()).forEach(([key, value]) => {
      // Don't set cookie headers
      if (!key.toLowerCase().includes('cookie')) {
        res.setHeader(key, value);
      }
    });

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