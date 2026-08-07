import User from "../models/user.model.js";
import Resume from "../models/resume.model.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import Settings from "../models/Settings.js";

/**
 * Get Admin Dashboard Real Statistics
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ premium: true });
    const totalResumes = await Resume.countDocuments();

    const paidOrders = await Order.find({ paymentStatus: "paid" });
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + (curr.finalAmount || 0), 0);

    const coupons = await Coupon.find();
    const couponsUsed = coupons.reduce((acc, curr) => acc + (curr.usedCount || 0), 0);

    const settings = await Settings.findOne();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        premiumUsers,
        totalResumes,
        totalRevenue,
        couponsUsed,
        settings: settings || {}
      }
    });
  } catch (error) {
    next(error);
  }
};
