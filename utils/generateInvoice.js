// const ejs = require("ejs");
// const path = require("path");
// const puppeteer = require("puppeteer");
// const fs = require("fs");

// const generateInvoicePDF = async (orderData) => {
//   const html = await ejs.renderFile(
//     path.join(__dirname, "../view/invoiceTemplate.ejs"),
//     { order: orderData }
//   );

//   const browser = await puppeteer.launch({ headless: "new" });
//   const page = await browser.newPage();
//   await page.setContent(html);
//   const pdfBuffer = await page.pdf({ format: "A4" });
//   await browser.close();

//   return pdfBuffer;
// };

// module.exports = generateInvoicePDF;


const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");

const generateInvoicePDF = async (orderData) => {
  const html = await ejs.renderFile(
    path.join(__dirname, "../view/invoiceTemplate.ejs"),
    { order: orderData }
  );

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  return pdfBuffer;
};

module.exports = generateInvoicePDF;
