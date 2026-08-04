/**
 * ==========================================
 * RESUVIX AI
 * Authentication Controller
 * ==========================================
 */

class AuthController {

    constructor() {

        this.loginForm =
            document.getElementById("loginForm");

        this.registerForm =
            document.getElementById("registerForm");

        this.initialize();

    }

    /**
     * ==========================================
     * INITIALIZE
     * ==========================================
     */

    initialize() {

        this.initializePasswordToggle();

        this.initializeForms();

        this.initializeValidation();

        this.initializePasswordStrength();

    }

    /**
     * ==========================================
     * PASSWORD TOGGLE
     * ==========================================
     */

    initializePasswordToggle() {

        const buttons =
            document.querySelectorAll(".toggle-password");

        buttons.forEach(button => {

            button.addEventListener("click", () => {

                const target =
                    document.getElementById(
                        button.dataset.target
                    );

                if (!target) return;

                const icon =
                    button.querySelector("i");

                if (target.type === "password") {

                    target.type = "text";

                    if (icon) {

                        icon.classList.remove("ri-eye-line");
                        icon.classList.add("ri-eye-off-line");

                    }

                }

                else {

                    target.type = "password";

                    if (icon) {

                        icon.classList.remove("ri-eye-off-line");
                        icon.classList.add("ri-eye-line");

                    }

                }

            });

        });

    }

    /**
     * ==========================================
     * FORM INITIALIZATION
     * ==========================================
     */

    initializeForms() {

        if (this.loginForm) {

            this.loginForm.addEventListener(

                "submit",

                this.handleLogin.bind(this)

            );

        }

        if (this.registerForm) {

            this.registerForm.addEventListener(

                "submit",

                this.handleRegister.bind(this)

            );

        }

    }

    /**
     * ==========================================
     * LIVE VALIDATION
     * ==========================================
     */

