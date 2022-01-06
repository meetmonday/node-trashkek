const b = require('./bot');


var http = require('http'); 
http.createServer(function (req, res) {
  req.on('data', chunk => {
    b.bot(JSON.parse(chunk.toString()).message)
  })
  req.on('end', () => {
    //end of data
  })
  res.end();
}).listen(9090);

console.log('trashkek rabotaet..........');