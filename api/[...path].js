export default async function handler(req, res) {
  // Real API URL is only accessible server-side
  const API_URL = process.env.API_BASE_URL;
  
  try {
    // Get the actual endpoint from the request path
    const endpoint = req.url.replace("/api", "");
    
    // Clone and clean headers
    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.set('Content-Type', 'application/json');

    // The actual API call happens here, hidden from client
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: req.method,
      headers: headers,
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) 
        ? JSON.stringify(req.body) 
        : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
} 