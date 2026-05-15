const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const htmlPath = 'file://' + path.resolve(__dirname, 'proposta.html').replace(/\\/g, '/');
  await page.goto(htmlPath, { waitUntil: 'networkidle' });

  const outputPath = path.resolve(__dirname, 'ParkCheck-Proposta-Comercial.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await browser.close();
  console.log('PDF gerado: ' + outputPath);
})();
