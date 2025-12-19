const http = require('http');
const webhook = require('./api/webhook');

const server = http.createServer(async (req, res) => {
  // res.json 함수 추가
  res.json = (data) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        req.body = JSON.parse(body);
        await webhook(req, res);
      } catch (e) {
        console.error(e);
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
