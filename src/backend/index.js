const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const chatRoutes = require('./routes/chat');
const searchRoutes = require('./routes/search');
const connectDB = require('./config/db');

// Conectar a la base de datos
connectDB();

// Configuración de variables de entorno
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de GastroBot funcionando correctamente' });
});

// Puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 