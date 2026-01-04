import express from 'express';
import { User, TaskSubmission, Campaign } from '../models/index.js';
import { authenticateToken } from './auth.js';
const router = express.Router();

/**
 * GET /api/users/stats
 * Get user statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const totalSubmissions = await TaskSubmission.count({
      where: { userId: user.id }
    });
    
    const approvedSubmissions = await TaskSubmission.count({
      where: { userId: user.id, status: 'approved' }
    });
    
    const pendingSubmissions = await TaskSubmission.count({
      where: { userId: user.id, status: 'pending' }
    });
    
    res.json({
      success: true,
      data: {
        totalEarned: user.totalEarned,
        tasksCompleted: user.tasksCompleted,
        totalSubmissions,
        approvedSubmissions,
        pendingSubmissions,
        reputationScore: user.reputationScore
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

/**
 * GET /api/users/leaderboard
 * Get top earners
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const users = await User.findAll({
      attributes: ['walletAddress', 'totalEarned', 'tasksCompleted', 'reputationScore'],
      order: [['totalEarned', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