    initializeValidation() {

        const forms =
            document.querySelectorAll("form");

        forms.forEach(form => {

            const fields =
                form.querySelectorAll(

                    "input, textarea"

                );

            fields.forEach(field => {

                if (

                    field.type === "checkbox" ||

                    field.type === "hidden"

                ) {

                    return;

                }

                field.addEventListener(

                    "blur",

                    () => this.validateField(field)

                );

                field.addEventListener(

                    "input",

                    () => this.clearError(field)

                );

            });

            

        });

        

    }
    initializePasswordStrength() {

    const passwordInput = document.getElementById("password");

    if (!passwordInput) return;

    passwordInput.addEventListener("input", () => {

        const fill = document.getElementById("strengthFill");
        const text = document.getElementById("strengthText");

        if (!fill || !text) return;

        const password = passwordInput.value;

        let score = 0;

        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[@$!%*?&^#()_\-+=]/.test(password)) score++;

        fill.style.width = (score * 20) + "%";

        if (score <= 1) {
            fill.style.background = "#ef4444";
            text.textContent = "Very Weak";
        } else if (score === 2) {
            fill.style.background = "#f97316";
            text.textContent = "Weak";
        } else if (score === 3) {
            fill.style.background = "#facc15";
            text.textContent = "Medium";
        } else if (score === 4) {
            fill.style.background = "#22c55e";
            text.textContent = "Strong";
        } else {
            fill.style.background = "#16a34a";
            text.textContent = "Very Strong";
        }

        if (password.length === 0) {
            fill.style.width = "0%";
            text.textContent = "Password Strength";
        }

    });

}

    /**
     * ==========================================
     * VALIDATE FIELD
     * ==========================================
     */

    validateField(field) {

        const value =
            field.value.trim();

        let result = {

            valid: true,

            message: ""

        };

        switch (field.name || field.id) {

            case "fullName":

                result =
                    Validator.validateName(value);

                break;

            case "email":

                result =
                    Validator.validateEmail(value);

                break;

            case "password":

                result =
                    Validator.validatePassword(value);

                break;

            case "confirmPassword":

                const password =
                    document.getElementById("password")?.value || "";

                result =
                    Validator.validateConfirmPassword(

                        password,

                        value

                    );

                break;

        }

        if (!result.valid) {

            this.showError(

                field,

                result.message

            );

            return false;

        }

        this.showSuccess(field);

        return true;

    }

    /**
     * ==========================================
     * SHOW ERROR
     * ==========================================
     */

    showError(field, message) {

        field.classList.add("is-invalid");

        field.classList.remove("is-valid");

        const error =
            document.getElementById(

                `${field.id}Error`

            );

        if (error) {

            error.textContent = message;

        }

    }

    /**
     * ==========================================
     * CLEAR ERROR
     * ==========================================
     */

    clearError(field) {

        field.classList.remove("is-invalid");

        const error =
            document.getElementById(

                `${field.id}Error`

            );

        if (error) {

            error.textContent = "";

        }

    }

    /**
     * ==========================================
     * SHOW SUCCESS
     * ==========================================
     */

    showSuccess(field) {

        field.classList.remove("is-invalid");

        field.classList.add("is-valid");

        const error =
            document.getElementById(

                `${field.id}Error`

            );

        if (error) {

            error.textContent = "";

        }

    }

    /**
     * ==========================================
     * SET BUTTON LOADING
     * ==========================================
     */

    setLoading(buttonId, loaderId, loading = true) {

        const button =
            document.getElementById(buttonId);

        const loader =
            document.getElementById(loaderId);

        if (!button) return;

        button.disabled = loading;

        if (loader) {

            loader.style.display =

                loading ? "inline-block" : "none";

        }

    }
        /**
     * ==========================================
     * HANDLE LOGIN
     * ==========================================
     */

    async handleLogin(event) {

        event.preventDefault();

        const email =
            document.getElementById("email");

        const password =
            document.getElementById("password");

        let valid = true;

        valid &= this.validateField(email);
        valid &= this.validateField(password);

        if (!valid) {

            toast.error("Please fix the highlighted fields.");

            return;

        }

        this.setLoading(

            "loginBtn",

            "loginLoader",

            true

        );

        try {

            const response = await AuthAPI.login({

                email: email.value.trim(),

                password: password.value

            });

            Storage.saveUser(

                response.user

            );

            Storage.saveAccessToken(

                response.accessToken

            );

            toast.success("Login successful.");

            setTimeout(() => {

                window.location.href =
                    "./pages/dashboard.html";

            }, 800);

        }

        catch (error) {

            toast.error(

                error.message ||

                "Login failed."

            );

        }

        finally {

            this.setLoading(

                "loginBtn",

                "loginLoader",

                false

            );

        }

    }

    /**
     * ==========================================
     * HANDLE REGISTER
     * ==========================================
     */

    async handleRegister(event) {

        event.preventDefault();

        const fullName =
            document.getElementById("fullName");

        const email =
            document.getElementById("email");

        const password =
            document.getElementById("password");

        const confirmPassword =
            document.getElementById("confirmPassword");

        let valid = true;

        valid &= this.validateField(fullName);
        valid &= this.validateField(email);
        valid &= this.validateField(password);
        valid &= this.validateField(confirmPassword);

        if (!valid) {

            toast.error("Please fix the highlighted fields.");

            return;

        }

        this.setLoading(

            "registerBtn",

            "registerLoader",

            true

        );

        try {

            const response = await AuthAPI.register({

                fullName: fullName.value.trim(),

                email: email.value.trim(),

                password: password.value

            });

            Storage.saveUser(

                response.user

            );

            Storage.saveAccessToken(

                response.accessToken

            );

            toast.success(

                "Registration successful."

            );

            setTimeout(() => {

                window.location.href =
                    "./pages/dashboard.html";

            }, 800);

        }

        catch (error) {

            toast.error(

                error.message ||

                "Registration failed."

            );

        }

        finally {

            this.setLoading(

                "registerBtn",

                "registerLoader",

                false

            );

        }

    }

    /**
     * ==========================================
     * LOGOUT
     * ==========================================
     */

    async logout() {

        try {

            await AuthAPI.logout();

        }

        catch (error) {

            console.error(error);

        }

        finally {

            Storage.logout();

            window.location.href =
                "../login.html";

        }

    }

    /**
     * ==========================================
     * GET CURRENT USER
     * ==========================================
     */

    getCurrentUser() {

        return Storage.getUser();

    }

    /**
     * ==========================================
     * IS AUTHENTICATED
     * ==========================================
     */

    isAuthenticated() {

        return Storage.isLoggedIn();

    }

    /**
     * ==========================================
     * REFRESH ACCESS TOKEN
     * ==========================================
     */

    async refreshAccessToken() {

        try {

            const response =

                await AuthAPI.refreshToken();

            if (response.accessToken) {

                Storage.saveAccessToken(

                    response.accessToken

                );

            }

            return true;

        }

        catch (error) {

            Storage.logout();

            return false;

        }

    }

    /**
     * ==========================================
     * RESTORE SESSION
     * ==========================================
     */

    async restoreSession() {

        if (!Storage.isLoggedIn()) {

            return;

        }

        try {

            const response =

                await AuthAPI.me();

            Storage.saveUser(

                response.user

            );

        }

        catch (error) {

            const refreshed =

                await this.refreshAccessToken();

            if (!refreshed) {

                return;

            }

            try {

                const response =

                    await AuthAPI.me();

                Storage.saveUser(

                    response.user

                );

            }

            catch {

                Storage.logout();

            }

        }

    }
        /**
     * ==========================================
     * PROTECTED ROUTES
     * ==========================================
     */

    protectRoute() {

        const protectedPages = [

            "dashboard.html",
            "profile.html",
            "resume.html",
            "builder.html",
            "settings.html",
            "billing.html"

        ];

        const currentPage =

            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();

        if (

            protectedPages.includes(currentPage) &&

            !Storage.isLoggedIn()

        ) {

            window.location.href = "../login.html";

        }

    }

    /**
     * ==========================================
     * GUEST ROUTES
     * ==========================================
     */

    protectGuestPages() {

        const guestPages = [

            "login.html",
            "register.html"

        ];

        const currentPage =

            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();

        if (

            guestPages.includes(currentPage) &&

            Storage.isLoggedIn()

        ) {

            window.location.href =
                "./pages/dashboard.html";

        }

    }

    /**
     * ==========================================
     * LOGOUT BUTTON
     * ==========================================
     */

    initializeLogout() {

        const logoutBtn =

            document.getElementById("logoutBtn");

        if (!logoutBtn) {

            return;

        }

        logoutBtn.addEventListener(

            "click",

            async (event) => {

                event.preventDefault();

                await this.logout();

            }

        );

    }

    /**
     * ==========================================
     * APPLICATION STARTUP
     * ==========================================
     */

    async start() {

        await this.restoreSession();

        this.protectGuestPages();

        this.protectRoute();

        this.initializeLogout();

    }

} // ===== END OF AuthController =====


/**
 * ==========================================
 * INITIALIZE APPLICATION
 * ==========================================
 */

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        const auth = new AuthController();

        await auth.start();

    }

);