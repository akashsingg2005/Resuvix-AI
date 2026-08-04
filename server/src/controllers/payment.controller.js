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

export const createOrder = async (req, res, next) => {
  try {
    const { resumeId, couponCode } = req.body;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: "Resume ID is required",
      });
    }

    // Get settings
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    const originalAmount = settings.premiumDownloadPrice;

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
        discountAmount =
          (originalAmount * coupon.discountValue) / 100;

        if (
          coupon.maxDiscount > 0 &&
          discountAmount > coupon.maxDiscount
        ) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }

      finalAmount = Math.max(originalAmount - discountAmount, 1);
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmount * 100,
      currency: "INR",
      receipt: `resume_${resumeId}`,
    });

    // Save order
    const order = await Order.create({
      user: req.user._id,
      resume: resumeId,
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
      resumeId,
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
        resume: resumeId,
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

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};