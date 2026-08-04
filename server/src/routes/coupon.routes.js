import express from "express";

import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/coupon.controller.js";

const router = express.Router();

router.get("/", getCoupons);

router.post("/", createCoupon);

router.patch("/:id", updateCoupon);

router.delete("/:id", deleteCoupon);

router.post("/validate", validateCoupon);

export default router;