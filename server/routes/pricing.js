const express = require('express');
const router = express.Router();
const Pricing = require('../models/Pricing');
const defaultCayThuePricing = require('../data/defaultCayThuePricing');

async function ensurePricing(key, defaultData) {
  let doc = await Pricing.findOne({ key }).lean();
  if (doc) return doc;
  const created = await Pricing.create({ key, data: defaultData });
  return created.toObject ? created.toObject() : created;
}

// Public pricing for CayThue page
router.get('/caythue', async (req, res) => {
  try {
    const doc = await ensurePricing('caythue', defaultCayThuePricing);
    res.json({ key: doc.key, data: doc.data, updatedAt: doc.updatedAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


