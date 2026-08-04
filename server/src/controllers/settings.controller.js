import Settings from "../models/Settings.js";

// GET SETTINGS
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE SETTINGS
export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    Object.assign(settings, req.body);

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};