import express from 'express';
import session from 'express-session';
import cors from 'cors';
import passport from './middlewares/passportConfig'; // Importa la configuración de passport
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use(session({
  secret: 'supersecretkey', // Cambia esto por algo seguro
  resave: false,
  saveUninitialized: false, // Cambiar esto a false
  cookie: { secure: false } // Asegúrate de que sea false para desarrollo en localhost
}));


app.use(passport.initialize());
app.use(passport.session());

// Rutas de autenticación
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { 
  successRedirect: '/',
  failureRedirect: '/login'
}));

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
