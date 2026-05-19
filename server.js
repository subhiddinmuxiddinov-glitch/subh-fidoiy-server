require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Static files
app.use('/miniapp', express.static(path.join(__dirname, 'public/miniapp')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.get('/', (req, res) => res.json({ status: 'ok', app: 'Subh Fidoiy' }));
// Telegram Bot - xatolikni ushlash
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
let bot;
try {
  bot = new TelegramBot(BOT_TOKEN, { polling: true });
  bot.on('polling_error', (err) => console.log('Bot xato:', err.code));
} catch(e) {
  console.log('Bot ishlamadi:', e.message);
}

// MongoDB
const MONGO_URL = process.env.MONGO_URL;
mongoose.connect(MONGO_URL)
  .then(() => console.log('✅ MongoDB ulandi'))
  .catch(e => console.log('❌ MongoDB:', e.message));

// Schemas
const OrderSchema = new mongoose.Schema({
  orderId: String, name: String, phone: String,
  location: { lat: Number, lng: Number },
  items: Array, total: Number, totalWeight: Number,
  status: { type: String, default: 'new' },
  date: String, createdAt: { type: Date, default: Date.now }
});
const UserSchema = new mongoose.Schema({
  userId: String, name: String, phone: String,
  orderCount: { type: Number, default: 0 },
  totalWeight: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  lastOrderAt: Date, registeredAt: { type: Date, default: Date.now }
});
const ProductSchema = new mongoose.Schema({
  id: String, name: String, price: Number,
  icon: String, color: String, active: { type: Boolean, default: true }
});

const Order = mongoose.model('Order', OrderSchema);
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);

const DEF_PRODUCTS = [
  { id: 'bakalashka', name: 'Bakalashka', price: 5000, icon: '🍾', color: 'cg', active: true },
  { id: 'stresh', name: 'Stresh Salafan', price: 7000, icon: '🛍️', color: 'cb', active: true },
  { id: 'blok', name: 'Blok Salafan', price: 7000, icon: '🛍️', color: 'co', active: true },
  { id: 'rangli', name: 'Rangli Salafan', price: 3000, icon: '🎨', color: 'cp', active: true },
  { id: 'qogoz', name: "Oq Qog'oz", price: 2000, icon: '📄', color: 'cbr', active: true },
];

// Init products - xatolikni ushlash
setTimeout(async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) await Product.insertMany(DEF_PRODUCTS);
    console.log('✅ Mahsulotlar tayyor');
  } catch(e) {
    console.log('Mahsulot xato:', e.message);
  }
}, 3000);

// API routes
app.get('/api/products', async (req, res) => {
  try {
    const p = await Product.find({ active: true });
    res.json(p.length ? p : DEF_PRODUCTS);
  } catch(e) { res.json(DEF_PRODUCTS); }
});

app.get('/api/products/all', async (req, res) => {
  try { res.json(await Product.find()); }
  catch(e) { res.json(DEF_PRODUCTS); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    await Product.findOneAndUpdate({ id: req.params.id }, req.body);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    await new Product(req.body).save();
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: req.params.id });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { userId, name, phone } = req.body;
    let user = await User.findOne({ phone });
    if (!user) { user = await new User({ userId, name, phone }).save(); }
    else { user.name = name; await user.save(); }
    res.json(user);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users', async (req, res) => {
  try { res.json(await User.find().sort({ totalRevenue: -1 })); }
  catch(e) { res.json([]); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = await new Order(req.body).save();
    await User.findOneAndUpdate(
      { phone: req.body.phone },
      { $inc: { orderCount: 1, totalWeight: req.body.totalWeight || 0, totalRevenue: req.body.total || 0 }, $set: { lastOrderAt: new Date() } }
    );

    // Telegram xabar
    if (bot && ADMIN_CHAT_ID) {
      const items = (req.body.items || []).map(i => `${i.icon} ${i.name}: ${i.weight}kg = ${(i.total||0).toLocaleString()} som`).join('\n');
      const msg = `🌿 YANGI BUYURTMA\n👤 ${req.body.name}\n📞 ${req.body.phone}\n\n${items}\n\n💰 Jami: ${(req.body.total||0).toLocaleString()} som\n⚖️ ${req.body.totalWeight}kg`;
      await bot.sendMessage(ADMIN_CHAT_ID, msg, {
        reply_markup: { inline_keyboard: [[
          { text: '✅ Qabul', callback_data: `a_${order._id}` },
          { text: '❌ Bekor', callback_data: `c_${order._id}` }
        ]]}
      });
      if (req.body.location) {
        await bot.sendLocation(ADMIN_CHAT_ID, req.body.location.lat, req.body.location.lng);
      }
    }
    res.json({ ok: true, orderId: order.orderId });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders', async (req, res) => {
  try { res.json(await Order.find().sort({ createdAt: -1 })); }
  catch(e) { res.json([]); }
});

