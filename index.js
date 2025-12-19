const http = require('http');
const webhook = require('./api/webhook');

const server = http.createServer(async (req, res) => {
  console.log('=== REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        console.log('Body:', body);
        req.body = JSON.parse(body);
        await webhook(req, res);
      } catch (e) {
        console.log('Error:', e.message);
        res.writeHead(500);
        res.end('Error');
      }
    });
  } else {
    res.writeHead(200);
    res.end('Ether Bot OK');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
