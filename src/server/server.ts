import express from 'express';
import session from 'express-session';
import cors from 'cors';
import passport from '@/app/middlewares/passportConfig';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true si estás en producción con HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

// Rutas de autenticación
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { 
  successRedirect: '/',
  failureRedirect: '/login'
}));

// Ruta básica de prueba
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// 🚨 RUTA PARA WHATSAPP WEBHOOK 🚨
app.post('/webhook', (req, res) => {
  console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));

  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (message) {
    console.log('📨 Nuevo mensaje:', message.text?.body || '[Otro tipo de mensaje]');
    // Aquí puedes procesar el mensaje o enviarlo a otra función
  }

  // WhatsApp exige un 200 OK
  res.sendStatus(200);
});

// 🚀 Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
