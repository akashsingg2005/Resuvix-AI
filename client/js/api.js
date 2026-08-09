/**
 * ==========================================================
 * RESUVIX AI
 * API Client & AuthAPI Class
 * ==========================================================
 */

class APIClient {

    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
        this.timeout = CONFIG.REQUEST.TIMEOUT;
        this.headers = CONFIG.REQUEST.HEADERS;
    }

    async request(endpoint, options = {}) {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            controller.abort();
        }, this.timeout);

        try {
            const reqHeaders = {
                ...this.headers,
                ...options.headers
            };

            const token = typeof Storage !== "undefined" ? Storage.getAccessToken() : null;
            if (token && !reqHeaders["Authorization"]) {
                reqHeaders["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(
                this.baseURL + endpoint,
                {
                    credentials: "include",
                    signal: controller.signal,
                    headers: reqHeaders,
                    ...options
                }
            );

            clearTimeout(timer);

            let result = {};
            try {
                result = await response.json();
            } catch (e) {
                result = {};
            }

            if (!response.ok) {
                if (response.status === 401 || (result.message && result.message.includes("jwt expired"))) {
                    // Try refreshing token once
                    try {
                        const refreshRes = await fetch(this.baseURL + "/api/v1/auth/refresh-token", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include"
                        });
                        if (refreshRes.ok) {
                            const refreshData = await refreshRes.json();
                            const newToken = refreshData.data?.accessToken || refreshData.accessToken;
                            if (newToken && typeof Storage !== "undefined") {
                                Storage.saveAccessToken(newToken);
                                reqHeaders["Authorization"] = `Bearer ${newToken}`;

                                // Retry original request silently
                                const retryRes = await fetch(this.baseURL + endpoint, {
                                    credentials: "include",
                                    headers: reqHeaders,
                                    ...options
                                });

                                if (retryRes.ok) {
                                    const retryData = await retryRes.json();
                                    return retryData.data !== undefined ? retryData.data : retryData;
                                }
                            }
                        }
                    } catch (rErr) {
                        console.error("Auto refresh failed:", rErr.message);
                    }

                    const msg = result.message || "Session expired. Please log in again.";
                    throw new Error(msg);
                }

                const msg = result.message || `Request failed (${response.status})`;
                throw new Error(msg);
            }

            return result.data !== undefined ? result.data : result;

        } catch (error) {
            clearTimeout(timer);
            if (error.name === "AbortError") {
                throw new Error("Request timeout. Please check your internet connection.");
            }
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: "GET" });
    }

    async post(endpoint, body = {}) {
        return this.request(endpoint, {
            method: "POST",
            body: JSON.stringify(body)
        });
    }

    async uploadFile(endpoint, formData) {
        const token = typeof Storage !== "undefined" ? Storage.getAccessToken() : null;
        const headers = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        let response = await fetch(this.baseURL + endpoint, {
            method: "POST",
            headers,
            body: formData,
            credentials: "include"
        });

        let result = {};
        try {
            result = await response.json();
        } catch (e) {
            result = {};
        }

        if (!response.ok) {
            if (response.status === 401 || (result.message && result.message.includes("jwt expired"))) {
                // Try refreshing token once
                try {
                    const refreshRes = await fetch(this.baseURL + "/api/v1/auth/refresh-token", {
                        method: "POST",
                        credentials: "include"
                    });
                    if (refreshRes.ok) {
                        const refreshData = await refreshRes.json();
                        const newToken = refreshData.data?.accessToken || refreshData.accessToken;
                        if (newToken && typeof Storage !== "undefined") {
                            Storage.setAccessToken(newToken);
                            headers["Authorization"] = `Bearer ${newToken}`;

                            const retryRes = await fetch(this.baseURL + endpoint, {
                                method: "POST",
                                headers,
                                body: formData,
                                credentials: "include"
                            });

                            if (retryRes.ok) {
                                const retryData = await retryRes.json();
                                return retryData.data !== undefined ? retryData.data : retryData;
                            }
                        }
                    }
                } catch (rErr) {
                    console.error("Auto refresh failed during file upload:", rErr.message);
                }

                if (typeof Storage !== "undefined") {
                    Storage.clearAuth();
                }
                if (typeof toast !== "undefined") {
                    toast.error("Session expired. Please log in again.");
                }

                throw new Error("Session expired. Please log in again.");
            }

            throw new Error(result.message || "File upload failed");
        }

        return result.data !== undefined ? result.data : result;
    }

    async put(endpoint, body = {}) {
        return this.request(endpoint, {
            method: "PUT",
            body: JSON.stringify(body)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: "DELETE"
        });
    }
}

const api = new APIClient();

class AuthAPI {

    constructor(apiClient = api) {
        this.api = apiClient;
    }

    async sendRegisterOTP(email) {
        return this.api.post("/api/v1/auth/send-register-otp", { email });
    }

    async register(data) {
        return this.api.post("/api/v1/auth/register", data);
    }

    async login(data) {
        return this.api.post("/api/v1/auth/login", data);
    }

    async logout() {
        return this.api.post("/api/v1/auth/logout");
    }

    async getMe() {
        return this.api.get("/api/v1/auth/me");
    }

    async me() {
        return this.api.get("/api/v1/auth/me");
    }

    async refreshToken() {
        return this.api.post("/api/v1/auth/refresh-token");
    }

    // Static Methods for direct class invocation
    static async sendRegisterOTP(email) {
        return api.post("/api/v1/auth/send-register-otp", { email });
    }

    static async register(data) {
        return api.post("/api/v1/auth/register", data);
    }

    static async login(data) {
        return api.post("/api/v1/auth/login", data);
    }

    static async logout() {
        return api.post("/api/v1/auth/logout");
    }

    static async getMe() {
        return api.get("/api/v1/auth/me");
    }

    static async refreshToken() {
        return api.post("/api/v1/auth/refresh-token");
    }
}

const authAPI = new AuthAPI(api);