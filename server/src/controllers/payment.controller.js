import razorpay from "../config/razorpay.js";
import env from "../config/env.js";
import crypto from "crypto";
import Order from "../models/Order.js";
import Settings from "../models/Settings.js";
import Coupon from "../models/Coupon.js";

export const getKey = async (req, res) => {
  res.status(200).json({
    success: true,
    key: env.RAZORPAY_KEY_ID,
  });
};

export const getPricing = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    const singlePrice = settings.premiumDownloadPrice || 199;
    const proPrice = settings.bulkDownloadPrice || 499;

    res.status(200).json({
      success: true,
      pricing: {
        freePrice: 0,
        singlePrice,
        proPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const { resumeId, couponCode, plan } = req.body;

    // Get settings dynamically from database
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    const singlePrice = settings.premiumDownloadPrice || 199;
    const proPrice = settings.bulkDownloadPrice || 499;

    const originalAmount = plan === "unlimited" ? proPrice : singlePrice;

    let discountAmount = 0;
    let finalAmount = originalAmount;
    let coupon = null;

    // Apply coupon if provided
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        active: true,
      });

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: "Invalid coupon code",
        });
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Coupon has expired",
        });
      }

      if (coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({
          success: false,
          message: "Coupon usage limit exceeded",
        });
      }

      if (originalAmount < coupon.minimumPurchase) {
        return res.status(400).json({
          success: false,
          message: `Minimum purchase should be ₹${coupon.minimumPurchase}`,
        });
      }

      if (coupon.discountType === "percentage") {
        discountAmount = (originalAmount * coupon.discountValue) / 100;

        if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }

      finalAmount = Math.max(originalAmount - discountAmount, 1);
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: resumeId ? `resume_${resumeId}` : `sub_${Date.now()}`,
    });

    // Save order
    const order = await Order.create({
      user: req.user._id,
      resume: resumeId || null,
      coupon: coupon?._id || null,
      originalAmount,
      discountAmount,
      finalAmount,
      paymentMethod: "razorpay",
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: "pending",
    });

    res.status(201).json({
      success: true,
      order: razorpayOrder,
      pricing: {
        originalAmount,
        discountAmount,
        finalAmount,
      },
      dbOrder: order,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const order = await Order.findOneAndUpdate(
      {
        razorpayOrderId: razorpay_order_id,
        user: req.user._id,
      },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: "paid",
        downloadAllowed: true,
      },
      {
        new: true,
      }
    );

    if (order?.coupon) {
      await Coupon.findByIdAndUpdate(order.coupon, {
        $inc: {
          usedCount: 1,
        },
      });
    }

    // Set user as Premium and update plan access in database
    const User = (await import("../models/user.model.js")).default;
    let settings = await Settings.findOne();
    const isProPlan = order.originalAmount === (settings?.bulkDownloadPrice || 499);

    const updateData = {
      premium: true,
      planType: isProPlan ? "pro" : "single",
    };

    if (isProPlan) {
      // 1 Year subscription expiry from today
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      updateData.subscriptionExpiresAt = oneYearFromNow;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      isProPlan
        ? updateData
        : {
            ...updateData,
            $inc: { paidResumesCount: 1, paidInterviewsCount: 1 },
          },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Premium access activated!",
      order,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPayments = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("resume", "title");

    const User = (await import("../models/user.model.js")).default;
    const currentUser = await User.findById(req.user._id).select(
      "planType subscriptionExpiresAt paidResumesCount paidInterviewsCount premium email fullName"
    );

    res.status(200).json({
      success: true,
      user: currentUser,
      payments: orders,
    });
  } catch (error) {
    next(error);
  }
};