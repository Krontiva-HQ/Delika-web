export default async function handler(req, res) {
  // Use the correct API_BASE_URL from environment variables
  const API_URL = 'https://api-server.krontiva.africa/api:uEBBwbSs';
  
  try {
    const endpoint = req.url.replace("/api", "");
    
    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.set('Content-Type', 'application/json');

    console.log('Proxying request to:', `${API_URL}${endpoint}`); // Debug log

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
    console.error('Proxy Error:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
} 