const express = require('express');
const httpProxy = require('http-proxy');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = 443;
const BASE_PATH = 'https://storage.googleapis.com/vercel-clone-project/__outputs/';

const proxy = httpProxy.createProxy();

// Load SSL certificate and key
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

// Create HTTPS server
const server = https.createServer(options, app);

// Proxy requests
app.use((req, res) => {
  const hostname = req.hostname;
  const subdomain = hostname.split('.')[0];
  const resolvesTo = `${BASE_PATH}/${subdomain}`;
  return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on('proxyReq', (proxyReq, req, res) => {
  const url = req.url;
  if (url === '/') {
    proxyReq.path += 'index.html';
  }
});

// Start the server
server.listen(PORT, () => {
  console.log("Reverse Proxy running on port:", PORT);
});