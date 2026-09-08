const SystemSettings = require("../models/SystemSettings");

// ============================================================
// Get system settings
// Creates default settings automatically if none exist.
// ============================================================

const getSystemSettings = async () => {
  let settings = await SystemSettings.findOne();

  if (!settings) {
    settings = await SystemSettings.create({});
  }

  return settings;
};

module.exports = {
  getSystemSettings,
};