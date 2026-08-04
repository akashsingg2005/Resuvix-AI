import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
{
    code:{
        type:String,
        required:true,
        unique:true,
        uppercase:true
    },

    discountType:{
        type:String,
        enum:["percentage","fixed"],
        default:"percentage"
    },

    discountValue:{
        type:Number,
        required:true
    },

    minimumPurchase:{
        type:Number,
        default:0
    },

    maxDiscount:{
        type:Number,
        default:0
    },

    usageLimit:{
        type:Number,
        default:100
    },

    usedCount:{
        type:Number,
        default:0
    },

    active:{
        type:Boolean,
        default:true
    },

    expiresAt:{
        type:Date
    }

},
{
    timestamps:true
});

export default mongoose.model("Coupon",couponSchema);