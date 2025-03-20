export default async function handler(req, res) {
  // Use the correct API_BASE_URL from environment variables
  const API_URL = 'https://api-server.krontiva.africa/api:uEBBwbSs';
  
  try {
    const endpoint = req.url.replace("/api", "");
    
    // Create headers for the forwarded request
    const forwardHeaders = new Headers();
    forwardHeaders.set('Content-Type', 'application/json');

    if (endpoint.includes('/auth/login')) {
      // Handle login request
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: req.method,
        headers: forwardHeaders,
        body: JSON.stringify(req.body)
      });

      const data = await response.json();
      
      if (response.ok && data.authToken) {
        // Set HTTP-only cookie with the auth token
        res.setHeader('Set-Cookie', `auth_token=${data.authToken}; HttpOnly; Secure; SameSite=Strict; Path=/`);
        
        // Return response without exposing token
        const sanitizedData = { ...data };
        delete sanitizedData.authToken;
        return res.status(response.status).json(sanitizedData);
      }
      
      return res.status(response.status).json(data);
    } else {
      // For all other requests
      const authToken = req.headers['x-xano-authorization'] || req.cookies.auth_token;
      
      if (authToken) {
        forwardHeaders.set('X-Xano-Authorization', authToken);
        forwardHeaders.set('X-Xano-Authorization-Only', 'true');
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: req.method,
        headers: forwardHeaders,
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) 
          ? JSON.stringify(req.body) 
          : undefined,
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }
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