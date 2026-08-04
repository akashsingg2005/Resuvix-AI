import User from "../models/user.model.js";

/**
 * Create a new user
 */
export const createUser = async (userData) => {
  return await User.create(userData);
};

/**
 * Find user by email
 * Includes password & refreshToken (hidden by default)
 */
export const findUserByEmail = async (email) => {
  return await User.findOne({ email }).select("+password +refreshToken");
};

/**
 * Find user by ID
 */
export const findUserById = async (id) => {
  return await User.findById(id);
};

/**
 * Find user by ID with password
 */
export const findUserByIdWithPassword = async (id) => {
  return await User.findById(id).select("+password +refreshToken");
};

/**
 * Save refresh token
 */
export const updateRefreshToken = async (userId, refreshToken) => {
  return await User.findByIdAndUpdate(
  userId,
  { refreshToken },
  { returnDocument: "after" }
);
};

/**
 * Clear refresh token on logout
 */
export const clearRefreshToken = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    { refreshToken: null },
    { returnDocument: "after" }
  );
};

/**
 * Update last login
 */
export const updateLastLogin = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    { lastLogin: new Date() },
    { returnDocument: "after" }
  );
};


/**
 * Save Reset OTP
 */
export const saveResetOTP = async (
    userId,
    otp,
    expiry
) => {

    return User.findByIdAndUpdate(
        userId,
        {
            resetOTP: otp,
            resetOTPExpiry: expiry,
        },
        {
            new: true,
        }
    );

};

/**
 * Clear Reset OTP
 */
export const clearResetOTP = async (
    userId
) => {

    return User.findByIdAndUpdate(
        userId,
        {
            resetOTP: null,
            resetOTPExpiry: null,
        }
    );

};

/**
 * Find User by Email
 */
export const findUserByEmailWithOTP = async (email) => {

    return User.findOne({ email });

};

/**
 * Update Password
 */
export const updateUserPassword = async (
    userId,
    hashedPassword
) => {

    return User.findByIdAndUpdate(
        userId,
        {
            password: hashedPassword,
            resetOTP: null,
            resetOTPExpiry: null,
        },
        {
            new: true,
        }
    );

};