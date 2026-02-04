const mongoose = require('mongoose');
const HomeContent = require('./models/HomeContent');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedHomeContent = async () => {
  try {
    // Delete existing home content
    await HomeContent.deleteMany({});
    console.log('🗑️ Deleted existing home content');
    
    // Create new home content with default sections
    const defaultSections = [
      {
        id: 'hero',
        type: 'hero',
        title: 'Atvan Coin',
        subtitle: 'Your Wealth Platform',
        content: [
          "Join India's premier wealth platform. Track your growth, earn valuable coins, and redeem for exclusive benefits with Atvan Coins."
        ],
        images: [],
        styles: {},
        stats: [
          { title: '100% Secure', description: 'Encrypted Coin Transfers', icon: 'shield' },
          { title: 'Fast Growing', description: 'New Features Rolling Out', icon: 'trending-up' },
          { title: 'Wealth Platform', description: "India's Premier Choice", icon: 'award' }
        ],
        order: 1,
        isActive: true
      },
      {
        id: 'about',
        type: 'about',
        title: 'What is Atvan?',
        subtitle: 'Discover the revolutionary force behind India\'s EV transformation and wealth creation platform.',
        content: [
          'Atvan is a part of the CIBORI GROUP, established in 2010, with a strong presence across hospitality, tourism, health & nutrition, finance, import & export, and electric vehicle manufacturing.',
          'Atvan has introduced a total supply of 10 crore coins, out of which 70% are available for sale at an initial price of ₹10 per coin.',
          'With every sale, Atvan transfers ₹5,000–₹15,000 worth of coins, ensuring direct value distribution.'
        ],
        images: [],
        styles: {},
        order: 2,
        isActive: true
      },
      {
        id: 'features',
        type: 'features',
        title: 'Benefits of Atvan Coins?',
        subtitle: 'A powerful wealthy system designed to help you to earn, save, and grow faster.',
        content: [],
        benefits: [
          {
            title: 'Guaranteed Return Program',
            description: 'We will increase the price of our coin every year, which will provide coin holders with a guaranteed fixed return.',
            icon: 'trending-up',
            color: 'green'
          },
          {
            title: 'Instant Loan Facility',
            description: 'We will provide loan facilities to our coin holders against their coins.',
            icon: 'wallet',
            color: 'blue'
          },
          {
            title: 'Special Reward System',
            description: 'We will provide free home, car, pension, etc, to our premium coin holders.',
            icon: 'award',
            color: 'purple'
          },
          {
            title: 'Fast Withdrawals',
            description: 'Withdraw your coins as real money through bank transfer, UPI, or wallet payout — instantly.',
            icon: 'zap',
            color: 'orange'
          },
          {
            title: 'QR Coin Transfers',
            description: 'Send or receive coins instantly through QR scanning. Simple, fast, and secure.',
            icon: 'qrcode',
            color: 'cyan'
          },
          {
            title: 'Invite & Earn',
            description: 'Earn bonus coins for every friend who joins using your referral link. Unlock multi-level rewards.',
            icon: 'user-plus',
            color: 'pink'
          }
        ],
        order: 3,
        isActive: true
      },
      {
        id: 'how-it-works',
        type: 'how-it-works',
        title: 'How It Works',
        subtitle: 'Get started in 4 simple steps',
        content: [],
        steps: [
          {
            number: 1,
            title: 'Sign Up',
            description: 'Create your free account with basic details and verify your identity through KYC.'
          },
          {
            number: 2,
            title: 'Buy Coins',
            description: 'Work at time and earn coins automatically based on time period and tier.'
          },
          {
            number: 3,
            title: 'Refer & Earn',
            description: 'Earn bonus coins for every friend who joins using your referral link. Unlock multi-level rewards.'
          },
          {
            number: 4,
            title: 'Promote Yourself',
            description: 'Reach higher tiers for better rewards, exclusive perks, and premium benefits.'
          }
        ],
        order: 4,
        isActive: true
      },
      {
        id: 'tiers',
        type: 'tiers',
        title: 'Atvan Coins Membership',
        subtitle: 'Choose your tier and start building wealth with Atvan Coins.',
        content: [],
        tiers: [
          {
            name: 'Silver Tier',
            coinRange: '10-99 Coins',
            description: 'Perfect for beginners starting their Atvan Coins journey with essential benefits.',
            features: [
              'Buy 10 Atvan Coins at ₹10 each',
              'Free monthly bonus scratch card',
              'Basic rewards and support'
            ],
            price: 100,
            color: 'gray',
            icon: 'shield'
          },
          {
            name: 'Gold Tier',
            coinRange: '100-999 Coins',
            description: 'Ideal for active users seeking enhanced rewards and premium features.',
            features: [
              'Buy 100 Atvan Coins at ₹10 each',
              'Free monthly bonus scratch card',
              'Enhanced monthly bonus rewards',
              'Priority customer support'
            ],
            price: 1000,
            color: 'amber',
            icon: 'trophy'
          },
          {
            name: 'Platinum Tier',
            coinRange: '1000+ Coins',
            description: 'Ultimate tier for premium users with maximum benefits and exclusive perks.',
            features: [
              'Buy 1000 Atvan Coins at ₹10 each',
              'Free monthly bonus scratch card',
              'Enhanced monthly bonus rewards',
              'VIP access to partner deals',
              'Dedicated priority support',
              'Exclusive premium features'
            ],
            price: 10000,
            color: 'purple',
            icon: 'award'
          }
        ],
        order: 5,
        isActive: true
      },
      {
        id: 'share-price',
        type: 'share-price',
        title: 'ATVAN Share Price Chart',
        subtitle: 'Track the projected growth of Atvan share prices over the years, demonstrating our commitment to delivering exceptional value to our investors.',
        content: [],
        sharePriceData: [
          { srNo: 0, date: '1-Jan-26', price: 10 },
          { srNo: 1, date: '1-Jan-27', price: 15 },
          { srNo: 2, date: '1-Jan-28', price: 25 },
          { srNo: 3, date: '1-Jan-29', price: 40 },
          { srNo: 4, date: '1-Jan-30', price: 55 },
          { srNo: 5, date: '1-Jan-31', price: 75 },
          { srNo: 6, date: '1-Jan-32', price: 100 },
          { srNo: 7, date: '1-Jan-33', price: 200 },
          { srNo: 8, date: '1-Jan-34', price: 300 },
          { srNo: 9, date: '1-Jan-35', price: 500 },
          { srNo: 10, date: '1-Jan-36', price: 650 },
          { srNo: 11, date: '1-Jan-37', price: 800 },
          { srNo: 12, date: '1-Jan-38', price: 1000 },
          { srNo: 13, date: '1-Jan-39', price: 1150 },
          { srNo: 14, date: '1-Jan-40', price: 1300 },
          { srNo: 15, date: '1-Jan-41', price: 1500 }
        ],
        order: 6,
        isActive: true
      },
      {
        id: 'cta',
        type: 'cta',
        title: 'Ready to Start Earning with Atvan Coins?',
        subtitle: 'Sign up and buy 10 coins to kickstart your journey.',
        content: [
          'Free Registration',
          'Instant Rewards',
          'Secure Payments',
          '24/7 Support'
        ],
        images: [],
        styles: {},
        order: 7,
        isActive: true
      }
    ];
    
    const homeContent = new HomeContent({ 
      sections: defaultSections,
      lastUpdated: new Date()
    });
    
    await homeContent.save();
    console.log('✅ Home content seeded successfully!');
    console.log(`📊 Created ${defaultSections.length} sections:`);
    defaultSections.forEach(section => {
      console.log(`   - ${section.type}: ${section.title}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding home content:', error.message);
    process.exit(1);
  }
};

const main = async () => {
  try {
    await connectDB();
    await seedHomeContent();
    
    console.log('\n🎉 Home content seeding completed successfully!');
    console.log('\n📋 Home Content Sections:');
    console.log('1. Hero Section');
    console.log('2. About Section');
    console.log('3. Features/Benefits');
    console.log('4. How It Works');
    console.log('5. Membership Tiers');
    console.log('6. Share Price Chart');
    console.log('7. Call to Action');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { seedHomeContent };