const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../services/emailService');

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Crear nuevo usuario
    const user = new User({
      name,
      email,
      password,
      verificationToken,
      verificationTokenExpires
    });

    try {
      await user.save();
      await sendVerificationEmail(email, verificationToken);
      res.status(201).json({ message: 'Usuario registrado. Por favor, verifica tu email.' });
    } catch (emailError) {
      // Si el usuario ya fue guardado pero el email falla, informar el error real
      res.status(500).json({ message: emailError.message || 'Error al enviar el email de verificación' });
    }
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Verificación de email
router.get('/verify-email/:token?', async (req, res) => {
  try {
    // Permitir token por ruta o por query string
    const token = req.params.token || req.query.token;

    if (!token) {
      // Redirect to frontend with error
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?error=no-token`);
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      // Redirect to frontend with error
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?error=invalid-token`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Redirect to frontend with success
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`);
  } catch (error) {
    console.error('Error en verificación:', error);
    // Redirect to frontend with error
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?error=server-error`);
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar si el email está verificado
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Por favor, verifica tu email antes de iniciar sesión' });
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { user: { _id: user._id } },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        dietaryPreferences: user.dietaryPreferences,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Actualizar nombre y bio del usuario
router.put('/user/:id', async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, bio },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// Validate token endpoint
router.get('/validate', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ valid: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user._id).select('-password');
    
    if (!user) {
      return res.status(401).json({ valid: false, message: 'User not found' });
    }

    res.json({ 
      valid: true, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        dietaryPreferences: user.dietaryPreferences,
        plan: user.plan
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

module.exports = router; 