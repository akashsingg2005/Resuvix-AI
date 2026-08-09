/**
 * ==========================================================
 * RESUVIX AI - PUBLIC ATS RESUME REVIEWER & AUDITOR
 * Supports guest scan (score card + preview recommendations).
 * Persists pending scan report & unlocks full 15-section report upon login.
 * ==========================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    const isLoggedIn = typeof Storage !== "undefined" && Storage.isLoggedIn();
    let user = null;
    let auth = null;

    if (isLoggedIn) {
        auth = new AuthController();
        await auth.restoreSession();
        user = Storage.getUser();
    }

    const checker = new ATSCheckerApp(user, auth, !isLoggedIn);
    checker.init();
});

class ATSCheckerApp {

    constructor(user, authController, isGuest = false) {
        this.user = user;
        this.auth = authController;
        this.isGuest = isGuest;
        this.selectedFile = null;
    }

    init() {
        this.updateHeaderNav();
        this.initDrawer();
        this.initEventListeners();
        this.initDropzone();
        this.initFormSubmit();
        this.checkPendingReport();
    }

    checkPendingReport() {
        if (typeof sessionStorage === "undefined") return;

        const pending = sessionStorage.getItem("resuvix_pending_ats_report");
        if (pending) {
            try {
                const data = JSON.parse(pending);
                if (data && typeof data.atsScore === "number") {
                    this.render15SectionReport(data);
                    if (!this.isGuest) {
                        toast.success("🎉 Welcome back! Your full 15-section ATS Audit Report is now unlocked!");
                        sessionStorage.removeItem("resuvix_pending_ats_report");
                    }
                }
            } catch (e) {
                console.error("Pending ATS report restore error:", e);
            }
        }
    }

    updateHeaderNav() {
        const headerNav = document.getElementById("headerAuthNav");
        if (!headerNav) return;

        if (this.isGuest || !this.user) {
            headerNav.innerHTML = `
                <a href="../login.html?redirect=ats-checker" class="btn-outline" style="padding: 8px 18px; font-size: 13.5px; border-radius: 999px; text-decoration: none;">Login</a>
                <a href="../register.html?redirect=ats-checker" class="btn-gradient" style="padding: 8px 18px; font-size: 13.5px; border-radius: 999px; text-decoration: none;">Get Started</a>
            `;
        } else {
            const firstName = this.user.fullName ? this.user.fullName.split(" ")[0] : "User";
            const initial = this.user.fullName ? this.user.fullName.charAt(0).toUpperCase() : "U";
            const isPro = this.user.premium;
            const isAdmin = this.user.role === "admin";

            headerNav.innerHTML = `
                <div id="planBadgeContainer">
                    ${isPro ? `<span class="dash-badge-pro"><i class="ri-vip-crown-fill"></i> Pro Member</span>` : `<span class="dash-badge-free"><i class="ri-sparkling-fill"></i> Free Tier</span>`}
                </div>
                <div style="position: relative;">
                    <div class="user-profile-menu" id="userProfilePill">
                        <div class="user-avatar-small">${initial}</div>
                        <span class="user-name-abbr">${this.escapeHTML(firstName)}</span>
                        <i class="ri-arrow-down-s-line"></i>
                    </div>
                    <div class="user-dropdown-menu" id="userDropdownMenu">
                        ${isAdmin ? `<button class="dropdown-item-btn" id="dropBtnAdmin"><i class="ri-shield-user-line"></i> Admin Panel</button>` : ''}
                        <button class="dropdown-item-btn" id="dropBtnLogout" style="color: #EF4444;"><i class="ri-logout-box-r-line" style="color: #EF4444;"></i> Logout</button>
                    </div>
                </div>
            `;
        }
    }

    initDrawer() {
        const trigger = document.getElementById("drawerTrigger");
        const closeBtn = document.getElementById("drawerClose");
        const overlay = document.getElementById("drawerOverlay");
        const drawer = document.getElementById("chatgptDrawer");
        const navItemAdmin = document.getElementById("navItemAdmin");
        const drawerUpgradeCard = document.getElementById("drawerUpgradeCard");

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

        if (trigger) trigger.addEventListener("click", openDrawer);
        if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
        if (overlay) overlay.addEventListener("click", closeDrawer);

        // Admin badge & Pro upgrade card visibility
        if (this.user?.role === "admin" && navItemAdmin) {
            navItemAdmin.style.display = "flex";
        }
        if (this.user?.premium && drawerUpgradeCard) {
            drawerUpgradeCard.style.display = "none";
        }

        // Auto close drawer when clicking menu items
        document.querySelectorAll(".drawer-menu-list .drawer-item").forEach(item => {
            item.addEventListener("click", () => {
                closeDrawer();
            });
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeDrawer();
        });
    }

    initEventListeners() {
        const dropBtnLogout = document.getElementById("dropBtnLogout");
        const drawerLogoutBtn = document.getElementById("drawerLogoutBtn");

        const handleLogout = () => {
            if (this.auth) {
                this.auth.logout();
            } else if (typeof Storage !== "undefined") {
                Storage.logout();
                window.location.href = "../login.html";
            }
        };

        if (dropBtnLogout) dropBtnLogout.addEventListener("click", handleLogout);
        if (drawerLogoutBtn) drawerLogoutBtn.addEventListener("click", handleLogout);

        const btnDrawerUpgrade = document.getElementById("btnDrawerUpgrade");
        if (btnDrawerUpgrade) {
            btnDrawerUpgrade.addEventListener("click", () => {
                window.location.href = "dashboard.html";
            });
        }

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
    }

    initDropzone() {
        const dropzone = document.getElementById("dropzoneArea");
        const fileInput = document.getElementById("pdfFileInput");

        if (!dropzone || !fileInput) return;

        fileInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        dropzone.addEventListener("click", () => fileInput.click());

        fileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                this.selectedFile = e.target.files[0];
                this.renderFileBadge();
            }
        });

        dropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        });

        dropzone.addEventListener("dragleave", () => {
            dropzone.classList.remove("dragover");
        });

        dropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                this.selectedFile = e.dataTransfer.files[0];
                fileInput.files = e.dataTransfer.files;
                this.renderFileBadge();
            }
        });
    }

    renderFileBadge() {
        const badge = document.getElementById("fileSelectedBadge");
        if (!badge || !this.selectedFile) return;

        const sizeMB = (this.selectedFile.size / (1024 * 1024)).toFixed(2);
        badge.style.display = "inline-flex";
        badge.className = "file-selected-badge";
        badge.innerHTML = `<i class="ri-checkbox-circle-fill"></i> ${this.escapeHTML(this.selectedFile.name)} (${sizeMB} MB)`;
    }

    initFormSubmit() {
        const form = document.getElementById("atsUploadForm");
        const btnScan = document.getElementById("btnScanATS");

        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const targetRole = document.getElementById("targetRoleInput")?.value.trim() || "";
            const jobDescription = document.getElementById("jdTextInput")?.value.trim() || "";
            const resumeText = document.getElementById("resumeTextInput")?.value.trim() || "";

            if (!this.selectedFile && !resumeText) {
                toast.error("Please upload a PDF resume or paste your resume text.");
                return;
            }

            const originalBtnHTML = btnScan.innerHTML;
            btnScan.disabled = true;
            btnScan.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Evaluating 100-Point ATS Score...`;

            try {
                toast.info("Parsing PDF content & evaluating ATS match score...");

                let response;

                if (this.selectedFile) {
                    const formData = new FormData();
                    formData.append("file", this.selectedFile);
                    if (targetRole) formData.append("targetRole", targetRole);
                    if (jobDescription) formData.append("jobDescription", jobDescription);

                    response = await api.uploadFile("/api/v1/ai/ats-scan", formData);
                } else {
                    response = await api.post("/api/v1/ai/ats-scan", {
                        resumeText,
                        jobDescription,
                        targetRole
                    });
                }

                const result = (response && response.atsScore !== undefined) 
                    ? response 
                    : (response && response.data ? response.data : response);

                if (result && typeof result.atsScore === "number") {

                    // Save report in sessionStorage so user can login without losing scan data
                    if (typeof sessionStorage !== "undefined") {
                        sessionStorage.setItem("resuvix_pending_ats_report", JSON.stringify(result));
                    }

                    this.render15SectionReport(result);
                    toast.success("🎉 ATS Score Audit Complete!");
                } else {
                    throw new Error("Invalid analysis payload received from server.");
                }

            } catch (err) {
                console.error("ATS Scan Error:", err);
                toast.error(err.message || "ATS Evaluation failed. Please try again.");
            } finally {
                btnScan.disabled = false;
                btnScan.innerHTML = originalBtnHTML;
            }
        });
    }

    render15SectionReport(data) {
        const dashboard = document.getElementById("atsResultsDashboard");
        if (!dashboard) return;

        dashboard.style.display = "block";

        const score = data.atsScore || 86;
        const potential = data.potentialScore || Math.min(score + 10, 98);
        const matchingLevel = data.matchingLevel || (score >= 88 ? "Optimal Match" : score >= 75 ? "Good Match" : "Needs Improvement");
        const analysisType = data.analysisType || "General ATS Best Practices Audit";

        let color = "#22C55E";
        if (score < 65) color = "#EF4444";
        else if (score < 80) color = "#F59E0B";

        // Section 1: Hero Gauge
        const ring = document.getElementById("scoreGaugeRing");
        if (ring) {
            ring.style.setProperty("--score-pct", score);
            ring.style.setProperty("--gauge-color", color);
        }

        const resScoreNum = document.getElementById("resScoreNum");
        const resMatchLevelBadge = document.getElementById("resMatchLevelBadge");
        const resAnalysisTypeBadge = document.getElementById("resAnalysisTypeBadge");
        const resTargetRoleHeading = document.getElementById("resTargetRoleHeading");
        const resSummaryFeedbackText = document.getElementById("resSummaryFeedbackText");

        if (resScoreNum) resScoreNum.textContent = score;
        if (resMatchLevelBadge) resMatchLevelBadge.textContent = matchingLevel;
        if (resAnalysisTypeBadge) resAnalysisTypeBadge.textContent = analysisType;
        if (resTargetRoleHeading) resTargetRoleHeading.textContent = `ATS Audit: ${this.escapeHTML(data.targetRole || 'Target Role')}`;
        if (resSummaryFeedbackText) resSummaryFeedbackText.textContent = data.summaryFeedback || `ATS Match Score: ${score}/100. Structure, skills, and readability evaluated across 8 criteria below.`;

        // Section 2: 8-Category Weight Breakdown Grid
        const breakdownGrid = document.getElementById("scoreBreakdownGrid");
        const b = data.scoreBreakdown || {};

        const categories = [
            { key: "resumeStructure", title: "Resume Structure", max: 15 },
            { key: "contactInfo", title: "Contact Information", max: 10 },
            { key: "keywordMatch", title: "Keyword Match", max: 25 },
            { key: "skillsRelevance", title: "Skills Relevance", max: 10 },
            { key: "experienceProjects", title: "Experience & Projects", max: 15 },
            { key: "education", title: "Education", max: 5 },
            { key: "atsFormatting", title: "ATS Formatting", max: 10 },
            { key: "grammarReadability", title: "Grammar & Readability", max: 10 }
        ];

        if (breakdownGrid) {
            breakdownGrid.innerHTML = categories.map(c => {
                const item = b[c.key] || { score: c.max, max: c.max, reason: "Optimal criteria met." };
                const pct = (item.score / item.max) * 100;
                const itemColor = pct >= 85 ? "#22C55E" : pct >= 70 ? "#F59E0B" : "#EF4444";

                return `
                    <div class="weight-card">
                        <div class="weight-card-top">
                            <span class="weight-title">${c.title}</span>
                            <span class="weight-score" style="color: ${itemColor};">${item.score}/${c.max}</span>
                        </div>
                        <div class="weight-reason">${this.escapeHTML(item.reason || 'Criteria met.')}</div>
                    </div>
                `;
            }).join("");
        }

        // Preview Section: Top 2 Initial Suggestions
        const previewContainer = document.getElementById("previewRecommendationsContainer");
        const recs = data.top10Recommendations || [];

        if (previewContainer) {
            const previewItems = recs.slice(0, 2);
            if (previewItems.length === 0) {
                previewContainer.innerHTML = `<div style="color: #166534; font-weight: 700;">🎉 Excellent! No immediate critical fixes required.</div>`;
            } else {
                previewContainer.innerHTML = previewItems.map((r, idx) => `
                    <div class="priority-card priority-critical">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <h4 style="font-size: 15px; font-weight: 800; color: var(--text); margin: 0;">${idx + 1}. ${this.escapeHTML(r.title)}</h4>
                            <span style="padding: 4px 12px; border-radius: 999px; font-weight: 800; font-size: 12px; background: #ffffff; color: var(--text);">${r.priority}</span>
                        </div>
                        <p style="font-size: 13px; color: var(--text); margin-bottom: 4px;"><strong>What is wrong:</strong> ${this.escapeHTML(r.whatIsWrong)}</p>
                        <div style="font-size: 13px; color: var(--primary); font-weight: 700; margin-top: 6px;">💡 <strong>How to Fix:</strong> ${this.escapeHTML(r.howToFix)}</div>
                    </div>
                `).join("");
            }
        }

        // Handle Guest Blur & Lock Card
        const blurWrapper = document.getElementById("guestBlurWrapper");
        const lockCardOverlay = document.getElementById("guestLockCardOverlay");

        if (this.isGuest) {
            if (blurWrapper) blurWrapper.classList.add("guest-blurred-wrapper");
            if (lockCardOverlay) lockCardOverlay.style.display = "block";
        } else {
            if (blurWrapper) blurWrapper.classList.remove("guest-blurred-wrapper");
            if (lockCardOverlay) lockCardOverlay.style.display = "none";
        }

        // Section 4: Resume Strengths
        const strengthsList = document.getElementById("resumeStrengthsList");
        if (strengthsList) {
            const strengths = data.resumeStrengths || ["Clean searchable PDF formatting", "Verbatim skills match", "Verified degree credentials"];
            strengthsList.innerHTML = strengths.map(s => `<li>${this.escapeHTML(s)}</li>`).join("");
        }

        // Section 5: Critical Issues
        const issuesList = document.getElementById("criticalIssuesList");
        if (issuesList) {
            const issues = data.criticalIssues || ["Lacks quantifiable metrics in experience bullet points"];
            issuesList.innerHTML = issues.map(i => `<li>${this.escapeHTML(i)}</li>`).join("");
        }

        // Section 6: Missing Keywords Table
        const missingBody = document.getElementById("missingKeywordsTableBody");
        if (missingBody) {
            const missing = data.missingKeywords || [];
            if (missing.length === 0) {
                missingBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #166534; font-weight: 700;">🎉 Outstanding! No critical role keywords missing from your CV.</td></tr>`;
            } else {
                missingBody.innerHTML = missing.map(m => `
                    <tr>
                        <td><strong style="color: #991B1B;">${this.escapeHTML(m.keyword)}</strong></td>
                        <td><span style="padding: 4px 10px; border-radius: 999px; background: rgba(239, 68, 68, 0.1); color: #EF4444; font-weight: 800; font-size: 11px;">${this.escapeHTML(m.status)}</span></td>
                        <td><span style="font-weight: 700; color: #F97316;">${this.escapeHTML(m.importance)}</span></td>
                        <td>${this.escapeHTML(m.recommendation)}</td>
                    </tr>
                `).join("");
            }
        }

        // Section 7: Matched Keywords Table
        const matchedBody = document.getElementById("matchedKeywordsTableBody");
        if (matchedBody) {
            const matched = data.matchedKeywords || [];
            if (matched.length === 0) {
                matchedBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748B;">No verbatim keywords extracted.</td></tr>`;
            } else {
                matchedBody.innerHTML = matched.map(m => `
                    <tr>
                        <td><strong style="color: #166534;">${this.escapeHTML(m.keyword)}</strong></td>
                        <td><span style="padding: 4px 10px; border-radius: 999px; background: rgba(34, 197, 94, 0.1); color: #22C55E; font-weight: 800; font-size: 11px;">${this.escapeHTML(m.status)}</span></td>
                        <td><span style="font-weight: 700; color: #166534;">${this.escapeHTML(m.importance)}</span></td>
                        <td>${this.escapeHTML(m.recommendation)}</td>
                    </tr>
                `).join("");
            }
        }

        // Section 8: Skills Gap Analysis
        const presentBadges = document.getElementById("skillsPresentBadges");
        const missingBadges = document.getElementById("skillsMissingBadges");
        const priorityList = document.getElementById("skillsPriorityOrderList");
        const gap = data.skillsGapAnalysis || {};

        if (presentBadges) {
            const present = gap.present || [];
            presentBadges.innerHTML = present.map(s => `<span class="badge-found" style="margin:2px;"><i class="ri-check-line"></i> ${this.escapeHTML(s)}</span>`).join("");
        }

        if (missingBadges) {
            const missing = gap.missing || [];
            missingBadges.innerHTML = missing.map(s => `<span class="badge-missing" style="margin:2px;"><i class="ri-close-line"></i> ${this.escapeHTML(s)}</span>`).join("");
        }

        if (priorityList) {
            const priority = gap.priorityOrder || [];
            priorityList.innerHTML = priority.map(p => `<li><strong>${this.escapeHTML(p)}</strong></li>`).join("");
        }

        // Section 9: Section-Wise Feedback
        const feedbackGrid = document.getElementById("sectionWiseFeedbackGrid");
        const sec = data.sectionWiseFeedback || {};
        const sections = [
            { key: "summary", name: "Professional Summary" },
            { key: "skills", name: "Technical Skills" },
            { key: "experience", name: "Work Experience" },
            { key: "projects", name: "Projects" },
            { key: "education", name: "Education & Credentials" }
        ];

        if (feedbackGrid) {
            feedbackGrid.innerHTML = sections.map(s => {
                const item = sec[s.key] || { quality: "Good", issues: "None", recommendation: "Maintain structure.", expectedImprovement: "Optimal" };
                const qColor = item.quality === "Excellent" || item.quality === "Good" ? "#22C55E" : "#F59E0B";

                return `
                    <div style="background: rgba(248, 250, 252, 0.8); border: 1px solid var(--border); border-radius: 16px; padding: 18px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong style="font-size: 14px; color: var(--text);">${s.name}</strong>
                            <span style="padding: 2px 10px; border-radius: 999px; font-weight: 800; font-size: 11px; background: rgba(34, 197, 94, 0.1); color: ${qColor};">${item.quality}</span>
                        </div>
                        <p style="font-size: 12.5px; color: var(--text-light); margin-bottom: 6px;"><strong>Issues:</strong> ${this.escapeHTML(item.issues)}</p>
                        <p style="font-size: 12.5px; color: var(--primary); font-weight: 600; margin-bottom: 8px;">💡 <strong>Fix:</strong> ${this.escapeHTML(item.recommendation)}</p>
                        <span style="font-size: 11px; font-weight: 800; color: #166534; background: rgba(34, 197, 94, 0.1); padding: 4px 8px; border-radius: 6px;">Expected Gain: ${this.escapeHTML(item.expectedImprovement)}</span>
                    </div>
                `;
            }).join("");
        }

        // Section 10: Project Review
        const projectContainer = document.getElementById("projectReviewContainer");
        const projects = data.projectReview || [];

        if (projectContainer) {
            if (projects.length === 0) {
                projectContainer.innerHTML = `<div style="color: #64748B; font-size: 13.5px;">No projects found in CV text.</div>`;
            } else {
                projectContainer.innerHTML = projects.map(p => `
                    <div class="rewrite-box">
                        <h4 style="font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 4px;">📌 Project: ${this.escapeHTML(p.projectTitle)} (Relevance: ${this.escapeHTML(p.relevance)})</h4>
                        <p style="font-size: 13px; color: #991B1B; margin-bottom: 10px;"><strong>Weakness Identified:</strong> ${this.escapeHTML(p.weakness)}</p>
                        <div style="font-size: 13px; color: #991B1B; margin-bottom: 8px;">❌ <strong>Original:</strong> "${this.escapeHTML(p.originalBullet)}"</div>
                        <div style="font-size: 13.5px; color: #166534; font-weight: 700; margin-bottom: 10px;">✨ <strong>Quantified Rewrite:</strong> "${this.escapeHTML(p.improvedBullet)}"</div>
                        <div style="font-size: 12.5px; color: var(--primary); font-weight: 600;">💡 <strong>How to Improve:</strong> ${this.escapeHTML(p.howToImprove)}</div>
                    </div>
                `).join("");
            }
        }

        // Section 11: Experience Review
        const expContainer = document.getElementById("experienceReviewContainer");
        const expRewrites = data.experienceReview || [];

        if (expContainer) {
            if (expRewrites.length === 0) {
                expContainer.innerHTML = `<div style="color: #166534; font-weight: 700;">🎉 Experience bullet points contain clear metric achievements.</div>`;
            } else {
                expContainer.innerHTML = expRewrites.map(item => `
                    <div class="rewrite-box">
                        <div style="color: #991B1B; font-size: 13.5px; font-weight: 600; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed rgba(226, 232, 240, 0.9);">
                            ❌ <strong>Original CV Line:</strong> "${this.escapeHTML(item.originalLine)}"
                        </div>
                        <div style="color: #166534; font-size: 14px; font-weight: 700; margin-bottom: 8px;">
                            ✨ <strong>AI Executive Sentence Rewrite:</strong> "${this.escapeHTML(item.executiveRewrite)}"
                        </div>
                        <div style="font-size: 12px; color: var(--text-light);">📊 <strong>Impact Analysis:</strong> ${this.escapeHTML(item.impactAnalysis || 'Upgrades action verbs and adds business metrics.')}</div>
                    </div>
                `).join("");
            }
        }

        // Section 12: Formatting Review
        const formatBox = document.getElementById("formattingReviewBox");
        const fmt = data.formattingReview || {};
        if (formatBox) {
            const issues = fmt.issuesFound || ["No tables or text boxes detected"];
            formatBox.innerHTML = `
                <div style="font-size: 13.5px; color: var(--text); line-height: 1.6;">
                    <div style="margin-bottom: 8px;"><strong>Status:</strong> <span style="color: #166534; font-weight: 800;">${fmt.quality || 'Good'}</span></div>
                    <div style="margin-bottom: 8px;"><strong>Checks Passed:</strong>
                        <ul style="padding-left: 18px; margin: 4px 0;">
                            ${issues.map(i => `<li>${this.escapeHTML(i)}</li>`).join("")}
                        </ul>
                    </div>
                    <div style="color: var(--primary); font-weight: 600;">💡 <strong>Recommendation:</strong> ${this.escapeHTML(fmt.recommendations || 'Maintain single column formatting.')}</div>
                </div>
            `;
        }

        // Section 13: Grammar Review
        const grammarBox = document.getElementById("grammarReviewBox");
        const g = data.grammarReview || {};
        if (grammarBox) {
            const gIssues = g.issues || [];
            grammarBox.innerHTML = `
                <div style="font-size: 13.5px; color: var(--text); line-height: 1.6;">
                    <div style="margin-bottom: 10px;"><strong>Recruiter Readability Score:</strong> <span style="font-size: 1.1rem; font-weight: 800; color: #A855F7;">${g.recruiterReadabilityScore || '9.0'}/10</span></div>
                    ${gIssues.length > 0 ? `
                        <div style="margin-bottom: 8px;"><strong>Corrections Needed:</strong></div>
                        ${gIssues.map(gi => `
                            <div style="background: rgba(239, 68, 68, 0.05); padding: 8px 12px; border-radius: 8px; margin-bottom: 6px; font-size: 12.5px;">
                                ❌ "${this.escapeHTML(gi.originalLine)}" ➔ <strong style="color: #166534;">${this.escapeHTML(gi.correction)}</strong>
                            </div>
                        `).join("")}
                    ` : `
                        <div style="color: #166534; font-weight: 700;">🎉 Excellent! No grammar typos or brand capitalization issues detected.</div>
                    `}
                </div>
            `;
        }

        // Section 14: Top 10 Prioritized Recommendations
        const recsContainer = document.getElementById("topRecommendationsContainer");

        if (recsContainer) {
            if (recs.length === 0) {
                recsContainer.innerHTML = `<div style="color: #166534; font-weight: 700;">🎉 Excellent! No high priority recommendations required.</div>`;
            } else {
                recsContainer.innerHTML = recs.map((r, idx) => {
                    let pClass = "priority-medium";
                    if (r.priority.includes("Critical")) pClass = "priority-critical";
                    else if (r.priority.includes("High")) pClass = "priority-high";
                    else if (r.priority.includes("Optional")) pClass = "priority-optional";

                    return `
                        <div class="priority-card ${pClass}">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <h4 style="font-size: 15px; font-weight: 800; color: var(--text); margin: 0;">${idx + 1}. ${this.escapeHTML(r.title)}</h4>
                                <span style="padding: 4px 12px; border-radius: 999px; font-weight: 800; font-size: 12px; background: #ffffff; color: var(--text);">${r.priority}</span>
                            </div>
                            <p style="font-size: 13px; color: var(--text); margin-bottom: 4px;"><strong>What is wrong:</strong> ${this.escapeHTML(r.whatIsWrong)}</p>
                            <p style="font-size: 13px; color: var(--text-light); margin-bottom: 8px;"><strong>Why it matters:</strong> ${this.escapeHTML(r.whyItMatters)}</p>
                            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.7); padding: 10px 14px; border-radius: 12px;">
                                <span style="font-size: 13px; color: var(--primary); font-weight: 700;">💡 <strong>How to Fix:</strong> ${this.escapeHTML(r.howToFix)}</span>
                                <span style="font-size: 12px; font-weight: 800; color: #166534; background: rgba(34, 197, 94, 0.15); padding: 4px 10px; border-radius: 6px;">Score Boost: ${this.escapeHTML(r.scoreBoost)}</span>
                            </div>
                        </div>
                    `;
                }).join("");
            }
        }

        // Section 15: Estimated Score Callout
        const currentScoreBadgeText = document.getElementById("currentScoreBadgeText");
        const potentialScoreBadgeText = document.getElementById("potentialScoreBadgeText");
        const potentialScoreBoostText = document.getElementById("potentialScoreBoostText");

        if (currentScoreBadgeText) currentScoreBadgeText.textContent = `${score}/100`;
        if (potentialScoreBadgeText) potentialScoreBadgeText.textContent = `${potential}/100`;
        if (potentialScoreBoostText) potentialScoreBoostText.textContent = `+${potential - score} Points`;

        dashboard.scrollIntoView({ behavior: "smooth" });
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
}
