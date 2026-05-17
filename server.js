require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(cors());
app.use(express.json());

// ===== TELEGRAM BOT =====
const BOT_TOKEN = process.env.BOT_TOKEN || '8801971449:AAHRLQbwN1qHAOwfQmrGetg1OathuHDIRGA';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '5048894821';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ===== MONGODB =====
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/subhfidoiy';
mongoose.connect(MONGO_URL).then(() => console.log('✅ MongoDB ulandi')).catch(e => console.log('❌ MongoDB:', e.message));

// ===== SCHEMAS =====
const UserSchema = new mongoose.Schema({
  userId: String,
  name: String,
  phone: String,
  telegramId: String,
  registeredAt: { type: Date, default: Date.now },
  orderCount: { type: Number, default: 0 },
  totalWeight: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  lastOrderAt: Date
});

const OrderSchema = new mongoose.Schema({
  orderId: String,
  userId: String,
  name: String,
  phone: String,
  telegramId: String,
  location: { lat: Number, lng: Number },
  items: Array,
  total: Number,
  totalWeight: Number,
  status: { type: String, default: 'new' }, // new, accepted, done
  date: String,
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  icon: String,
  color: String,
  active: { type: Boolean, default: true }
});

const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);
const Product = mongoose.model('Product', ProductSchema);

// Default mahsulotlar
const DEFAULT_PRODUCTS = [
  { id: 'bakalashka', name: 'Bakalashka', price: 5000, icon: '🍾', color: 'cg', active: true },
  { id: 'stresh', name: 'Stresh Salafan', price: 7000, icon: '🛍️', color: 'cb', active: true },
  { id: 'blok', name: 'Blok Salafan', price: 7000, icon: '🛍️', color: 'co', active: true },
  { id: 'rangli', name: 'Rangli Salafan', price: 3000, icon: '🎨', color: 'cp', active: true },
  { id: 'qogoz', name: "Oq Qog'oz", price: 2000, icon: '📄', color: 'cbr', active: true },
];

async function initProducts() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(DEFAULT_PRODUCTS);
    console.log('✅ Default mahsulotlar qo\'shildi');
  }
}
initProducts();