app.get('/api/stats', async (req, res) => {
  try {
    const orders = await Order.find();
    const users = await User.find();
    const products = await Product.find({ active: true });
    res.json({
      orders: orders.length, users: users.length, products: products.length,
      revenue: orders.reduce((s,o) => s+(o.total||0), 0),
      weight: orders.reduce((s,o) => s+(o.totalWeight||0), 0)
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Bot callbacks
if (bot) {
  bot.on('callback_query', async (q) => {
    try {
      const [type, id] = [q.data.slice(0,1), q.data.slice(2)];
      if (type === 'a') {
        await Order.findByIdAndUpdate(id, { status: 'accepted' });
        await bot.answerCallbackQuery(q.id, { text: '✅ Qabul qilindi!' });
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: q.message.chat.id, message_id: q.message.message_id });
      }
      if (type === 'c') {
        await Order.findByIdAndUpdate(id, { status: 'cancelled' });
        await bot.answerCallbackQuery(q.id, { text: '❌ Bekor qilindi' });
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: q.message.chat.id, message_id: q.message.message_id });
      }
    } catch(e) {}
  });
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, '🌿 Subh Fidoiy botiga xush kelibsiz!\nChiqindingizni pulga aylantiring! ♻️');
  });
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`));

// Kunlik eslatma - har kuni soat 9:00
function scheduleDailyMessage(){
  var now=new Date();
  var next=new Date();
  next.setHours(9,0,0,0);
  if(now>next)next.setDate(next.getDate()+1);
  setTimeout(function(){
    sendDailyReminder();
    setInterval(sendDailyReminder,24*60*60*1000);
  },next-now);
  console.log('✅ Kunlik eslatma sozlandi');
}

function sendDailyReminder(){
  User.find().then(function(users){
    users.forEach(function(user){
      if(!user.userId||user.userId.startsWith('U'))return;
      bot.sendMessage(user.userId,
        '🌿 Subh Fidoiy\n\n♻️ Bugun chiqindingiz bormi?\n💰 Sotib yuboring!',
        {reply_markup:{inline_keyboard:[[{text:'📦 Hozir sotish →',url:'https://bit.ly/Subh-Fidoiy'}]]}}
      ).catch(function(){});
    });
  }).catch(function(){});
}

scheduleDailyMessage();

// Miniapp boti
const miniBot = new TelegramBot('8628150439:AAG8pIBXhfUJAeeHiB4zaLmudNMztKzgObo', {polling: true});
miniBot.on('polling_error', function(e){console.log('miniBot xato:', e.code)});
miniBot.onText(/\/start/, function(msg){
  miniBot.sendMessage(msg.chat.id,
    '🌿 Subh Fidoiy ga xush kelibsiz!\n\n♻️ Chiqindingizni pulga aylantiring\n\n👇 Bosing va boshlang:',
    {reply_markup:{inline_keyboard:[[{text:'📦 Sotish →',url:'https://bit.ly/subh-fidoiy'}]]}}
  );
});
