const nodemailer = require("nodemailer");
const generateInvoicePDF = require("./generateInvoice");

const sendInvoiceEmail = async (order) => {
  try {
    const pdfBuffer = await generateInvoicePDF(order);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "enquiryzairi@gmail.com", // ✅ Your Gmail
        pass: process.env.GMAIL_APP_PASSWORD, // ⛔ Use App Password here
      },
    });

    await transporter.sendMail({
      from: '"Zairi Orders" <enqiryzairi@gmail.com>',
      to: "enquiryzairi@gmail.com", // ✅ You as owner
      subject: `🧾 New Order - #${order.order_id}`,
      text: `New order received for Rs. ${order.total_amount}.`,
      html: `<p><strong>New Order Placed:</strong><br>
             Customer: ${order.address.full_name}<br>
             Phone: ${order.address.phone_number}<br>
             Amount: Rs. ${order.total_amount}<br>
             <br>Attached invoice below.
             </p>`,
      attachments: [
        {
          filename: `invoice_${order.order_id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log("📧 Invoice email sent successfully!");
  } catch (error) {
    console.error("❌ Failed to send invoice email:", error);
  }
};

module.exports = sendInvoiceEmail;
