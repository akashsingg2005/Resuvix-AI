/**
 * ==========================================
 * RESUVIX AI
 * Global Configuration
 * ==========================================
 */

const CONFIG = Object.freeze({

    APP_NAME: "Resuvix AI",

    VERSION: "1.0.0",

    API: {

        BASE_URL: (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
            ? "http://localhost:5000"
            : "https://resuvix-ai.onrender.com",

        AUTH: "/api/v1/auth",

        USER: "/api/v1/users"

    },

    REQUEST: {

        TIMEOUT: 60000,

        HEADERS: {

            "Content-Type": "application/json"

        }

    },

    STORAGE: {

        ACCESS_TOKEN: "resuvix_access_token",

        USER: "resuvix_user",

        THEME: "resuvix_theme"

    }

});