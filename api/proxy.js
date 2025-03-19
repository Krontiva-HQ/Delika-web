export default async function handler(req, res) {
  try {
    const API_URL = process.env.API_BASE_URL; // This will be set in Vercel environment variables
    
    // Clone the headers and remove host to avoid conflicts
    const headers = new Headers(req.headers);
    headers.delete('host');

    const response = await fetch(`${API_URL}${req.url}`, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' ? req.body : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
} 