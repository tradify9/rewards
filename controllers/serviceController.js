const Service = require('../models/Service');
const User = require('../models/User');
const RewardLog = require('../models/RewardLog');
const { logUserActivity } = require('../utils/activityLogger');

// @desc    Get all active services
// @route   GET /api/services
// @access  Private
const getServices = async (req, res) => {
  try {
    const services = await Service.find({ status: 'active' });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Redeem service
// @route   POST /api/services/:id/redeem
// @access  Private
const redeemService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service || service.status !== 'active') {
      return res.status(404).json({ message: 'Service not found or inactive' });
    }

    const user = await User.findById(req.user._id);

    if (user.totalCoins < service.pointsRequired) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }

    // Deduct coins
    user.totalCoins -= service.pointsRequired;
    await user.save();

    // Log the redemption
    await RewardLog.create({
      user: user._id,
      coinsEarned: -service.pointsRequired, // Negative for redemption
      reason: 'redemption',
      tierAtTime: user.tier
    });

    // Log activity
    await logUserActivity.serviceRedeemed(user, req, service.name, service.pointsRequired);

    res.json({
      message: 'Service redeemed successfully',
      service,
      remainingCoins: user.totalCoins
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create service (Admin only)
// @route   POST /api/services
// @access  Private/Admin
const createService = async (req, res) => {
  try {
    const { name, description, pointsRequired, category } = req.body;

    const service = await Service.create({
      name,
      description,
      pointsRequired,
      category
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update service (Admin only)
// @route   PUT /api/services/:id
// @access  Private/Admin
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      service[key] = updates[key];
    });

    await service.save();
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete service (Admin only)
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await service.remove();
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getServices,
  redeemService,
  createService,
  updateService,
  deleteService
};
