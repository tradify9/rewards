const UserDetails = require('../models/UserDetails');
const User = require('../models/User');

// @desc    Get all user details
// @route   GET /api/user-details
// @access  Private/Admin
const getUserDetails = async (req, res) => {
  try {
    const userDetails = await UserDetails.find({})
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(userDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user details by user ID
// @route   GET /api/user-details/:userId
// @access  Private/Admin
const getUserDetailsById = async (req, res) => {
  try {
    const userDetails = await UserDetails.findOne({ user: req.params.userId })
      .populate('user', 'name email phone');
    if (!userDetails) {
      return res.status(404).json({ message: 'User details not found' });
    }
    res.json(userDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update user details
// @route   POST /api/user-details
// @access  Private/Admin
const createOrUpdateUserDetails = async (req, res) => {
  try {
    const { userId, ...details } = req.body;

    const userDetails = await UserDetails.findOneAndUpdate(
      { user: userId },
      { ...details, user: userId },
      { new: true, upsert: true, runValidators: true }
    ).populate('user', 'name email phone');

    res.json(userDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user details
// @route   DELETE /api/user-details/:userId
// @access  Private/Admin
const deleteUserDetails = async (req, res) => {
  try {
    const userDetails = await UserDetails.findOneAndDelete({ user: req.params.userId });
    if (!userDetails) {
      return res.status(404).json({ message: 'User details not found' });
    }
    res.json({ message: 'User details deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserDetails,
  getUserDetailsById,
  createOrUpdateUserDetails,
  deleteUserDetails
};
