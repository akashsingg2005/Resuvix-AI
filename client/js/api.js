/**
 * ==========================================================
 * RESUVIX AI
 * API Client
 * ==========================================================
 */

class APIClient {

    constructor() {

        this.baseURL = CONFIG.API.BASE_URL;

        this.timeout = CONFIG.REQUEST.TIMEOUT;

        this.headers = CONFIG.REQUEST.HEADERS;

    }

    /**
     * Generic Request
     */

    async request(endpoint, options = {}) {

        const controller = new AbortController();

        const timer = setTimeout(() => {

            controller.abort();

        }, this.timeout);

        try {

            const response = await fetch(

                this.baseURL + endpoint,

                {

                    credentials: "include",

                    signal: controller.signal,

                    headers: {

                        ...this.headers,

                        ...options.headers

                    },

                    ...options

                }

            );

            clearTimeout(timer);

            let result = {};

try {

    result = await response.json();

}

catch {

    result = {};

}

if (!response.ok) {

    throw new Error(

        result.message ||

        result.error ||

        "Something went wrong."

    );

}

return result.data;

        }

        catch (error) {

            clearTimeout(timer);

            throw error;

        }

    }

    /**
     * GET
     */

    get(endpoint) {

        return this.request(endpoint, {

            method: "GET"

        });

    }

    /**
     * POST
     */

    post(endpoint, body) {

        return this.request(endpoint, {

            method: "POST",

            body: JSON.stringify(body)

        });

    }

    /**
     * PATCH
     */

    patch(endpoint, body) {

        return this.request(endpoint, {

            method: "PATCH",

            body: JSON.stringify(body)

        });

    }

    /**
     * DELETE
     */

    delete(endpoint) {

        return this.request(endpoint, {

            method: "DELETE"

        });

    }

}

const api = new APIClient();

/**
 * ==========================================================
 * AUTH API
 * ==========================================================
 */

const AuthAPI = {

    register(data) {
        return api.post(`${CONFIG.API.AUTH}/register`, data);
    },

    login(data) {
        return api.post(`${CONFIG.API.AUTH}/login`, data);
    },

    logout() {
    return api.post(`${CONFIG.API.AUTH}/logout`, {});
},

    me() {
        return api.get(`${CONFIG.API.AUTH}/me`);
    },

    refreshToken() {
    return api.post(`${CONFIG.API.AUTH}/refresh-token`, {});
},

    changePassword(data) {
        return api.patch(`${CONFIG.API.AUTH}/change-password`, data);
    }

};

/**
 * ==========================================================
 * USER API
 * ==========================================================
 */

const UserAPI = {

    profile() {

        return api.get(

            "/api/v1/users/profile"

        );

    },

    update(data) {

        return api.patch(

            "/api/v1/users/profile",

            data

        );

    }

};