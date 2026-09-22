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
    const callEntry = {
      id: Date.now().toString(),
      location: data.location,
      locationKey: data.locationKey,
      color: data.color,
      icon: data.icon,
      callerName: data.callerName || 'Müdür',
      callerIcon: data.callerIcon || '👤',
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    callHistory.unshift(callEntry);
    if (callHistory.length > 50) callHistory.pop();

    // Tüm bağlı asistanlara yayınla (göndereni dahil et ki history güncellensin)
    io.emit('incoming_call', callEntry);
    io.emit('call_history', callHistory);

    console.log(`[${callEntry.location}] ${callEntry.callerName} çağrı oluşturdu: ${callEntry.id}`);
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
