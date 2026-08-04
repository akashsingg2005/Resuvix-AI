/**
 * ==========================================================
 * RESUVIX AI
 * Toast Notification System
 * ==========================================================
 */

class Toast {

    constructor() {

        this.container = document.getElementById("toastContainer");

        if (!this.container) {

            this.container = document.createElement("div");

            this.container.id = "toastContainer";

            this.container.className = "toast-container";

            document.body.appendChild(this.container);

        }

    }

    show(message, type = "info", duration = 3500) {

        const toast = document.createElement("div");

        toast.className = `toast ${type}`;

        const icons = {

            success: "ri-checkbox-circle-fill",

            error: "ri-close-circle-fill",

            warning: "ri-error-warning-fill",

            info: "ri-information-fill"

        };

        toast.innerHTML = `

            <div class="toast-icon">

                <i class="${icons[type]}"></i>

            </div>

            <div class="toast-content">

                ${message}

            </div>

            <button class="toast-close">

                <i class="ri-close-line"></i>

            </button>

            <div class="toast-progress"></div>

        `;

        this.container.appendChild(toast);

        requestAnimationFrame(() => {

            toast.classList.add("show");

        });

        toast.querySelector(".toast-close")
            .addEventListener("click", () => {

                this.remove(toast);

            });

        setTimeout(() => {

            this.remove(toast);

        }, duration);

    }

    remove(toast) {

        toast.classList.remove("show");

        setTimeout(() => {

            toast.remove();

        }, 300);

    }

    success(message) {

        this.show(message, "success");

    }

    error(message) {

        this.show(message, "error");

    }

    warning(message) {

        this.show(message, "warning");

    }

    info(message) {

        this.show(message, "info");

    }

}

const toast = new Toast();