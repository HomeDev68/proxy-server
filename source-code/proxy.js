const http = require('http');
const net = require('net');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 6969;
const CACHE_DIR = path.join(__dirname, 'cache');
const BLOCKED_SITES_FILE = path.join(__dirname, 'blocked_sites.txt');

let cache = {};
let blockedSites = new Set();

function loadBlockedSites() {
  if (fs.existsSync(BLOCKED_SITES_FILE)) {
    const data = fs.readFileSync(BLOCKED_SITES_FILE, 'utf-8');
    blockedSites = new Set(data.split('\n').filter(Boolean));
  }
}

function saveBlockedSites() {
  fs.writeFileSync(BLOCKED_SITES_FILE, Array.from(blockedSites).join('\n'));
}

function cacheResponse(url, data) {
  const filePath = path.join(CACHE_DIR, encodeURIComponent(url));
  fs.writeFileSync(filePath, data);
  cache[url] = filePath;
}

function getCachedResponse(url) {
  const filePath = cache[url];
  if (filePath && fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }
  return null;
}

function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url);
  const targetUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.path}`;

  if (blockedSites.has(targetUrl)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  const cachedResponse = getCachedResponse(targetUrl);
  if (cachedResponse) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(cachedResponse);
    return;
  }

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 80,
    path: parsedUrl.path,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    proxyRes.on('end', () => {
      cacheResponse(targetUrl, data);
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      res.end(data);
    });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  });

  req.pipe(proxyReq);
}

function handleConnect(req, socket, head) {
  const parsedUrl = url.parse(`http://${req.url}`);
  const targetSocket = net.connect(parsedUrl.port, parsedUrl.hostname, () => {
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    targetSocket.write(head);
    targetSocket.pipe(socket);
    socket.pipe(targetSocket);
  });

  targetSocket.on('error', (err) => {
    socket.end();
  });
}

const server = http.createServer(handleRequest);
server.on('connect', handleConnect);

server.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
  loadBlockedSites();
});

process.stdin.on('data', (data) => {
  const input = data.toString().trim();
  if (input === 'blocked') {
    console.log('Blocked Sites:');
    blockedSites.forEach((site) => console.log(site));
  } else if (input === 'cached') {
    console.log('Cached Sites:');
    Object.keys(cache).forEach((site) => console.log(site));
  } else if (input === 'close') {
    saveBlockedSites();
    process.exit();
  } else {
    blockedSites.add(input);
    console.log(`${input} blocked successfully!`);
  }
});
