import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    resume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resume",
        required: true
    },

    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null
    },

    orderType: {
        type: String,
        enum: [
            "resume-download",
            "bulk-download"
        ],
        default: "resume-download"
    },

    originalAmount: {
        type: Number,
        required: true
    },

    discountAmount: {
        type: Number,
        default: 0
    },

    finalAmount: {
        type: Number,
        required: true
    },

    paymentMethod: {
        type: String,
        default: "razorpay"
    },

    razorpayOrderId: String,

    razorpayPaymentId: String,

    razorpaySignature: String,

    paymentStatus: {
        type: String,
        enum: [
            "pending",
            "paid",
            "failed",
            "refunded"
        ],
        default: "pending"
    },

    downloadAllowed: {
        type: Boolean,
        default: false
    },

    downloadedAt: Date

},
{
    timestamps:true
});

orderSchema.index(
  {
    user: 1,
    resume: 1,
    paymentStatus: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      paymentStatus: "paid",
    },
  }
);

export default mongoose.model("Order",orderSchema);