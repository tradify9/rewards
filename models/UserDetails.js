const mongoose = require('mongoose');

const userDetailsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  profilePicture: String,
  bio: String,
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserDetails', userDetailsSchema);
