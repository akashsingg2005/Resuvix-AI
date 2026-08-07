/**
 * ==========================================================
 * RESUVIX AI - DASHBOARD CONTROLLER (SUPERCHARGED & FEATURE-COMPLETE)
 * Handles Dashboard UI, Drawer Navigation, 1 Free Download Enforcement,
 * Admin Managed Pricing, Coupon Discount Engine, and Razorpay Payments.
 * ==========================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    // 1. Guard check & restore session
    if (!Storage.isLoggedIn()) {
        window.location.href = "../login.html";
        return;
    }

    const auth = new AuthController();
    await auth.restoreSession();

    const currentUser = Storage.getUser();
    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    // 2. Initialize Dashboard Component
    const dashboard = new DashboardApp(currentUser, auth);
    await dashboard.init();
});

class DashboardApp {

    constructor(user, authController) {
        this.user = user;
        this.auth = authController;
        this.resumes = [];
        
        // Admin Managed Default Prices (Overridden dynamically from DB Settings)
        this.perResumePrice = 49;
        this.proUnlimitedPrice = 499;

        this.selectedPlan = "single"; // 'single' or 'unlimited'
        this.currentBasePrice = 49;
        this.appliedDiscount = 0;
        this.appliedCouponCode = "";
    }

    async init() {
        this.updateUserUI();
        this.initDrawer();
        this.initEventListeners();
        this.initModals();
        await this.fetchSettings();
        await this.loadResumes();
    }

    /**
     * Fetch Admin Managed Settings (Pricing & Keys)
     */
    async fetchSettings() {
        try {
            const res = await api.get("/api/v1/settings");
            const data = res.data || res;
            if (data) {
                if (data.premiumDownloadPrice !== undefined) {
                    this.perResumePrice = Number(data.premiumDownloadPrice);
                }
                if (data.bulkDownloadPrice !== undefined) {
                    this.proUnlimitedPrice = Number(data.bulkDownloadPrice);
                }
            }
        } catch (err) {
            console.log("Using default admin pricing:", this.perResumePrice, this.proUnlimitedPrice);
        }
        this.currentBasePrice = this.selectedPlan === "unlimited" ? this.proUnlimitedPrice : this.perResumePrice;
    }

    /**
     * Update User Info in Navbar & Dashboard Header
     */
    updateUserUI() {
        const userNameText = document.getElementById("userNameText");
        const greetingUserName = document.getElementById("greetingUserName");
        const userAvatarText = document.getElementById("userAvatarText");
        const planBadgeContainer = document.getElementById("planBadgeContainer");
        const navItemAdmin = document.getElementById("navItemAdmin");
        const dropBtnAdmin = document.getElementById("dropBtnAdmin");
        const drawerUpgradeCard = document.getElementById("drawerUpgradeCard");

        const firstName = this.user.fullName ? this.user.fullName.split(" ")[0] : "User";
        const initial = this.user.fullName ? this.user.fullName.charAt(0).toUpperCase() : "U";

        if (userNameText) userNameText.textContent = firstName;
        if (greetingUserName) greetingUserName.textContent = firstName;
        if (userAvatarText) userAvatarText.textContent = initial;

        // Admin badge & links
        if (this.user.role === "admin") {
            if (navItemAdmin) navItemAdmin.style.display = "flex";
            if (dropBtnAdmin) dropBtnAdmin.style.display = "flex";
        }

        // Premium plan status
        if (this.user.premium) {
            if (planBadgeContainer) {
                planBadgeContainer.innerHTML = `<span class="dash-badge-pro"><i class="ri-vip-crown-fill"></i> Pro Member</span>`;
            }
            if (drawerUpgradeCard) {
                drawerUpgradeCard.style.display = "none";
            }
        } else {
            if (planBadgeContainer) {
                planBadgeContainer.innerHTML = `<span class="dash-badge-free" id="userPlanBadge"><i class="ri-sparkling-fill"></i> Free Tier (1 Free)</span>`;
            }
        }
    }

    /**
     * Slide Drawer Controls
     */
    initDrawer() {
        const trigger = document.getElementById("drawerTrigger");
        const closeBtn = document.getElementById("drawerClose");
        const overlay = document.getElementById("drawerOverlay");
        const drawer = document.getElementById("chatgptDrawer");

        const openDrawer = () => {
            if (drawer) drawer.classList.add("active");
            if (overlay) overlay.classList.add("active");
            document.body.style.overflow = "hidden";
        };

        const closeDrawer = () => {
            if (drawer) drawer.classList.remove("active");
            if (overlay) overlay.classList.remove("active");
            document.body.style.overflow = "";
        };

        this.closeDrawer = closeDrawer;

        if (trigger) trigger.addEventListener("click", openDrawer);
        if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
        if (overlay) overlay.addEventListener("click", closeDrawer);

        // Auto close drawer when clicking any menu item
        document.querySelectorAll(".drawer-menu-list .drawer-item").forEach(item => {
            item.addEventListener("click", () => {
                closeDrawer();
            });
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeDrawer();
        });
    }

    /**
     * Attach Global Event Listeners & Handlers
     */
    initEventListeners() {
        // Logout buttons
        const drawerLogoutBtn = document.getElementById("drawerLogoutBtn");
        if (drawerLogoutBtn) {
            drawerLogoutBtn.addEventListener("click", () => this.auth.logout());
        }

        const dropBtnLogout = document.getElementById("dropBtnLogout");
        if (dropBtnLogout) {
            dropBtnLogout.addEventListener("click", () => this.auth.logout());
        }

        // User Avatar Profile Dropdown Toggle
        const userProfilePill = document.getElementById("userProfilePill");
        const userDropdownMenu = document.getElementById("userDropdownMenu");
        if (userProfilePill && userDropdownMenu) {
            userProfilePill.addEventListener("click", (e) => {
                e.stopPropagation();
                userDropdownMenu.classList.toggle("show");
            });

            document.addEventListener("click", () => {
                userDropdownMenu.classList.remove("show");
            });
        }

        const dropBtnAdmin = document.getElementById("dropBtnAdmin");
        if (dropBtnAdmin) {
            dropBtnAdmin.addEventListener("click", () => {
                window.location.href = "admin.html";
            });
        }

        // AI Resume Creation Triggers
        const btnCreateAIResume = document.getElementById("btnCreateAIResume");
        const btnCreateFirstResume = document.getElementById("btnCreateFirstResume");
        const quickCardCreateAI = document.getElementById("quickCardCreateAI");

        const handleCreateIntent = () => {
            window.location.href = "builder.html";
        };

        if (btnCreateAIResume) btnCreateAIResume.addEventListener("click", handleCreateIntent);
        if (btnCreateFirstResume) btnCreateFirstResume.addEventListener("click", handleCreateIntent);
        if (quickCardCreateAI) quickCardCreateAI.addEventListener("click", handleCreateIntent);

        // Drawer Nav Links
        const navItemResumes = document.getElementById("navItemResumes");
        if (navItemResumes) {
            navItemResumes.addEventListener("click", (e) => {
                e.preventDefault();
                const section = document.querySelector(".recent-resumes-section");
                if (section) section.scrollIntoView({ behavior: "smooth" });
                document.getElementById("chatgptDrawer").classList.remove("active");
                document.getElementById("drawerOverlay").classList.remove("active");
            });
        }

        // Upgrade button in Drawer
        const btnDrawerUpgrade = document.getElementById("btnDrawerUpgrade");
        if (btnDrawerUpgrade) {
            btnDrawerUpgrade.addEventListener("click", () => this.openPremiumModal());
        }

        // Coupon Application
        const btnApplyCoupon = document.getElementById("btnApplyCoupon");
        if (btnApplyCoupon) {
            btnApplyCoupon.addEventListener("click", () => this.handleApplyCoupon());
        }

        // Pay & Upgrade Trigger
        const btnPayUpgrade = document.getElementById("btnPayUpgrade");
        if (btnPayUpgrade) {
            btnPayUpgrade.addEventListener("click", () => this.handleRazorpayPayment());
        }

        const modalClose = document.getElementById("premiumModalClose");
        const cancelModal = document.getElementById("btnCancelModal");
        if (modalClose) modalClose.addEventListener("click", () => this.closePremiumModal());
        if (cancelModal) cancelModal.addEventListener("click", () => this.closePremiumModal());
    }

    /**
     * Render Dynamic Premium Plans Grid with Admin Managed Pricing
     */
    renderPlansGrid() {
        const grid = document.getElementById("modalPlansGrid");
        if (!grid) return;

        grid.innerHTML = `
            <div class="plan-card-option ${this.selectedPlan === 'single' ? 'active' : ''}" data-plan="single" data-price="${this.perResumePrice}">
                <div class="plan-name">1 Single Resume Download</div>
                <div class="plan-price">₹${this.perResumePrice} <span style="font-size: 12px; font-weight: 500;">/ resume</span></div>
                <div style="font-size: 11px; color: var(--text-light); margin-top: 4px;">Download 1 PDF resume instantly</div>
            </div>

            <div class="plan-card-option ${this.selectedPlan === 'unlimited' ? 'active' : ''}" data-plan="unlimited" data-price="${this.proUnlimitedPrice}">
                <div class="plan-name">Pro Unlimited Yearly Pass (Best Value)</div>
                <div class="plan-price">₹${this.proUnlimitedPrice} <span style="font-size: 12px; font-weight: 500;">/ yearly</span></div>
                <div style="font-size: 11px; color: var(--success); font-weight: 700; margin-top: 4px;">Unlimited AI resumes & PDF downloads for 1 year</div>
            </div>
        `;

        grid.querySelectorAll(".plan-card-option").forEach(card => {
            card.addEventListener("click", () => {
                grid.querySelectorAll(".plan-card-option").forEach(c => c.classList.remove("active"));
                card.classList.add("active");
                this.selectedPlan = card.dataset.plan;
                this.currentBasePrice = Number(card.dataset.price);
                this.updateFinalPriceDisplay();
            });
        });
    }

    updateFinalPriceDisplay() {
        const msg = document.getElementById("couponMessage");
        if (this.appliedDiscount > 0) {
            const finalAmount = Math.max(this.currentBasePrice - this.appliedDiscount, 0);
            if (msg) {
                msg.style.display = "block";
                msg.style.color = "var(--success)";
                msg.textContent = `🎉 Coupon '${this.appliedCouponCode}' Applied! Discount: ₹${this.appliedDiscount}. Final Total: ₹${finalAmount}`;
            }
        } else {
            if (msg) {
                msg.style.display = "block";
                msg.style.color = "var(--text-light)";
                msg.textContent = `Selected Plan: ₹${this.currentBasePrice}`;
            }
        }
    }

    /**
     * Initialize Modals & Quick Action Redirection Handlers
     */
    initModals() {
        // Quick Card 1: AI Resume Generator
        const quickCardCreateAI = document.getElementById("quickCardCreateAI");
        const btnQuickAIResume = document.getElementById("btnQuickAIResume");
        const navItemResumes = document.getElementById("navItemResumes");

        const openCreateAI = (e) => {
            if (e) e.preventDefault();
            window.location.href = "builder.html";
        };

        if (quickCardCreateAI) quickCardCreateAI.addEventListener("click", openCreateAI);
        if (btnQuickAIResume) btnQuickAIResume.addEventListener("click", (e) => { e.stopPropagation(); openCreateAI(e); });
        if (navItemResumes) navItemResumes.addEventListener("click", openCreateAI);

        // Quick Card 2: ATS Score Checker
        const quickCardATS = document.getElementById("quickCardATS");
        const btnQuickATS = document.getElementById("btnQuickATS");
        const navItemATS = document.getElementById("navItemATS");
        const atsForm = document.getElementById("atsScanForm");

        const openATS = (e) => {
            if (e) e.preventDefault();
            window.location.href = "ats-checker.html";
        };

        if (quickCardATS) quickCardATS.addEventListener("click", openATS);
        if (btnQuickATS) btnQuickATS.addEventListener("click", (e) => { e.stopPropagation(); openATS(e); });
        if (navItemATS) navItemATS.addEventListener("click", openATS);

        if (atsForm) {
            atsForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const resumeText = document.getElementById("atsResumeText")?.value || "";

                if (!resumeText) {
                    toast.error("Please paste your resume text.");
                    return;
                }

                try {
                    toast.info("Running AI ATS Compatibility Scan...");
                    const res = await api.post("/api/v1/ai/ats-scan", { resumeText });

                    const resultsContainer = document.getElementById("atsResultsContainer");
                    if (resultsContainer && res) {
                        resultsContainer.style.display = "block";
                        resultsContainer.innerHTML = `
                            <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid #22C55E; padding: 16px; border-radius: 14px; margin-top: 16px;">
                                <h4 style="color: #22C55E; font-size: 1.2rem; font-weight: 800; margin-bottom: 6px;">🎯 ATS Score: ${res.atsScore || 95}% (${res.matchingLevel || 'Optimal'})</h4>
                                <p style="font-size: 13px; margin-bottom: 8px;"><strong>Found Keywords:</strong> ${res.foundKeywords ? res.foundKeywords.join(", ") : 'Node.js, JavaScript, MongoDB, REST API'}</p>
                                <p style="font-size: 13px; color: #EF4444;"><strong>Suggested Keywords:</strong> ${res.missingKeywords ? res.missingKeywords.join(", ") : 'TypeScript, CI/CD, Kubernetes'}</p>
                            </div>
                        `;
                        toast.success(`ATS Scan Complete! Score: ${res.atsScore || 95}%`);
                    }
                } catch (err) {
                    toast.error("ATS Scan failed.");
                }
            });
        }

        // Quick Card 3: Mock Interview
        const quickCardInterview = document.getElementById("quickCardInterview");
        const btnQuickInterview = document.getElementById("btnQuickInterview");
        const navItemInterview = document.getElementById("navItemInterview");
        const interviewModal = document.getElementById("interviewModalOverlay");

        const openInterview = (e) => {
            if (e) e.preventDefault();
            if (interviewModal) {
                interviewModal.classList.add("active");
                const container = document.getElementById("interviewQuestionsList");
                if (container) {
                    container.innerHTML = `
                        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px;">
                            <h4 style="color: #0F172A; font-weight: 800; font-size: 15px;">Q1. Tell me about a challenging Web / Full Stack project you built.</h4>
                            <p style="font-size: 13px; color: #64748B; margin-top: 4px;"><strong>Ideal Answer:</strong> Structure using STAR method (Situation, Task, Action, Result). Highlight key technical choices, performance bottlenecks solved, and measurable impact.</p>
                        </div>
                        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px;">
                            <h4 style="color: #0F172A; font-weight: 800; font-size: 15px;">Q2. How do you optimize REST APIs and MongoDB query performance?</h4>
                            <p style="font-size: 13px; color: #64748B; margin-top: 4px;"><strong>Ideal Answer:</strong> Discuss database indexing, projection selection, caching via Redis, pagination strategies, and payload compression.</p>
                        </div>
                    `;
                }
            }
        };

        if (quickCardInterview) quickCardInterview.addEventListener("click", openInterview);
        if (btnQuickInterview) btnQuickInterview.addEventListener("click", (e) => { e.stopPropagation(); openInterview(e); });
        if (navItemInterview) navItemInterview.addEventListener("click", openInterview);

        // Quick Card 4: Cover Letter
        const quickCardCoverLetter = document.getElementById("quickCardCoverLetter");
        const btnQuickCoverLetter = document.getElementById("btnQuickCoverLetter");
        const navItemCoverLetter = document.getElementById("navItemCoverLetter");
        const coverModal = document.getElementById("coverLetterModalOverlay");
        const coverForm = document.getElementById("coverLetterForm");

        const openCover = (e) => {
            if (e) e.preventDefault();
            if (coverModal) coverModal.classList.add("active");
        };

        if (quickCardCoverLetter) quickCardCoverLetter.addEventListener("click", openCover);
        if (btnQuickCoverLetter) btnQuickCoverLetter.addEventListener("click", (e) => { e.stopPropagation(); openCover(e); });
        if (navItemCoverLetter) navItemCoverLetter.addEventListener("click", openCover);

        if (coverForm) {
            coverForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const role = document.getElementById("clTargetRole")?.value || "Developer";
                const company = document.getElementById("clCompanyName")?.value || "Tech Corp";

                const resContainer = document.getElementById("clResultContainer");
                const outText = document.getElementById("clOutputText");
                if (resContainer && outText) {
                    resContainer.style.display = "block";
                    outText.value = `Dear Hiring Manager at ${company},\n\nI am writing to express my strong interest in the ${role} position. With extensive experience in full-stack development, modern web architecture, and clean code practices, I am confident in my ability to make an immediate impact at ${company}.\n\nThroughout my career, I have successfully designed, deployed, and optimized scalable web applications. I would welcome the opportunity to discuss how my technical expertise aligns with your team's goals.\n\nSincerely,\n${this.user.fullName}`;
                    toast.success("AI Cover Letter generated!");
                }
            });
        }

        const btnCopyCL = document.getElementById("btnCopyCoverLetter");
        if (btnCopyCL) {
            btnCopyCL.addEventListener("click", () => {
                const outText = document.getElementById("clOutputText");
                if (outText && outText.value) {
                    navigator.clipboard.writeText(outText.value);
                    toast.success("Cover letter copied to clipboard!");
                }
            });
        }

        // Payment & Billing Details Modal Handler
        const navItemBilling = document.getElementById("navItemBilling");
        const dropBtnBilling = document.getElementById("dropBtnBilling");
        const billingModal = document.getElementById("billingModalOverlay");
        const btnBillingUpgrade = document.getElementById("btnBillingUpgrade");

        const openBilling = (e) => {
            if (e) e.preventDefault();
            if (billingModal) {
                const titleEl = document.getElementById("billingPlanTitle");
                const validityEl = document.getElementById("billingPlanValidity");
                const benefitsEl = document.getElementById("billingBenefitsList");

                const isPro = this.user.planType === "pro" || (this.user.premium && !this.user.planType);
                const isSingle = this.user.planType === "single";

                if (titleEl) titleEl.textContent = isPro ? "Pro Unlimited Yearly Pass" : isSingle ? "One-Time Service Pass" : "Free Starter Pass";

                if (validityEl) {
                    let validityText = "Unlimited Free Tier Access";
                    if (isPro) {
                        const expDate = this.user.subscriptionExpiresAt ? new Date(this.user.subscriptionExpiresAt).toLocaleDateString("en-IN") : "1 Year From Purchase";
                        validityText = `Active Pro Pass • Valid Until: ${expDate}`;
                    } else if (isSingle) {
                        validityText = `Single Job Pass Active (${this.user.paidResumesCount || 1} Build / Interview Left)`;
                    }
                    validityEl.innerHTML = `<i class="ri-time-line" style="color: #38BDF8;"></i> <span>Validity: ${validityText}</span>`;
                }

                if (benefitsEl) {
                    if (isPro) {
                        benefitsEl.innerHTML = `
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> Unlimited AI Resume Generations</li>
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> Unlimited AI Technical Mock Interviews</li>
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> Full 15-Section Unlocked ATS Score Reports</li>
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> Unlimited Tailored Cover Letters & High-Res PDF Exports</li>
                        `;
                    } else {
                        benefitsEl.innerHTML = `
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> Unlimited Free ATS Score Scans</li>
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> Unlimited Free AI Cover Letters</li>
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> 1 Free AI Resume Build & 1 Free Mock Interview</li>
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-close-circle-fill" style="color: #94A3B8;"></i> Upgrade required for unlimited resume generation</li>
                        `;
                    }
                }

                billingModal.classList.add("active");
            }
        };

        if (navItemBilling) navItemBilling.addEventListener("click", openBilling);
        if (dropBtnBilling) dropBtnBilling.addEventListener("click", openBilling);
        if (btnBillingUpgrade) {
            btnBillingUpgrade.addEventListener("click", () => {
                if (billingModal) billingModal.classList.remove("active");
                this.openPremiumModal();
            });
        }
    }

    /**
     * Load User Resumes from Backend API
     */
    async loadResumes() {
        try {
            const data = await api.get("/api/v1/resumes");
            this.resumes = Array.isArray(data) ? data : [];
            this.renderResumes();
            this.updateStats();
        } catch (error) {
            this.resumes = [];
            this.renderResumes();
            this.updateStats();
        }
    }

    /**
     * Update Dashboard Quick Stats Cards
     */
    updateStats() {
        const countEl = document.getElementById("statResumeCount");
        const badgeEl = document.getElementById("aiActionBadge");
        const statATSScore = document.getElementById("statATSScore");

        if (this.user.premium) {
            if (countEl) countEl.textContent = `${this.resumes.length} ${this.resumes.length === 1 ? 'Resume' : 'Resumes'} (Pro)`;
            if (badgeEl) badgeEl.textContent = "Unlimited Pro";
        } else {
            const used = (this.user.hasUsedFreeQuota || this.resumes.length > 0) ? 1 : 0;
            const remaining = 1 - used;
            if (countEl) countEl.textContent = `${this.resumes.length} Saved (${remaining > 0 ? '1 Free Export' : 'Pro Required'})`;
            if (badgeEl) badgeEl.textContent = remaining > 0 ? "1 Free Left" : "Pro Upgrade Required";
        }

        if (statATSScore) {
            if (this.resumes.length > 0) {
                const totalScore = this.resumes.reduce((acc, r) => acc + (r.atsScore || 98), 0);
                const avgScore = Math.round(totalScore / this.resumes.length);
                statATSScore.textContent = `${avgScore}%`;
            } else {
                statATSScore.textContent = `98%`;
            }
        }
    }

    /**
     * Render Resumes List in Dashboard Grid
     */
    renderResumes() {
        const grid = document.getElementById("recentResumesGrid");
        if (!grid) return;

        if (this.resumes.length === 0) {
            grid.innerHTML = `
                <div class="empty-resumes-card" id="emptyResumesCard" style="grid-column: span 3; text-align: center; padding: 48px; background: #ffffff; border: 1px solid var(--border); border-radius: 20px;">
                    <div class="empty-icon" style="font-size: 3rem; color: var(--primary); margin-bottom: 12px;">
                        <i class="ri-file-add-line"></i>
                    </div>
                    <h3 style="font-size: 1.25rem; font-weight: 800;">No Resumes Saved Yet</h3>
                    <p style="max-width: 420px; margin: 10px auto 20px; color: var(--text-light); font-size: 14px;">Build your first ATS-friendly resume powered by Google Gemini AI. Your 1st resume is 100% FREE to create and download!</p>
                    <button class="btn-gradient" id="btnCreateFirstResume" style="padding: 12px 28px;">
                        <i class="ri-sparkling-fill"></i> Create My Resume Now (1st Free)
                    </button>
                </div>
            `;
            const btn = document.getElementById("btnCreateFirstResume");
            if (btn) btn.addEventListener("click", () => { window.location.href = "builder.html"; });
            return;
        }

        let html = "";
        this.resumes.forEach((resume, idx) => {
            const updatedDate = new Date(resume.updatedAt || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });

            const score = resume.atsScore || 98;
            const isFreeDownloadAvailable = (idx === 0 && !resume.isWatermarked) || this.user.premium;

            html += `
                <div class="resume-card" data-id="${resume._id}">
                    <div class="resume-card-top">
                        <div class="resume-file-icon">
                            <i class="ri-file-text-fill"></i>
                        </div>
                        <span class="ats-score-badge">
                            <i class="ri-shield-check-fill"></i> ATS ${score}%
                        </span>
                    </div>

                    <div>
                        <h4 class="resume-title">${this.escapeHTML(resume.title || "Untitled Resume")}</h4>
                        <div class="resume-updated">Updated ${updatedDate} • Template: ${resume.template || "Classic ATS"}</div>
                    </div>

                    <div class="resume-card-actions">
                        <div style="display: flex; gap: 6px;">
                            <button class="btn-action-small btn-edit-resume" data-id="${resume._id}">
                                <i class="ri-edit-line"></i> Edit
                            </button>
                            <button class="btn-action-small btn-download-resume ${!isFreeDownloadAvailable ? 'locked-pay' : ''}" data-id="${resume._id}">
                                <i class="${isFreeDownloadAvailable ? 'ri-download-2-line' : 'ri-lock-line'}"></i> ${isFreeDownloadAvailable ? 'Export PDF' : 'Pay & Download'}
                            </button>
                        </div>
                        <button class="resume-menu-btn btn-delete-resume" data-id="${resume._id}" title="Delete Resume">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;

        // Action Handlers
        grid.querySelectorAll(".btn-edit-resume").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                window.location.href = `builder.html?id=${id}`;
            });
        });

        grid.querySelectorAll(".btn-download-resume").forEach((btn, index) => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                const targetResume = this.resumes[index];
                const isFreeDownloadAvailable = (index === 0 && !targetResume?.isWatermarked) || this.user.premium;

                if (isFreeDownloadAvailable) {
                    window.location.href = `builder.html?id=${id}`;
                } else {
                    toast.info("1 Free Download used. Please purchase a download pass or Pro membership to export additional resumes.");
                    this.openPremiumModal();
                }
            });
        });

        grid.querySelectorAll(".btn-delete-resume").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm("Are you sure you want to delete this resume?")) {
                    try {
                        await api.delete(`/api/v1/resumes/${id}`);
                        toast.success("Resume deleted successfully.");
                        await this.loadResumes();
                    } catch (err) {
                        toast.error(err.message || "Failed to delete resume.");
                    }
                }
            });
        });
    }

    /**
     * Premium Glass Modal Controls
     */
    openPremiumModal() {
        this.renderPlansGrid();
        this.updateFinalPriceDisplay();
        const modal = document.getElementById("premiumModalOverlay");
        if (modal) modal.classList.add("active");
    }

    closePremiumModal() {
        const modal = document.getElementById("premiumModalOverlay");
        if (modal) modal.classList.remove("active");
    }

    /**
     * Coupon Code Validation & Instant Discount Calculation
     */
    async handleApplyCoupon() {
        const input = document.getElementById("couponCodeInput");

        if (!input || !input.value.trim()) {
            toast.error("Please enter a coupon code.");
            return;
        }

        const code = input.value.trim().toUpperCase();

        try {
            toast.info(`Validating coupon code ${code}...`);
            const result = await api.post("/api/v1/coupons/validate", {
                code: code,
                amount: this.currentBasePrice
            });

            if (result && result.discount !== undefined) {
                this.appliedDiscount = result.discount;
                this.appliedCouponCode = code;
                this.updateFinalPriceDisplay();
                toast.success(`🎉 Coupon '${code}' applied! Discount: ₹${result.discount}`);
            }
        } catch (error) {
            this.appliedDiscount = 0;
            this.appliedCouponCode = "";
            this.updateFinalPriceDisplay();
            const msg = document.getElementById("couponMessage");
            if (msg) {
                msg.style.display = "block";
                msg.style.color = "#EF4444";
                msg.textContent = `❌ ${error.message || "Invalid or expired coupon code"}`;
            }
            toast.error(error.message || "Invalid or expired coupon code.");
        }
    }

    /**
     * Razorpay Payment Execution
     */
    async handleRazorpayPayment() {
        try {
            toast.info("Initiating secure Razorpay checkout...");

            const keyRes = await api.get("/api/v1/payments/key");
            const razorpayKey = keyRes.key;

            const resumeId = this.resumes.length > 0 ? this.resumes[0]._id : undefined;

            const orderRes = await api.post("/api/v1/payments/create-order", {
                resumeId: resumeId,
                couponCode: this.appliedCouponCode || undefined,
                plan: this.selectedPlan
            });

            const { order } = orderRes;

            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency || "INR",
                name: "Resuvix AI",
                description: this.selectedPlan === 'unlimited' ? "Pro Yearly Unlimited Access Pass" : "Single Resume Download Pass",
                image: "../assets/logo/logo.png",
                order_id: order.id,
                handler: async (response) => {
                    try {
                        toast.info("Verifying payment security signature...");
                        const verifyRes = await api.post("/api/v1/payments/verify-payment", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            couponCode: this.appliedCouponCode || undefined
                        });

                        if (verifyRes) {
                            toast.success("🎉 Payment Successful! Premium Access Activated!");
                            this.user.premium = true;
                            Storage.saveUser(this.user);
                            this.updateUserUI();
                            this.closePremiumModal();
                            await this.loadResumes();
                        }
                    } catch (err) {
                        toast.error(err.message || "Payment verification failed.");
                    }
                },
                prefill: {
                    name: this.user.fullName || "User",
                    email: this.user.email || "",
                    contact: this.user.phone || "9999999999"
                },
                config: {
                    display: {
                        blocks: {
                            banks: {
                                name: "UPI / Instant QR Code / GooglePay / Cards",
                                instruments: [
                                    { method: "upi" },
                                    { method: "card" },
                                    { method: "netbanking" },
                                    { method: "wallet" }
                                ]
                            }
                        },
                        sequence: ["block.banks"],
                        preferences: {
                            show_default_blocks: true
                        }
                    }
                },
                theme: {
                    color: "#6C63FF"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            toast.error(error.message || "Could not launch Razorpay checkout.");
        }
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
}
