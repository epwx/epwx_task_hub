import express from "express";
import { RewardDistributionLedger } from "../models/index.js";

const router = express.Router();

// GET /api/reward-ledger - List all reward ledger entries (paginated in real use)
router.get("/", async (req, res) => {
  try {
    // In production, add pagination, filtering, and authentication
    const entries = await RewardDistributionLedger.findAll({
      order: [["date", "DESC"]],
      limit: 100, // limit for safety
    });
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
