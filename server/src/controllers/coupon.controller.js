import Coupon from "../models/Coupon.js";

// Get all coupons
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// Create coupon
export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// Update coupon
export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// Delete coupon
export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Validate coupon
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      active: true,
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon",
      });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Coupon expired",
      });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    if (amount < coupon.minimumPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase ₹${coupon.minimumPurchase}`,
      });
    }

    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = (amount * coupon.discountValue) / 100;

      if (
        coupon.maxDiscount > 0 &&
        discount > coupon.maxDiscount
      ) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      coupon,
      discount,
      finalAmount: amount - discount,
    });
  } catch (error) {
    next(error);
  }
};