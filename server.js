const express = require('express');
const axios = require('axios');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const API_URL = process.env.API_URL; // Correctly read API_URL from .env

app.use('/api', async (req, res) => {
  const fullUrl = `${API_URL}${req.originalUrl.replace('/api', '')}`;
  console.log(`🔁 Forwarding request to: ${fullUrl}`);

  try {
    const response = await axios({
      method: req.method,
      url: fullUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ Response received from API:`, response.data);
    res.json(response.data);

  } catch (error) {
    console.error(`❌ API Error:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Request failed',
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
