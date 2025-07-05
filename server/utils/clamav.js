const clamd = require('clamdjs');
const fs = require('fs');

const clamavScanner = clamd.createScanner('127.0.0.1', 3310);

exports.scanFile = async (filePath) => {
  const fileStream = fs.createReadStream(filePath);
  const scanResult = await clamavScanner.scanStream(fileStream);
  const resultStr = (scanResult || '').toString().toUpperCase();
  const foundRegex = /^.*FOUND\s*$/m;
  const infected = foundRegex.test(resultStr) || resultStr.includes('EICAR') || resultStr.includes('VIRUS');
  return { infected, raw: scanResult };
};
