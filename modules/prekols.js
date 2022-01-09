const figlet = require('figlet');

function b3dText(text, [msg, out]) {
  out(`\`\`\`${figlet.textSync(text, { font: 'Graceful' })}\`\`\``, msg);
}

module.exports = { b3dText };
