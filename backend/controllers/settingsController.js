const SystemSettings = require("../models/SystemSettings");

// ============================================================
// GET SETTINGS
// ============================================================

const getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne().lean();

    if (!settings) {
      settings = await SystemSettings.create({});
      settings = settings.toObject();
    }

    return res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Get system settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load system settings",
    });
  }
};

// ============================================================
// UPDATE SETTINGS
// ADMIN ONLY
// ============================================================

const updateSettings = async (req, res) => {
  try {
    const {
      faceVerificationEnabled,
      gpsVerificationEnabled,
      networkVerificationEnabled,
      manualAttendanceEnabled,
      defaultSessionDuration,
      defaultAllowedRadius,
      lateThresholdMinutes,
      maintenanceMode,
      notificationsEnabled,
    } = req.body;

    // --------------------------------------------------------
    // Validate session duration
    // --------------------------------------------------------

    const allowedDurations = [
      5,
      10,
      15,
      30,
      45,
      60,
    ];

    if (
      defaultSessionDuration !== undefined &&
      !allowedDurations.includes(
        Number(defaultSessionDuration)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Default session duration must be 5, 10, 15, 30, 45 or 60 minutes",
      });
    }

    // --------------------------------------------------------
    // Validate radius
    // --------------------------------------------------------

    if (
      defaultAllowedRadius !== undefined
    ) {
      const radius =
        Number(defaultAllowedRadius);

      if (
        !Number.isFinite(radius) ||
        radius < 1 ||
        radius > 10000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Default allowed radius must be between 1 and 10000 metres",
        });
      }
    }

    // --------------------------------------------------------
    // Validate late threshold
    // --------------------------------------------------------

    if (
      lateThresholdMinutes !== undefined
    ) {
      const threshold =
        Number(lateThresholdMinutes);

      if (
        !Number.isFinite(threshold) ||
        threshold < 0 ||
        threshold > 120
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Late threshold must be between 0 and 120 minutes",
        });
      }
    }

    // --------------------------------------------------------
    // Build update
    // --------------------------------------------------------

    const update = {};

    if (
      faceVerificationEnabled !== undefined
    ) {
      update.faceVerificationEnabled =
        Boolean(faceVerificationEnabled);
    }

    if (
      gpsVerificationEnabled !== undefined
    ) {
      update.gpsVerificationEnabled =
        Boolean(gpsVerificationEnabled);
    }

    if (
      networkVerificationEnabled !== undefined
    ) {
      update.networkVerificationEnabled =
        Boolean(networkVerificationEnabled);
    }

    if (
      manualAttendanceEnabled !== undefined
    ) {
      update.manualAttendanceEnabled =
        Boolean(manualAttendanceEnabled);
    }

    if (
      defaultSessionDuration !== undefined
    ) {
      update.defaultSessionDuration =
        Number(defaultSessionDuration);
    }

    if (
      defaultAllowedRadius !== undefined
    ) {
      update.defaultAllowedRadius =
        Number(defaultAllowedRadius);
    }

    if (
      lateThresholdMinutes !== undefined
    ) {
      update.lateThresholdMinutes =
        Number(lateThresholdMinutes);
    }

    if (
      maintenanceMode !== undefined
    ) {
      update.maintenanceMode =
        Boolean(maintenanceMode);
    }

    if (
      notificationsEnabled !== undefined
    ) {
      update.notificationsEnabled =
        Boolean(notificationsEnabled);
    }

    update.updatedBy =
      req.user?.id || null;

    // --------------------------------------------------------
    // Save
    // --------------------------------------------------------

    const settings =
      await SystemSettings.findOneAndUpdate(
        {},
        {
          $set: update,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    return res.json({
      success: true,
      message:
        "System settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error(
      "Update system settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to update system settings",
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};