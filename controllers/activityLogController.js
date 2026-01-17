const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// @desc    Get all activity logs with filtering and pagination
// @route   GET /api/admin/activity-logs
// @access  Private (Admin only)
const getActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};

    // Filter by user
    if (req.query.userId) {
      filter.user = req.query.userId;
    }

    // Filter by action
    if (req.query.action && req.query.action !== 'all') {
      filter.action = req.query.action;
    }

    // Filter by severity
    if (req.query.severity && req.query.severity !== 'all') {
      filter.severity = req.query.severity;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    // Filter by location
    if (req.query.country && req.query.country !== 'all') {
      filter['location.country'] = req.query.country;
    }

    if (req.query.city && req.query.city !== 'all') {
      filter['location.city'] = req.query.city;
    }

    // Search by description or user details
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { description: searchRegex },
        { 'details.serviceName': searchRegex },
        { 'details.reason': searchRegex }
      ];
    }

    // Get total count for pagination
    const totalLogs = await ActivityLog.countDocuments(filter);

    // Get logs with user population
    const logs = await ActivityLog.find(filter)
      .populate('user', 'name email uniqueId')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get unique countries and cities for filters
    const countries = await ActivityLog.distinct('location.country', { 'location.country': { $ne: null } });
    const cities = await ActivityLog.distinct('location.city', { 'location.city': { $ne: null } });

    const totalPages = Math.ceil(totalLogs / limit);

    res.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages,
        totalLogs,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        countries: countries.filter(c => c && c !== 'Unknown'),
        cities: cities.filter(c => c && c !== 'Unknown')
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};

// @desc    Get activity log statistics
// @route   GET /api/admin/activity-logs/stats
// @access  Private (Admin only)
const getActivityStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's activity count
    const todayActivity = await ActivityLog.countDocuments({
      timestamp: { $gte: today, $lt: tomorrow }
    });

    // Total activities this week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekActivity = await ActivityLog.countDocuments({
      timestamp: { $gte: weekStart }
    });

    // Most active users (top 10)
    const mostActiveUsers = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          uniqueId: '$user.uniqueId',
          activityCount: '$count',
          lastActivity: 1
        }
      },
      {
        $sort: { activityCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Activity by action type
    const activityByAction = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Activity by country
    const activityByCountry = await ActivityLog.aggregate([
      {
        $match: { 'location.country': { $ne: null, $ne: 'Unknown' } }
      },
      {
        $group: {
          _id: '$location.country',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Recent critical activities
    const recentCritical = await ActivityLog.find({
      severity: { $in: ['high', 'critical'] }
    })
      .populate('user', 'name email uniqueId')
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    res.json({
      todayActivity,
      weekActivity,
      mostActiveUsers,
      activityByAction,
      activityByCountry,
      recentCritical
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ message: 'Failed to fetch activity statistics' });
  }
};

// @desc    Get activity log by ID
// @route   GET /api/admin/activity-logs/:id
// @access  Private (Admin only)
const getActivityLogById = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id)
      .populate('user', 'name email uniqueId phone')
      .lean();

    if (!log) {
      return res.status(404).json({ message: 'Activity log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ message: 'Failed to fetch activity log' });
  }
};

// @desc    Delete old activity logs (cleanup)
// @route   DELETE /api/admin/activity-logs/cleanup
// @access  Private (Admin only)
const cleanupOldLogs = async (req, res) => {
  try {
    const daysToKeep = parseInt(req.query.days) || 90; // Default 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      message: `Deleted ${result.deletedCount} old activity logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({ message: 'Failed to cleanup old logs' });
  }
};

module.exports = {
  getActivityLogs,
  getActivityStats,
  getActivityLogById,
  cleanupOldLogs
};
