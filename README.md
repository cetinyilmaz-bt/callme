# 📞 CallMee – Dijital Çağrı Sistemi

Modern, sesli ve görsel bildirimli iki ekranlı çağrı sistemi.

---

## 🖥️ Ekranlar

| URL | Kimler Kullanır |
|-----|----------------|
| `/` | Müdür (Çağrı gönderen) |
| `/assistant` | Asistan (Çağrı alan) |

---

## 🚀 Lokal Çalıştırma

```bash
# Bağımlılıkları kur
npm install

# Sunucuyu başlat
npm start
```

Tarayıcıda aç:
- **Müdür Ekranı**: http://localhost:3000
- **Asistan Ekranı**: http://localhost:3000/assistant

---

## ☁️ Railway ile İnternet Üzerinden Yayınlama

### 1. GitHub'a Yükle
```bash
git init
git add .
git commit -m "CallMee ilk sürüm"
git remote add origin https://github.com/KULLANICI_ADIN/callmee.git
git push -u origin main
```

### 2. Railway'de Proje Oluştur
1. [railway.app](https://railway.app) adresine git → Ücretsiz kayıt ol
2. **New Project** → **Deploy from GitHub repo** → Repoyu seç
3. Deploy otomatik başlar
4. **Settings → Domains → Generate Domain** ile URL al

### 3. Kullanım
- Müdür telefonu: `https://proje-adin.railway.app`
- Asistan PC/telefon: `https://proje-adin.railway.app/assistant`

---

## 🎵 Ses Seçenekleri (Asistan Seçer)

| # | Ad | Açıklama |
|---|----|----------|
| 🔔 | Klasik Zil | Tatlı çan sesi |
| 📳 | Dijital Bip | Elektronik bip serisi |
| 🎵 | Yumuşak Melodi | Arpej melodi |
| 🚨 | Acil Alarm | Yüksek urgency |
| 💬 | Modern Bildirim | Pop tarzı kısa ton |

---

## 📍 Konumlar

VIP · SeeColor · Akademi · Max · Kış Bahçesi · Ana Oda

---

## 🛠️ Teknolojiler

- **Node.js** + **Express** – Sunucu
- **Socket.io** – Gerçek zamanlı WebSocket iletişimi
- **Web Audio API** – Programatik ses üretimi (harici dosya yok)
- **HTML/CSS/JS** – Saf frontend, çerçeve bağımlılığı yok
