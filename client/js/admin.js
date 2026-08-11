/**
 * ==========================================================
 * RESUVIX AI - ADMIN DASHBOARD CONTROLLER (FULL REAL DATA)
 * Controls Live Metrics, Pricing Settings, and Coupon Management.
 * ==========================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    if (!Storage.isLoggedIn()) {
        window.location.href = "../login.html";
        return;
    }

    const auth = new AuthController();
    await auth.restoreSession();

    const user = Storage.getUser();
    if (!user || user.role !== "admin") {
        toast.error("Access denied. Admins only.");
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);
        return;
    }

    const adminApp = new AdminApp();
    await adminApp.init();
});

class AdminApp {

    constructor() {
        this.coupons = [];
    }

    async init() {
        this.initFormListeners();
        this.initModalListeners();
        await this.loadAdminStats();
        await this.loadSettings();
        await this.loadCoupons();
    }

    async loadAdminStats() {
        try {
            const res = await api.get("/api/v1/admin/stats");
            const data = res.data || res;
            if (data) {
                const admTotalRev = document.getElementById("admTotalRev");
                const admPremUsers = document.getElementById("admPremUsers");
                const admCouponsUsed = document.getElementById("admCouponsUsed");
                const admGenCount = document.getElementById("admGenCount");

                if (admTotalRev) admTotalRev.textContent = `₹${data.totalRevenue || 0}`;
                if (admPremUsers) admPremUsers.textContent = data.premiumUsers || 0;
                if (admCouponsUsed) admCouponsUsed.textContent = data.couponsUsed || 0;
                if (admGenCount) admGenCount.textContent = data.totalResumes || 0;
            }
        } catch (err) {
            console.error("Failed to load admin stats:", err);
        }
    }

    async loadSettings() {
        try {
            const data = await api.get("/api/v1/settings");
            const settings = data.data || data;
            if (settings) {
                const cfgSiteName = document.getElementById("cfgSiteName");
                const cfgSinglePrice = document.getElementById("cfgSinglePrice");
                const cfgPrice = document.getElementById("cfgPrice");
                const cfgAIProvider = document.getElementById("cfgAIProvider");

                if (cfgSiteName && settings.siteName) cfgSiteName.value = settings.siteName;
                if (cfgSinglePrice) cfgSinglePrice.value = settings.premiumDownloadPrice !== undefined ? settings.premiumDownloadPrice : 49;
                if (cfgPrice) cfgPrice.value = settings.bulkDownloadPrice !== undefined ? settings.bulkDownloadPrice : 499;
                if (cfgAIProvider && settings.aiProvider) cfgAIProvider.value = settings.aiProvider;
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        }
    }

    initFormListeners() {
        const settingsForm = document.getElementById("pricingSettingsForm");
        if (settingsForm) {
            settingsForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const siteName = document.getElementById("cfgSiteName").value.trim();
                const premiumDownloadPrice = Number(document.getElementById("cfgSinglePrice").value);
                const bulkDownloadPrice = Number(document.getElementById("cfgPrice").value);
                const aiProvider = document.getElementById("cfgAIProvider").value;

                const btnSubmit = settingsForm.querySelector("button[type='submit']");
                const originalText = btnSubmit.innerHTML;
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Saving Settings...`;

                try {
                    toast.info("Saving updated pricing to database...");
                    await api.put("/api/v1/settings", {
                        siteName,
                        premiumDownloadPrice,
                        bulkDownloadPrice,
                        aiProvider
                    });

                    toast.success("Pricing & Global Settings saved to database!");

                    // Visual success alert banner directly in the form
                    let successMsg = document.getElementById("settingsSuccessAlert");
                    if (!successMsg) {
                        successMsg = document.createElement("div");
                        successMsg.id = "settingsSuccessAlert";
                        successMsg.style.cssText = "grid-column: 1 / -1; margin-top: 10px; padding: 14px 20px; background: rgba(34, 197, 94, 0.12); border: 1px solid #22C55E; color: #166534; border-radius: 12px; font-weight: 700; font-size: 13.5px; display: flex; align-items: center; gap: 8px;";
                        settingsForm.appendChild(successMsg);
                    }
                    successMsg.innerHTML = `<i class="ri-checkbox-circle-fill" style="font-size: 20px; color: #22C55E;"></i> Pricing Settings saved to MongoDB! (Single Pass: ₹${premiumDownloadPrice}, Pro Pass: ₹${bulkDownloadPrice})`;
                    successMsg.style.display = "flex";

                    setTimeout(() => {
                        if (successMsg) successMsg.style.display = "none";
                    }, 6000);

                    await this.loadSettings();
                    await this.loadAdminStats();
                } catch (err) {
                    toast.error(err.message || "Failed to update settings.");
                } finally {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = originalText;
                }
            });
        }

        const createCouponForm = document.getElementById("createCouponForm");
        if (createCouponForm) {
            createCouponForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const code = document.getElementById("cpCode").value.trim().toUpperCase();
                const discountType = document.getElementById("cpType").value;
                const discountValue = Number(document.getElementById("cpValue").value);
                const maxDiscount = Number(document.getElementById("cpMaxDiscount")?.value) || 0;
                const usageLimit = Number(document.getElementById("cpLimit").value) || 100;

                try {
                    await api.post("/api/v1/coupons", {
                        code,
                        discountType,
                        discountValue,
                        maxDiscount,
                        usageLimit,
                        active: true
                    });
                    toast.success(`Coupon ${code} created successfully!`);
                    this.closeCouponModal();
                    createCouponForm.reset();
                    await this.loadCoupons();
                    await this.loadAdminStats();
                } catch (err) {
                    toast.error(err.message || "Failed to create coupon.");
                }
            });
        }
    }

    async loadCoupons() {
        try {
            const res = await api.get("/api/v1/coupons");
            this.coupons = res.data || res || [];
            this.renderCoupons();
        } catch (err) {
            console.error("Failed to load coupons:", err);
        }
    }

    renderCoupons() {
        const tbody = document.getElementById("couponsTableBody");
        if (!tbody) return;

        if (!this.coupons.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No coupons created yet.</td></tr>`;
            return;
        }

        let html = "";
        this.coupons.forEach(cp => {
            const valStr = cp.discountType === "percentage" ? `${cp.discountValue}%` : `₹${cp.discountValue}`;
            const maxCapStr = cp.maxDiscount > 0 ? `₹${cp.maxDiscount}` : `No Cap`;
            const statusBadge = cp.active ? `<span style="color: var(--success); font-weight: 700;">Active</span>` : `<span style="color: #EF4444;">Disabled</span>`;

            html += `
                <tr>
                    <td><strong>${cp.code}</strong></td>
                    <td style="text-transform: capitalize;">${cp.discountType}</td>
                    <td>${valStr}</td>
                    <td><span style="font-weight: 600; color: #0284C7;">${maxCapStr}</span></td>
                    <td>${cp.usedCount || 0} / ${cp.usageLimit || '∞'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn-action-small btn-del-cp" data-id="${cp._id}" style="color: #EF4444;">
                            <i class="ri-delete-bin-line"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        tbody.querySelectorAll(".btn-del-cp").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm("Delete this coupon code?")) {
                    try {
                        await api.delete(`/api/v1/coupons/${id}`);
                        toast.success("Coupon deleted.");
                        await this.loadCoupons();
                        await this.loadAdminStats();
                    } catch (err) {
                        toast.error(err.message || "Failed to delete coupon.");
                    }
                }
            });
        });
    }

    initModalListeners() {
        const btnOpen = document.getElementById("btnOpenCreateCoupon");
        const btnClose = document.getElementById("couponModalClose");
        const btnCancel = document.getElementById("btnCancelCouponModal");
        const overlay = document.getElementById("couponModalOverlay");

        if (btnOpen) btnOpen.addEventListener("click", () => overlay.classList.add("active"));
        if (btnClose) btnClose.addEventListener("click", () => this.closeCouponModal());
        if (btnCancel) btnCancel.addEventListener("click", () => this.closeCouponModal());
    }

    closeCouponModal() {
        const overlay = document.getElementById("couponModalOverlay");
        if (overlay) overlay.classList.remove("active");
    }
}
