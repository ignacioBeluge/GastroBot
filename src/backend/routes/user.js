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

module.exports = router; 