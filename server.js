const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Sağlık kontrolü (Render / Cloud için)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Çağrı geçmişi (son 50)
let callHistory = [];

// Profil ve Oda Tanımları (Yealink & API için)
const PROFILES = {
  'mehmet': { name: 'Mehmet Bey', icon: '👔' },
  'esra':   { name: 'Esra Hanım', icon: '👩‍💼' },
  'ebru':   { name: 'Ebru Hanım', icon: '👩‍💼' },
  'murat':  { name: 'Murat Ceylan', icon: '👔' }
};

const LOCATIONS = {
  'vip':         { name: 'VIP', icon: '👑', color: '#f59e0b' },
  'seecolor':    { name: 'SeeColor', icon: '🎨', color: '#a855f7' },
  'akademi':     { name: 'Akademi', icon: '🎓', color: '#3b82f6' },
  'max':         { name: 'Max', icon: '⚡', color: '#f97316' },
  'kis-bahcesi': { name: 'Kış Bahçesi', icon: '🌿', color: '#22c55e' },
  'ana-oda':     { name: 'Ana Oda', icon: '🏛️', color: '#ef4444' }
};

// Ortak çağrı oluşturma fonksiyonu
function processCall(data) {
  const callEntry = {
    id: Date.now().toString(),
    location: data.location || 'Yönetici Odası',
    locationKey: data.locationKey || 'custom',
    color: data.color || '#f59e0b',
    icon: data.icon || '📍',
    callerName: data.callerName || 'Müdür',
    callerIcon: data.callerIcon || '👤',
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  callHistory.unshift(callEntry);
  if (callHistory.length > 50) callHistory.pop();

  io.emit('incoming_call', callEntry);
  io.emit('call_history', callHistory);

  console.log(`[${callEntry.location}] ${callEntry.callerName} çağrı oluşturdu: ${callEntry.id}`);
  return callEntry;
}

// Ana sayfa → Müdür ekranı
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Asistan ekranı
app.get('/assistant', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assistant.html'));
});

// Çağrı geçmişi API
app.get('/api/history', (req, res) => {
  res.json(callHistory);
});

// Yealink IP Telefon ve Fiziksel Buton API Endpoint'i (GET & POST destekli)
app.all(['/api/call', '/api/yealink'], (req, res) => {
  const params = { ...req.query, ...(req.body || {}) };
  const kisiKey = (params.kisi || params.caller || params.user || '').toLowerCase();
  const odaKey = (params.oda || params.location || params.room || '').toLowerCase();

  const profile = PROFILES[kisiKey] || {
    name: params.callerName || params.kisi || 'Yönetici',
    icon: params.callerIcon || '👔'
  };

  const loc = LOCATIONS[odaKey] || {
    name: params.locationName || params.oda || 'Yönetici Odası',
    icon: params.icon || '👑',
    color: params.color || '#f59e0b'
  };

  const call = processCall({
    location: loc.name,
    locationKey: odaKey || 'custom',
    color: loc.color,
    icon: loc.icon,
    callerName: profile.name,
    callerIcon: profile.icon
  });

  const isYealink = req.path === '/api/yealink' ||
                    params.format === 'xml' ||
                    (req.headers['user-agent'] || '').toLowerCase().includes('yealink');

  if (isYealink) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<YealinkIPPhoneTextScreen Beep="yes" Timeout="3">
  <Title>CallMee</Title>
  <Text>Cagri Iletildi!
${call.callerName} -> ${call.location}</Text>
</YealinkIPPhoneTextScreen>`;
    res.set('Content-Type', 'text/xml; charset=utf-8');
    return res.send(xml);
  }

  res.json({ ok: true, message: 'Çağrı asistana iletildi', call });
});

// Çağrıyı sıfırla (asistan onayladığında)
app.post('/api/acknowledge', (req, res) => {
  const { callId } = req.body;
  const call = callHistory.find(c => c.id === callId);
  if (call) call.status = 'acknowledged';
  io.emit('call_acknowledged', { callId });
  io.emit('call_history', callHistory);
  res.json({ ok: true });
});

// Socket.io bağlantıları
io.on('connection', (socket) => {
  console.log('Bağlantı:', socket.id);

  // Geçmişi yeni bağlanana gönder
  socket.emit('call_history', callHistory);

  // Müdür çağrı gönderdiğinde
  socket.on('send_call', (data) => {
    processCall(data);
  });

  // Asistan görüldü dediğinde
  socket.on('acknowledge_call', (data) => {
    const call = callHistory.find(c => c.id === data.callId);
    if (call) call.status = 'acknowledged';
    io.emit('call_acknowledged', { callId: data.callId });
    io.emit('call_history', callHistory);
  });

  socket.on('disconnect', () => {
    console.log('Ayrıldı:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  ✅ CallMee Sunucusu Aktif! (Port: ${PORT})`);
  console.log(`====================================================\n`);
  console.log(`💻 Bu bilgisayardan erişim:`);
  console.log(`   - Müdür:   http://localhost:${PORT}`);
  console.log(`   - Asistan: http://localhost:${PORT}/assistant\n`);
  console.log(`📱 Aynı Wi-Fi'daki telefonlardan erişim:`);
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`   - [${name}] Müdür:   http://${net.address}:${PORT}`);
        console.log(`   - [${name}] Asistan: http://${net.address}:${PORT}/assistant`);
      }
    }
  }
  console.log(`\n====================================================`);
});
