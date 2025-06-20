const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gastrobot';

async function clearUsers() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const result = await User.deleteMany({});
    console.log(`Usuarios eliminados: ${result.deletedCount}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error al eliminar usuarios:', err);
    process.exit(1);
  }
}

clearUsers(); 