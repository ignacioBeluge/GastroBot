const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const authMiddleware = require('../middleware/auth'); 
const multer = require('multer');
const path = require('path');

// @route   GET /api/user/preferences
// @desc    Get user's dietary preferences
// @access  Private
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('dietaryPreferences');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user.dietaryPreferences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/user/preferences
// @desc    Update user's dietary preferences
// @access  Private
router.put('/preferences', authMiddleware, async (req, res) => {
  const { preferences } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.dietaryPreferences = preferences || [];
    await user.save();

    res.json(user.dietaryPreferences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get user's plan
router.get('/plan', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('plan');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ plan: user.plan });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get user's payment methods
router.get('/payment-methods', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('paymentMethods');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user.paymentMethods || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new payment method (mocked)
router.post('/payment-methods', authMiddleware, async (req, res) => {
  const { cardType, last4, expMonth, expYear, name } = req.body;
  if (!cardType || !last4 || !expMonth || !expYear || !name) {
    return res.status(400).json({ msg: 'Missing payment method fields' });
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.paymentMethods = user.paymentMethods || [];
    user.paymentMethods.push({ cardType, last4, expMonth, expYear, name });
    await user.save();
    res.json(user.paymentMethods);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// (Optional) Change plan
router.put('/plan', authMiddleware, async (req, res) => {
  const { plan } = req.body;
  if (!['free', 'pro'].includes(plan)) {
    return res.status(400).json({ msg: 'Invalid plan' });
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.plan = plan;
    await user.save();
    res.json({ plan: user.plan });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Set a payment method as current
router.put('/payment-methods/current', authMiddleware, async (req, res) => {
  const { last4, expMonth, expYear, cardType, name } = req.body;
  if (!last4 || !expMonth || !expYear || !cardType || !name) {
    return res.status(400).json({ msg: 'Missing payment method fields to identify the card' });
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.paymentMethods = (user.paymentMethods || []).map(pm => {
      if (
        pm.last4 === last4 &&
        pm.expMonth === expMonth &&
        pm.expYear === expYear &&
        pm.cardType === cardType &&
        pm.name === name
      ) {
        return { ...pm.toObject(), current: true };
      } else {
        return { ...pm.toObject(), current: false };
      }
    });
    await user.save();
    res.json(user.paymentMethods);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a payment method
router.delete('/payment-methods', authMiddleware, async (req, res) => {
  const { cardType, last4, expMonth, expYear, name } = req.body;
  if (!cardType || !last4 || !expMonth || !expYear || !name) {
    return res.status(400).json({ msg: 'Missing payment method fields to identify the card' });
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    let wasCurrent = false;
    user.paymentMethods = (user.paymentMethods || []).filter(pm => {
      const match = pm.cardType === cardType && pm.last4 === last4 && pm.expMonth === expMonth && pm.expYear === expYear && pm.name === name;
      if (match && pm.current) wasCurrent = true;
      return !match;
    });
    // If current was deleted, set first as current
    if (wasCurrent && user.paymentMethods.length > 0) {
      user.paymentMethods[0].current = true;
    }
    await user.save();
    res.json(user.paymentMethods);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Multer memory storage config for buffer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Upload or update profile picture (store in MongoDB as Buffer)
router.post('/profile-picture', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No profile picture file uploaded' });
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.profilePicture = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Serve profile picture as image
router.get('/profile-picture', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.profilePicture || !user.profilePicture.data) {
      return res.status(404).json({ msg: 'No profile picture found' });
    }
    res.set('Content-Type', user.profilePicture.contentType);
    res.send(user.profilePicture.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete profile picture
router.delete('/profile-picture', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.profilePicture = undefined;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 