const axios = require("axios");

const sendTelegramMessage = async (order) => {
  // 🕒 Format date & time in IST
  const istDate = new Date(order.created_at).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const productDetails = order.products
    .map(
      (item) => `🛍️ *${item.name}*
🖼️ Image: ${item.image}
📦 Quantity: ${item.quantity}
💰 Price: Rs. ${item.price}`
    )
    .join("\n\n");

  const message = `🛒 *New Order Received*

🧾 *Order ID:* ${order.order_id}
📅 *Date:* ${istDate}

👤 *Customer:* ${order.address.full_name}
📞 *Phone:* ${order.address.phone_number}
📍 *Address:* ${order.address.street_address}, ${order.address.city}, ${order.address.state} - ${order.address.postal_code}

💵 *Total:* Rs. ${order.total_amount}

=======================
${productDetails}
`;

  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "Markdown",
    disable_web_page_preview: false,
  });
};

module.exports = sendTelegramMessage;
