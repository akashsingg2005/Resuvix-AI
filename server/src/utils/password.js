import bcrypt from "bcrypt";

/**
 * Hash a plain text password
 * @param {string} password
 * @returns {Promise<string>}
 */
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare plain password with hashed password
 * @param {string} password
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};