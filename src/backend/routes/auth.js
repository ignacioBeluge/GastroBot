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
      return res.status(400).send(`<!DOCTYPE html><html><head><title>Verificación fallida</title></head><body><h2 style='color:red;'>Token de verificación no encontrado</h2></body></html>`);
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send(`<!DOCTYPE html><html><head><title>Verificación fallida</title></head><body><h2 style='color:red;'>Token inválido o expirado</h2></body></html>`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.send(`<!DOCTYPE html>
<html lang='es'>
<head>
  <meta charset='UTF-8'>
  <title>Cuenta verificada</title>
  <style>
    body { background: #f5f5f5; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .confetti { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 9999; }
    .verif-card { background: #fff; border-radius: 18px; box-shadow: 0 0 32px rgba(0,0,0,0.10); padding: 48px 32px; text-align: center; max-width: 400px; margin: auto; }
    .verif-title { color: #ff7a00; font-size: 2.2rem; font-weight: bold; margin-bottom: 12px; }
    .verif-msg { color: #333; font-size: 1.15rem; margin-bottom: 18px; }
    .verif-btn { background: #ff7a00; color: #fff; border: none; border-radius: 6px; padding: 12px 32px; font-size: 1.1rem; font-weight: 600; cursor: pointer; margin-top: 18px; transition: background 0.2s; }
    .verif-btn:hover { background: #e66d00; }
  </style>
</head>
<body>
  <canvas class='confetti'></canvas>
  <div class='verif-card'>
    <div class='verif-title'>¡Cuenta verificada exitosamente! 🎉</div>
    <div class='verif-msg'>Ya puedes iniciar sesión en la aplicación.<br>¡Bienvenido a GastroBot!</div>
    <a href='http://localhost:3000/login' class='verif-btn'>Ir a iniciar sesión</a>
  </div>
  <script>
    // Confetti effect
    const canvas = document.querySelector('.confetti');
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    let particles = [];
    for(let i=0;i<180;i++){
      particles.push({
        x: Math.random()*W,
        y: Math.random()*-H,
        r: Math.random()*8+4,
        d: Math.random()*180,
        color: hsl(${Math.random()*360},90%,60%),
        tilt: Math.random()*10-5
      });
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      for(let i=0;i<particles.length;i++){
        let p=particles[i];
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2,false);
        ctx.fillStyle=p.color;
        ctx.fill();
      }
      update();
      requestAnimationFrame(draw);
    }
    function update(){
      for(let i=0;i<particles.length;i++){
        let p=particles[i];
        p.y+=2+Math.sin(p.d)*1.5;
        p.x+=Math.sin(p.d)*2;
        p.d+=0.02;
        if(p.y>H){
          p.y=Math.random()*-20;
          p.x=Math.random()*W;
        }
      }
    }
    draw();
    window.addEventListener('resize',()=>{
      W=window.innerWidth; H=window.innerHeight;
      canvas.width=W; canvas.height=H;
    });
  </script>
</body>
</html>`);
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).send(`<!DOCTYPE html><html><head><title>Error</title></head><body><h2 style='color:red;'>Error en el servidor</h2></body></html>`);
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
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
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

module.exports = router; 