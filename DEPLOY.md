# 🚀 Subh Fidoiy — Deploy qilish yo'riqnomasi

## Jami vaqt: ~20 daqiqa | Narxi: $0

---

## 1-QADAM: MongoDB Atlas (Database) — 5 daqiqa

1. https://mongodb.com/atlas ga kiring
2. **"Try Free"** tugmasini bosing
3. Google yoki email bilan ro'yxatdan o'ting
4. **"Free"** plan tanlang (M0 — bepul)
5. Region: **AWS / Singapore** tanlang
6. **Create Cluster** bosing (2-3 daqiqa kutadi)

### Foydalanuvchi yaratish:
7. **Database Access** → **Add New Database User**
8. Username: `subhfidoiy`
9. Password: o'zingiz o'ylab toping (eslab qoling!)
10. **Add User** bosing

### IP ruxsati:
11. **Network Access** → **Add IP Address**
12. **Allow Access from Anywhere** tanlang → **Confirm**

### Connection string olish:
13. **Clusters** → **Connect** → **Drivers**
14. Connection string ko'rinadi:
```
mongodb+srv://subhfidoiy:PASSWORD@cluster0.xxxxx.mongodb.net/subhfidoiy
```
15. `PASSWORD` o'rniga o'z parolingizni yozing
16. Bu stringni saqlang — kerak bo'ladi!

---

## 2-QADAM: GitHub — 5 daqiqa

1. https://github.com ga kiring (account yo'q bo'lsa ro'yxatdan o'ting)
2. **New repository** → nom: `subh-fidoiy-server`
3. **Public** tanlang → **Create repository**
4. Server fayllarini yuklang:
   - `server.js`
   - `package.json`
   - `railway.json`
   - `.gitignore` (`.env` yozing ichiga)

---

## 3-QADAM: Railway Deploy — 5 daqiqa

1. https://railway.app ga kiring
2. **"Start a New Project"** bosing
3. **"Deploy from GitHub repo"** tanlang
4. GitHub account ulang → `subh-fidoiy-server` tanlang
5. **Deploy** bosing

### Environment Variables qo'shish:
6. Railway dashboard → **Variables** tab
7. Quyidagilarni qo'shing:

```
BOT_TOKEN = 8801971449:AAHRLQbwN1qHAOwfQmrGetg1OathuHDIRGA
ADMIN_CHAT_ID = 5048894821
MONGO_URL = mongodb+srv://subhfidoiy:PAROL@cluster0.xxxxx.mongodb.net/subhfidoiy
PORT = 3000
```

8. **Save** → **Redeploy** bosing

### Server URL olish:
9. **Settings** → **Domains** → **Generate Domain**
10. URL ko'rinadi: `https://subh-fidoiy-server-xxxx.railway.app`
11. Bu URL ni saqlang!

---

## 4-QADAM: Mini App va Admin Panelni ulash — 5 daqiqa

Mini App va Admin panel fayllarida `SERVER_URL` ni o'zgartiring:

```javascript
// Eski:
const SERVER_URL = '';  // bo'sh edi

// Yangi:
const SERVER_URL = 'https://subh-fidoiy-server-xxxx.railway.app';
```

---

## 5-QADAM: Telegram Mini App sozlash

1. @BotFather ga boring
2. `/mybots` → botingizni tanlang
3. **Bot Settings** → **Menu Button** → **Configure menu button**
4. URL: Mini App URL ingizni kiriting
5. Text: `📦 Buyurtma berish`

---

## ✅ Tayyor! Qanday ishlaydi:

```
Sotuvchi Mini App ochadi
        ↓
Mahsulot va vazn kiritadi
        ↓
Lokatsiya yuboradi
        ↓
Server saqlaydi (MongoDB)
        ↓
Sizga Telegram xabar keladi:
  👤 Ism, 📞 Telefon
  📦 Mahsulotlar ro'yxati
  💰 Jami summa
  📍 Lokatsiya xaritasi
        ↓
Siz "✅ Qabul qilindi" bosasiz
        ↓
Sotuvchiga ham xabar ketadi
```

---

## 📱 1000+ odam uchun yetadimi?

- MongoDB Atlas Free: 512MB = ~500,000 ta buyurtma ✅
- Railway Free: 500 soat/oy = 24/7 ishlaydi ✅
- Telegram Bot: cheksiz ✅

**Jami narx: $0/oy** (bepul!)

Kelajakda ko'paysa: Railway $5/oy = 1,000,000+ foydalanuvchi

---

## ❓ Yordam kerak bo'lsa

Har bir qadamda yordam so'rang!
