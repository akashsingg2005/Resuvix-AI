/**
 * ==========================================================
 * RESUVIX AI
 * Validation Library
 * ==========================================================
 */

const Validator = {

    /**
     * Required Field
     */
    required(value) {

        return value.trim().length > 0;

    },

    /**
     * Email Validation
     */
    email(email) {

        const regex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return regex.test(email.trim());

    },

    /**
     * Password Validation
     * Minimum:
     * - 8 Characters
     * - Uppercase
     * - Lowercase
     * - Number
     * - Special Character
     */
    password(password) {

        const regex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=])[A-Za-z\d@$!%*?&^#()_\-+=]{8,}$/;

        return regex.test(password);

    },

    /**
     * Full Name
     */
    fullName(name) {

        const regex =
            /^[A-Za-z ]{3,50}$/;

        return regex.test(name.trim());

    },

    /**
     * OTP
     */
    otp(otp) {

        return /^\d{6}$/.test(otp);

    },

    /**
     * Phone
     */
    phone(phone) {

        return /^[6-9]\d{9}$/.test(phone);

    },

    /**
     * URL
     */
    url(url) {

        try {

            new URL(url);

            return true;

        }

        catch {

            return false;

        }

    },

    // ==========================================
// Compatible methods for auth.js
// ==========================================

validateName(name) {
    const valid = this.fullName(name);

    return {
        valid,
        message: valid
            ? ""
            : "Please enter a valid full name (3-50 letters)."
    };
},

validateEmail(email) {
    const valid = this.email(email);

    return {
        valid,
        message: valid
            ? ""
            : "Please enter a valid email address."
    };
},

validatePassword(password) {
    const valid = this.password(password);

    return {
        valid,
        message: valid
            ? ""
            : "Password must contain at least 8 characters, uppercase, lowercase, number and special character."
    };
},

validateConfirmPassword(password, confirmPassword) {
    const valid = password === confirmPassword;

    return {
        valid,
        message: valid
            ? ""
            : "Passwords do not match."
    };
}

};