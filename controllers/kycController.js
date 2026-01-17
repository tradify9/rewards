const KYC = require('../models/KYC');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { logUserActivity } = require('../utils/activityLogger');

// @desc    Submit KYC application
// @route   POST /api/kyc/submit
// @access  Private
const submitKYC = async (req, res) => {
  try {
    const {
      fullName,
      fatherName,
      dateOfBirth,
      gender,
      address,
      aadhaarNumber,
      panNumber
    } = req.body;

    // Check if user already has a KYC application
    const existingKYC = await KYC.findOne({ user: req.user._id });
    if (existingKYC) {
      return res.status(400).json({
        message: 'KYC application already exists',
        status: existingKYC.status
      });
    }

    // Validate Aadhaar number format
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({ message: 'Aadhaar number must be 12 digits' });
    }

    // Validate PAN number format
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid PAN number format' });
    }

    // Check if Aadhaar number is already registered
    const existingAadhaar = await KYC.findOne({
      aadhaarNumber,
      user: { $ne: req.user._id }
    });
    if (existingAadhaar) {
      return res.status(400).json({ message: 'Aadhaar number already registered' });
    }

    // Check if PAN number is already registered
    const existingPAN = await KYC.findOne({
      panNumber: panNumber.toUpperCase(),
      user: { $ne: req.user._id }
    });
    if (existingPAN) {
      return res.status(400).json({ message: 'PAN number already registered' });
    }

    // Handle file uploads
    let aadhaarDocument = {};
    let panDocument = {};
    let selfie = {};

    const fs = require('fs');
    const uploadedFiles = [];

    try {
      if (req.files) {
        // Upload Aadhaar document
        if (req.files.aadhaarDocument) {
          const aadhaarPath = req.files.aadhaarDocument[0].path;
          uploadedFiles.push(aadhaarPath);
          const aadhaarResult = await cloudinary.uploader.upload(aadhaarPath, {
            folder: 'kyc/aadhaar',
            resource_type: 'auto'
          });
          aadhaarDocument = {
            public_id: aadhaarResult.public_id,
            url: aadhaarResult.secure_url
          };
          // Delete local file
          fs.unlinkSync(aadhaarPath);
          uploadedFiles.splice(uploadedFiles.indexOf(aadhaarPath), 1);
        }

        // Upload PAN document
        if (req.files.panDocument) {
          const panPath = req.files.panDocument[0].path;
          uploadedFiles.push(panPath);
          const panResult = await cloudinary.uploader.upload(panPath, {
            folder: 'kyc/pan',
            resource_type: 'auto'
          });
          panDocument = {
            public_id: panResult.public_id,
            url: panResult.secure_url
          };
          // Delete local file
          fs.unlinkSync(panPath);
          uploadedFiles.splice(uploadedFiles.indexOf(panPath), 1);
        }

        // Upload selfie
        if (req.files.selfie) {
          const selfiePath = req.files.selfie[0].path;
          uploadedFiles.push(selfiePath);
          const selfieResult = await cloudinary.uploader.upload(selfiePath, {
            folder: 'kyc/selfie',
            resource_type: 'auto'
          });
          selfie = {
            public_id: selfieResult.public_id,
            url: selfieResult.secure_url
          };
          // Delete local file
          fs.unlinkSync(selfiePath);
          uploadedFiles.splice(uploadedFiles.indexOf(selfiePath), 1);
        }
      }
    } catch (uploadError) {
      // Clean up any uploaded files on error
      uploadedFiles.forEach(filePath => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      });
      throw uploadError;
    }

    // Create KYC application
    const kyc = await KYC.create({
      user: req.user._id,
      fullName,
      fatherName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      address,
      aadhaarNumber,
      panNumber: panNumber.toUpperCase(),
      aadhaarDocument,
      panDocument,
      selfie
    });

    // Update user's KYC status
    await User.findByIdAndUpdate(req.user._id, { kycStatus: 'pending' });

    // Log KYC submission
    await logUserActivity.kycSubmit(req.user, req);

    res.status(201).json({
      message: 'KYC application submitted successfully',
      kyc
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's KYC status
// @route   GET /api/kyc/status
// @access  Private
const getKYCStatus = async (req, res) => {
  try {
    const kyc = await KYC.findOne({ user: req.user._id });

    if (!kyc) {
      return res.json({ status: 'not_submitted' });
    }

    res.json({
      status: kyc.status,
      submittedAt: kyc.submittedAt,
      reviewedAt: kyc.reviewedAt,
      rejectionReason: kyc.rejectionReason
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's KYC details
// @route   GET /api/kyc/details
// @access  Private
const getKYCDetails = async (req, res) => {
  try {
    const kyc = await KYC.findOne({ user: req.user._id });

    if (!kyc) {
      return res.status(404).json({ message: 'KYC not found' });
    }

    res.json(kyc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all KYC applications (Admin)
// @route   GET /api/kyc/admin/all
// @access  Private/Admin
const getAllKYC = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;

    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { aadhaarNumber: { $regex: search, $options: 'i' } },
        { panNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const kycApplications = await KYC.find(query)
      .populate('user', 'name email uniqueId')
      .sort({ submittedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await KYC.countDocuments(query);

    res.json({
      kycApplications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Review KYC application (Admin)
// @route   PUT /api/kyc/admin/review/:id
// @access  Private/Admin
const reviewKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const kyc = await KYC.findById(id);
    if (!kyc) {
      return res.status(404).json({ message: 'KYC application not found' });
    }

    kyc.status = status;
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = req.user._id;

    if (status === 'rejected' && rejectionReason) {
      kyc.rejectionReason = rejectionReason;
    }

    await kyc.save();

    // Update user's KYC status
    const userStatus = status === 'approved' ? 'verified' : 'rejected';
    const user = await User.findById(kyc.user);
    await User.findByIdAndUpdate(kyc.user, { kycStatus: userStatus });

    // Log KYC review
    if (status === 'approved') {
      await logUserActivity.kycApprove(req.user, user, req);
    } else {
      await logUserActivity.kycReject(req.user, user, req, rejectionReason);
    }

    res.json({
      message: `KYC application ${status}`,
      kyc
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get KYC statistics (Admin)
// @route   GET /api/kyc/admin/stats
// @access  Private/Admin
const getKYCStats = async (req, res) => {
  try {
    const stats = await KYC.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = stats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      total,
      pending: stats.find(s => s._id === 'pending')?.count || 0,
      approved: stats.find(s => s._id === 'approved')?.count || 0,
      rejected: stats.find(s => s._id === 'rejected')?.count || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitKYC,
  getKYCStatus,
  getKYCDetails,
  getAllKYC,
  reviewKYC,
  getKYCStats
};
