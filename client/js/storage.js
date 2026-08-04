/**
 * ==========================================
 * RESUVIX AI
 * Storage Manager
 * ==========================================
 */

const Storage = {

    /**
     * Save any value
     */
    set(key, value) {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    },

    /**
     * Get any value
     */
    get(key) {

        const value = localStorage.getItem(key);

        return value ? JSON.parse(value) : null;

    },

    /**
     * Remove one key
     */
    remove(key) {

        localStorage.removeItem(key);

    },

    /**
     * Clear storage
     */
    clear() {

        localStorage.clear();

    },

    /**
     * User
     */
    saveUser(user) {

        this.set(
            CONFIG.STORAGE.USER,
            user
        );

    },

    getUser() {

        return this.get(
            CONFIG.STORAGE.USER
        );

    },

    /**
     * Access Token
     */
    saveAccessToken(token) {

        this.set(
            CONFIG.STORAGE.ACCESS_TOKEN,
            token
        );

    },

    getAccessToken() {

        return this.get(
            CONFIG.STORAGE.ACCESS_TOKEN
        );

    },

    /**
     * Authentication Status
     */
    isLoggedIn() {

        return !!this.getAccessToken();

    },

    /**
     * Logout
     */
    logout() {

        this.remove(CONFIG.STORAGE.USER);

        this.remove(CONFIG.STORAGE.ACCESS_TOKEN);

    }

};