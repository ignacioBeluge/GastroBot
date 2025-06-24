const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const authMiddleware = require('../middleware/auth'); 

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

module.exports = router; 