function main(string) {
  return string.replaceAll('<br/>   ', '\n').replaceAll(/<i>|<\/i>/g, '_').replaceAll(/<b>|<\/b>/g, '*');
}

export default main;
