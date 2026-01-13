const mongoose = require('mongoose');
const User = require('./models/User');
const Service = require('./models/Service');
const UserDetails = require('./models/UserDetails');
const Settings = require('./models/Settings');
const Transaction = require('./models/Transaction');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@rewardsystem.com' });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = new User({
      name: 'System Admin',
      email: 'admin@rewardsystem.com',
      phone: '9999999999',
      password: 'admin123', // This will be hashed by the pre-save middleware
      isAdmin: true,
      totalCoins: 10000,
      tier: 'Platinum'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@rewardsystem.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating admin:', error.message);
  }
};

const seedServices = async () => {
  try {
    const services = [
      {
        name: 'Premium Subscription',
        description: 'Get access to premium features for 30 days',
        pointsRequired: 500,
        status: 'active'
      },
      {
        name: 'Gift Card - ₹100',
        description: 'Redeem for ₹100 gift card',
        pointsRequired: 1000,
        status: 'active'
      },
      {
        name: 'Exclusive Webinar Access',
        description: 'Access to exclusive webinar sessions',
        pointsRequired: 750,
        status: 'active'
      },
      {
        name: 'Priority Support',
        description: 'Get priority customer support for 1 month',
        pointsRequired: 300,
        status: 'active'
      }
    ];

    for (const serviceData of services) {
      const existingService = await Service.findOne({ name: serviceData.name });
      if (!existingService) {
        const service = new Service(serviceData);
        await service.save();
        console.log(`Service "${serviceData.name}" created`);
      } else {
        console.log(`Service "${serviceData.name}" already exists`);
      }
    }

  } catch (error) {
    console.error('Error creating services:', error.message);
  }
};

const seedUserDetails = async () => {
  try {
    const admin = await User.findOne({ email: 'admin@rewardsystem.com' });
    if (!admin) {
      console.log('Admin not found, skipping user details seeding');
      return;
    }

    const existingDetails = await UserDetails.findOne({ user: admin._id });
    if (existingDetails) {
      console.log('User details already exist');
      return;
    }

    const userDetails = new UserDetails({
      user: admin._id,
      address: {
        street: '123 Admin Street',
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '110001',
        country: 'India'
      },
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Male',
      bio: 'System Administrator',
      socialLinks: {
        facebook: 'https://facebook.com/admin',
        twitter: 'https://twitter.com/admin',
        instagram: 'https://instagram.com/admin'
      }
    });

    await userDetails.save();
    console.log('User details created for admin');

  } catch (error) {
    console.error('Error creating user details:', error.message);
  }
};

const seedSettings = async () => {
  try {
    const settings = [
      {
        key: 'site_name',
        value: 'Atvanev Rewards',
        description: 'Name of the rewards system',
        category: 'general'
      },
      {
        key: 'max_withdrawal',
        value: '5000',
        description: 'Maximum withdrawal amount per day',
        category: 'payments'
      },
      {
        key: 'min_withdrawal',
        value: '100',
        description: 'Minimum withdrawal amount',
        category: 'payments'
      },
      {
        key: 'reward_rate',
        value: '10',
        description: 'Reward points per rupee spent',
        category: 'rewards'
      }
    ];

    for (const settingData of settings) {
      const existingSetting = await Settings.findOne({ key: settingData.key });
      if (!existingSetting) {
        const setting = new Settings(settingData);
        await setting.save();
        console.log(`Setting "${settingData.key}" created`);
      } else {
        console.log(`Setting "${settingData.key}" already exists`);
      }
    }

  } catch (error) {
    console.error('Error creating settings:', error.message);
  }
};

const seedTransactions = async () => {
  try {
    const existingTransactions = await Transaction.find({});
    if (existingTransactions.length > 0) {
      console.log('Transactions already exist');
      return;
    }

    // Create some sample transactions
    const transactions = [
      {
        withdrawal: null, // Will need to create withdrawals first, but for now null
        amount: 500,
        status: 'SUCCESS',
        payoutId: 'payout_123456'
      },
      {
        withdrawal: null,
        amount: 1000,
        status: 'SUCCESS',
        payoutId: 'payout_123457'
      }
    ];

    for (const transactionData of transactions) {
      const transaction = new Transaction(transactionData);
      await transaction.save();
      console.log('Sample transaction created');
    }

  } catch (error) {
    console.error('Error creating transactions:', error.message);
  }
};

const seedData = async () => {
  await connectDB();
  await seedAdmin();
  await seedServices();
  await seedUserDetails();
  await seedSettings();
  // await seedTransactions(); // Commented out due to required fields
  console.log('Seeding completed!');
  process.exit(0);
};

seedData();
