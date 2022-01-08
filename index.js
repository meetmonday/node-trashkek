require('dotenv').config();
const http = require('http');
const figlet = require('figlet');
const b = require('./bot');

console.log(figlet.textSync(`TRASHKEK\nRABOTAET...\nPort: ${process.env.SERVER_PORT}`));

http.createServer((req, res) => {
  req.on('data', (chunk) => {
    b.bot(JSON.parse(chunk.toString()).message);
  });
  req.on('end', () => {
    //  end of data
  });
  res.end();
}).listen(process.env.SERVER_PORT);