// ===== TELEGRAM FORMAT =====
function formatOrder(order) {
  const items = (order.items || []).map(i =>
    `  ${i.icon} ${i.name}: *${i.weight} kg* → ${(i.total || i.weight * i.price).toLocaleString()} so'm`
  ).join('\n');

  const mapLink = order.location
    ? `https://maps.google.com/?q=${order.location.lat},${order.location.lng}`
    : null;

  return `
🌿 *YANGI BUYURTMA — Subh Fidoiy*
━━━━━━━━━━━━━━━━━━
👤 *Ism:* ${order.name}
📞 *Telefon:* ${order.phone}
📦 *Buyurtma ID:* \`${order.orderId}\`

📋 *Mahsulotlar:*
${items}

⚖️ *Jami vazn:* ${order.totalWeight} kg
💰 *Jami summa:* *${(order.total || 0).toLocaleString()} so'm*
📅 *Sana:* ${order.date}
━━━━━━━━━━━━━━━━━━
${mapLink ? `📍 [Xaritada ko'rish](${mapLink})` : '📍 Joylashuv yo\'q'}
`;
}

// ===== API ROUTES =====

// Mahsulotlar olish
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ active: true });
    res.json(products);
  } catch (e) {
    res.json(DEFAULT_PRODUCTS);
  }
});

// Barcha mahsulotlar (admin uchun)
app.get('/api/products/all', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (e) {
    res.json([]);
  }
});

// Mahsulot narxini yangilash
app.put('/api/products/:id', async (req, res) => {
  try {
    const { price, active, name } = req.body;
    const update = {};
    if (price !== undefined) update.price = price;
    if (active !== undefined) update.active = active;
    if (name !== undefined) update.name = name;
    await Product.findOneAndUpdate({ id: req.params.id }, update);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Yangi mahsulot qo'shish
app.post('/api/products', async (req, res) => {
  try {
    const prod = new Product(req.body);
    await prod.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mahsulot o'chirish
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Foydalanuvchi ro'yxatdan o'tish / yangilash
app.post('/api/users/register', async (req, res) => {
  try {
    const { userId, name, phone, telegramId } = req.body;
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ userId, name, phone, telegramId });
      await user.save();
    } else {
      user.name = name;
      if (telegramId) user.telegramId = telegramId;
      await user.save();
    }
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Foydalanuvchi olish
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ totalRevenue: -1 });
    res.json(users);
  } catch (e) {
    res.json([]);
  }
});

// Buyurtma yuborish
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const order = new Order(orderData);
    await order.save();

    // Foydalanuvchi statistikasini yangilash
    await User.findOneAndUpdate(
      { phone: orderData.phone },
      {
        $inc: {
          orderCount: 1,
          totalWeight: orderData.totalWeight || 0,
          totalRevenue: orderData.total || 0
        },
        $set: { lastOrderAt: new Date() }
      }
    );

    // Telegram bot orqali adminga xabar yuborish
    const msg = formatOrder(orderData);

    // Inline tugmalar
    const keyboard = {
      inline_keyboard: [[
        { text: '✅ Qabul qilindi', callback_data: `accept_${order._id}` },
        { text: '❌ Bekor qilish', callback_data: `cancel_${order._id}` }
      ]]
    };

    if (orderData.location) {
      // Avval matn xabar
      await bot.sendMessage(ADMIN_CHAT_ID, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
        disable_web_page_preview: true
      });
      // Keyin lokatsiya
      await bot.sendLocation(ADMIN_CHAT_ID,
        orderData.location.lat,
        orderData.location.lng
      );
    } else {
      await bot.sendMessage(ADMIN_CHAT_ID, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    }

    res.json({ ok: true, orderId: order.orderId });
  } catch (e) {
    console.error('Order error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Buyurtmalar olish
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) {
    res.json([]);
  }
});

// Buyurtma statusini yangilash
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Statistika
app.get('/api/stats', async (req, res) => {
  try {
    const orders = await Order.find();
    const users = await User.find();
    const products = await Product.find({ active: true });
    const total = orders.reduce((s, o) => s + (o.total || 0), 0);
    const weight = orders.reduce((s, o) => s + (o.totalWeight || 0), 0);
    res.json({
      orders: orders.length,
      users: users.length,
      products: products.length,
      revenue: total,
      weight: Math.round(weight * 10) / 10
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== TELEGRAM BOT CALLBACK =====
bot.on('callback_query', async (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  const msgId = query.message.message_id;

  if (data.startsWith('accept_')) {
    const orderId = data.replace('accept_', '');
    try {
      const order = await Order.findByIdAndUpdate(orderId, { status: 'accepted' }, { new: true });
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [[{ text: '✅ Qabul qilindi', callback_data: 'done' }]] },
        { chat_id: chatId, message_id: msgId }
      );
      await bot.answerCallbackQuery(query.id, { text: '✅ Buyurtma qabul qilindi!' });

      // Sotuvchiga xabar (agar telegramId bo'lsa)
      if (order && order.telegramId) {
        await bot.sendMessage(order.telegramId,
          `✅ *Buyurtmangiz qabul qilindi!*\n\n📦 ID: \`${order.orderId}\`\n💰 Summa: *${(order.total || 0).toLocaleString()} so'm*\n\n🚗 Kuryerimiz tez orada siz bilan bog'lanadi!`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (e) {
      await bot.answerCallbackQuery(query.id, { text: 'Xatolik!' });
    }
  }

  if (data.startsWith('cancel_')) {
    const orderId = data.replace('cancel_', '');
    try {
      const order = await Order.findByIdAndUpdate(orderId, { status: 'cancelled' }, { new: true });
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [[{ text: '❌ Bekor qilindi', callback_data: 'done' }]] },
        { chat_id: chatId, message_id: msgId }
      );
      await bot.answerCallbackQuery(query.id, { text: '❌ Bekor qilindi' });

      if (order && order.telegramId) {
        await bot.sendMessage(order.telegramId,
          `❌ *Buyurtmangiz bekor qilindi*\n\n📦 ID: \`${order.orderId}\`\n\nIltimos, qayta urinib ko'ring yoki biz bilan bog'laning.`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (e) {
      await bot.answerCallbackQuery(query.id, { text: 'Xatolik!' });
    }
  }
});

// Bot /start komandasi
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId,
    `🌿 *Subh Fidoiy botiga xush kelibsiz!*\n\nChiqindingizni pulga aylantiring! ♻️\n\nMini App orqali buyurtma bering va kuryerimiz sizga keladi.`,
    { parse_mode: 'Markdown' }
  );
});

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', app: 'Subh Fidoiy Server' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`));

// Static files
const path = require('path');
app.use('/miniapp', express.static(path.join(process.cwd(), 'public/miniapp')));
app.use('/admin', express.static(path.join(process.cwd(), 'public/admin')));
