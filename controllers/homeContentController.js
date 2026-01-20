const HomeContent = require('../models/HomeContent');

// @desc    Get home content
// @route   GET /api/home-content
// @access  Public
const getHomeContent = async (req, res) => {
  try {
    let homeContent = await HomeContent.findOne();
    if (!homeContent) {
      // Create default content
      homeContent = await HomeContent.create({
        sections: [
          {
            id: 'hero',
            type: 'hero',
            title: 'Earn Coins, Get Rewards',
            subtitle: 'Welcome to Atvan Coins',
            content: [
              'Join India\'s premier rewards platform. Track your work, earn valuable coins, and redeem for exclusive benefits with Atvan Coins.'
            ],
            styles: {},
            order: 1
          },
          {
            id: 'features',
            type: 'features',
            title: 'Why Choose Atvan Coins?',
            subtitle: 'A powerful rewards system designed to help you earn, save, and grow faster.',
            content: [],
            styles: {},
            order: 2
          },
          {
            id: 'how-it-works',
            type: 'how-it-works',
            title: 'How It Works',
            subtitle: 'Get started in 4 simple steps',
            content: [],
            styles: {},
            order: 3
          },
          {
            id: 'tiers',
            type: 'tiers',
            title: 'Atvan Coins Membership Tiers',
            subtitle: 'Upgrade your tier as you earn more coins and unlock premium benefits.',
            content: [],
            styles: {},
            order: 4
          },
          {
            id: 'testimonials',
            type: 'testimonials',
            title: 'Thousands Trust Atvan Coins',
            subtitle: 'Real feedback from Atvan Coins users',
            content: [],
            styles: {},
            order: 5
          },
          {
            id: 'cta',
            type: 'cta',
            title: 'Ready to Start Earning Gold Coins?',
            subtitle: 'Sign up now and get 100 bonus coins to kickstart your journey. No hidden fees, completely free to join!',
            content: [],
            styles: {},
            order: 6
          }
        ]
      });
    }
    res.json(homeContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update home content
// @route   PUT /api/home-content
// @access  Private/Admin
const updateHomeContent = async (req, res) => {
  try {
    const { sections } = req.body;

    const homeContent = await HomeContent.findOneAndUpdate(
      {},
      { sections },
      { upsert: true, new: true, runValidators: false }
    );

    res.json(homeContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update specific section
// @route   PUT /api/home-content/section/:id
// @access  Private/Admin
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let homeContent = await HomeContent.findOne();
    if (!homeContent) {
      return res.status(404).json({ message: 'Home content not found' });
    }

    const sectionIndex = homeContent.sections.findIndex(section => section.id === id);
    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }

    Object.assign(homeContent.sections[sectionIndex], updateData);
    await homeContent.save();

    res.json(homeContent.sections[sectionIndex]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHomeContent,
  updateHomeContent,
  updateSection
};
