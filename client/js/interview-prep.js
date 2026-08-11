/**
 * ==========================================================
 * RESUVIX AI - ROLE-AGNOSTIC INTERVIEW PREPARATION ENGINE
 * Handles multi-career setups (Technical & Non-Technical),
 * ATS Transfer, Voice Input, Dynamic Follow-Up Dialogs,
 * Comprehensive Reports, and Unified Razorpay Payment System.
 * ==========================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    if (!Storage.isLoggedIn()) {
        window.location.href = "../login.html?redirect=interview-prep";
        return;
    }

    const auth = new AuthController();
    try {
        await auth.restoreSession();
    } catch (e) {
        console.warn("Session restore warning:", e.message);
    }

    let currentUser = Storage.getUser();
    if (!currentUser && Storage.getAccessToken()) {
        currentUser = { fullName: "User", email: "" };
    } else if (!currentUser) {
        window.location.href = "../login.html?redirect=interview-prep";
        return;
    }

    const app = new RoleAgnosticInterviewApp(currentUser, auth);
    await app.init();
});

class RoleAgnosticInterviewApp {

    constructor(user, auth) {
        this.user = user;
        this.auth = auth;
        this.currentInterview = null;
        this.currentQuestionIdx = 0;
        this.isRecording = false;
        this.recognition = null;
        this.atsTransferData = null;

        // Unified Pricing State (Identical to Dashboard & Builder)
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
        this.initRolePills();
        this.initSpeechRecognition();
        await this.fetchSettings();
        await this.loadSavedResumes();
        this.checkATSTransfer();
        await this.loadHistory();
    }

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

    updateUserUI() {
        const userNameText = document.getElementById("userNameText");
        const userAvatarText = document.getElementById("userAvatarText");
        const planBadgeContainer = document.getElementById("planBadgeContainer");
        const navItemAdmin = document.getElementById("navItemAdmin");
        const dropBtnAdmin = document.getElementById("dropBtnAdmin");
        const drawerUpgradeCard = document.getElementById("drawerUpgradeCard");

        if (this.user) {
            let displayName = "";
            if (this.user.fullName && this.user.fullName !== "User" && this.user.fullName !== "Account") {
                displayName = this.user.fullName;
            } else if (this.user.email) {
                const prefix = this.user.email.split("@")[0];
                displayName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            }
            if (!displayName) displayName = "User";

            const firstName = displayName.split(" ")[0];
            const initial = firstName.charAt(0).toUpperCase();

            if (userNameText) userNameText.textContent = firstName;
            if (userAvatarText) userAvatarText.textContent = initial;

            if (this.user.role === "admin" || this.user.email === "admin@resuvix.ai") {
                if (navItemAdmin) navItemAdmin.style.display = "flex";
                if (dropBtnAdmin) dropBtnAdmin.style.display = "flex";
            }

            // Always keep drawer upgrade card visible for multiple add-on purchases
            if (drawerUpgradeCard) {
                drawerUpgradeCard.style.display = "block";
            }

            // Render active plan badge
            if (planBadgeContainer) {
                const isPro = this.user.planType === "pro" || (this.user.premium && this.user.planType !== "single");
                const paidResumes = this.user.paidResumesCount || 0;
                const paidInterviews = this.user.paidInterviewsCount || 0;
                const isSingle = this.user.planType === "single" || paidResumes > 0 || paidInterviews > 0;

                if (isPro) {
                    planBadgeContainer.innerHTML = `<span class="dash-badge-pro" id="userPlanBadge" style="background: linear-gradient(135deg, #6C63FF, #38BDF8); color: white; padding: 5px 14px; border-radius: 20px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(108, 99, 255, 0.25);"><i class="ri-vip-crown-fill" style="color: #FACC15;"></i> Pro Pass</span>`;
                } else if (isSingle) {
                    planBadgeContainer.innerHTML = `<span class="dash-badge-pro" id="userPlanBadge" style="background: linear-gradient(135deg, #06B6D4, #3B82F6); color: white; padding: 5px 14px; border-radius: 20px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.25);"><i class="ri-flashlight-fill" style="color: #FACC15;"></i> Single Pass</span>`;
                } else {
                    planBadgeContainer.innerHTML = `<span class="dash-badge-free" id="userPlanBadge" style="background: #F1F5F9; color: #64748B; padding: 5px 14px; border-radius: 20px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #E2E8F0;"><i class="ri-sparkling-fill" style="color: #6C63FF;"></i> Free Tier</span>`;
                }
            }
        }
    }

    initDrawer() {
        const trigger = document.getElementById("drawerTrigger");
        const closeBtn = document.getElementById("drawerClose");
        const overlay = document.getElementById("drawerOverlay");
        const drawer = document.getElementById("chatgptDrawer");

        const openDrawer = () => {
            if (drawer) drawer.classList.add("active");
            if (overlay) overlay.classList.add("active");
        };

        const closeDrawer = () => {
            if (drawer) drawer.classList.remove("active");
            if (overlay) overlay.classList.remove("active");
        };

        if (trigger) trigger.addEventListener("click", openDrawer);
        if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
        if (overlay) overlay.addEventListener("click", closeDrawer);

        // Navigation Drawer Item Links
        const navItemDash = document.getElementById("navItemDash");
        const navItemResumes = document.getElementById("navItemResumes");
        const navItemATS = document.getElementById("navItemATS");
        const navItemInterview = document.getElementById("navItemInterview");
        const navItemCoverLetter = document.getElementById("navItemCoverLetter");
        const navItemBilling = document.getElementById("navItemBilling");
        const navItemAdmin = document.getElementById("navItemAdmin");
        const btnDrawerUpgrade = document.getElementById("btnDrawerUpgrade");
        const drawerLogoutBtn = document.getElementById("drawerLogoutBtn");

        if (navItemDash) navItemDash.addEventListener("click", () => window.location.href = "dashboard.html");
        if (navItemResumes) navItemResumes.addEventListener("click", () => window.location.href = "builder.html");
        if (navItemATS) navItemATS.addEventListener("click", () => window.location.href = "ats-checker.html");
        if (navItemInterview) navItemInterview.addEventListener("click", (e) => { e.preventDefault(); closeDrawer(); });
        if (navItemCoverLetter) navItemCoverLetter.addEventListener("click", () => window.location.href = "cover-letter.html");
        if (navItemBilling) navItemBilling.addEventListener("click", (e) => { e.preventDefault(); closeDrawer(); this.openBillingModal(); });
        if (navItemAdmin) navItemAdmin.addEventListener("click", () => window.location.href = "admin.html");
        if (btnDrawerUpgrade) btnDrawerUpgrade.addEventListener("click", () => this.openPremiumModal());
        if (drawerLogoutBtn) drawerLogoutBtn.addEventListener("click", () => this.auth.logout());
    }

    initEventListeners() {
        const userProfilePill = document.getElementById("userProfilePill");
        const userDropdownMenu = document.getElementById("userDropdownMenu");
        const notifBellBtn = document.getElementById("notifBellBtn");
        const notifDropdownMenu = document.getElementById("notifDropdownMenu");
        const btnMarkAllRead = document.getElementById("btnMarkAllRead");

        if (userProfilePill && userDropdownMenu) {
            userProfilePill.addEventListener("click", (e) => {
                e.stopPropagation();
                if (notifDropdownMenu) notifDropdownMenu.classList.remove("show");
                userDropdownMenu.classList.toggle("show");
            });
        }

        if (notifBellBtn && notifDropdownMenu) {
            notifBellBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (userDropdownMenu) userDropdownMenu.classList.remove("show");
                notifDropdownMenu.classList.toggle("show");
            });
        }

        if (btnMarkAllRead) {
            btnMarkAllRead.addEventListener("click", (e) => {
                e.stopPropagation();
                const badge = document.getElementById("notifUnreadBadge");
                if (badge) badge.style.display = "none";
                toast.success("Notifications marked as read.");
            });
        }

        document.addEventListener("click", () => {
            if (userDropdownMenu) userDropdownMenu.classList.remove("show");
            if (notifDropdownMenu) notifDropdownMenu.classList.remove("show");
        });

        const dropBtnLogout = document.getElementById("dropBtnLogout");
        if (dropBtnLogout) dropBtnLogout.addEventListener("click", () => this.auth.logout());

        const dropBtnBilling = document.getElementById("dropBtnBilling");
        if (dropBtnBilling) dropBtnBilling.addEventListener("click", () => this.openBillingModal());

        const dropBtnAdmin = document.getElementById("dropBtnAdmin");
        if (dropBtnAdmin) dropBtnAdmin.addEventListener("click", () => window.location.href = "admin.html");

        // Form Submission
        const form = document.getElementById("interviewSetupForm");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.startInterviewSession();
            });
        }

        // Live Action Controls
        const btnSubmitLiveAnswer = document.getElementById("btnSubmitLiveAnswer");
        if (btnSubmitLiveAnswer) {
            btnSubmitLiveAnswer.addEventListener("click", () => this.submitCurrentAnswer());
        }

        const btnEndInterviewEarly = document.getElementById("btnEndInterviewEarly");
        if (btnEndInterviewEarly) {
            btnEndInterviewEarly.addEventListener("click", () => this.completeInterviewSession());
        }

        const btnVoiceToggle = document.getElementById("btnVoiceToggle");
        if (btnVoiceToggle) {
            btnVoiceToggle.addEventListener("click", () => this.toggleVoiceInput());
        }

        const btnRestartNewSetup = document.getElementById("btnRestartNewSetup");
        if (btnRestartNewSetup) {
            btnRestartNewSetup.addEventListener("click", () => this.showSetupView());
        }

        const btnPracticeWeakArea = document.getElementById("btnPracticeWeakArea");
        if (btnPracticeWeakArea) {
            btnPracticeWeakArea.addEventListener("click", () => {
                if (!this.user.premium) {
                    this.openPremiumModal();
                } else {
                    toast.info("Initializing targeted weak-area practice interview...");
                    this.showSetupView();
                }
            });
        }

        // Paste event blockers to enforce real typing/speaking
        const liveAnswerText = document.getElementById("liveAnswerText");
        if (liveAnswerText) {
            liveAnswerText.addEventListener("paste", (e) => {
                e.preventDefault();
                toast.warning("🚫 Pasting is disabled during the mock interview. Please type or speak your response!");
            });
        }

        const liveFollowUpAnswerText = document.getElementById("liveFollowUpAnswerText");
        if (liveFollowUpAnswerText) {
            liveFollowUpAnswerText.addEventListener("paste", (e) => {
                e.preventDefault();
                toast.warning("🚫 Pasting is disabled during the mock interview. Please type or speak your response!");
            });
        }

        // Premium Modal Controls
        const modalClose = document.getElementById("premiumModalClose");
        const btnCancelModal = document.getElementById("btnCancelModal");
        if (modalClose) modalClose.addEventListener("click", () => this.closePremiumModal());
        if (btnCancelModal) btnCancelModal.addEventListener("click", () => this.closePremiumModal());

        const btnApplyCoupon = document.getElementById("btnApplyCoupon");
        if (btnApplyCoupon) btnApplyCoupon.addEventListener("click", () => this.handleApplyCoupon());

        const btnPayUpgrade = document.getElementById("btnPayUpgrade");
        if (btnPayUpgrade) {
            btnPayUpgrade.addEventListener("click", () => this.handleRazorpayPayment());
        }
    }

    initRolePills() {
        const setupJobRole = document.getElementById("setupJobRole");
        document.querySelectorAll(".role-pill").forEach(pill => {
            pill.addEventListener("click", () => {
                document.querySelectorAll(".role-pill").forEach(p => p.classList.remove("active"));
                pill.classList.add("active");
                if (setupJobRole) setupJobRole.value = pill.dataset.role;
            });
        });
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;

            this.recognition.onresult = (event) => {
                let transcript = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                const textarea = document.getElementById("liveAnswerText");
                if (textarea) {
                    textarea.value = (this.preVoiceText || "") + transcript;
                }
            };

            this.recognition.onerror = (e) => {
                console.warn("Speech recognition error:", e.error);
                this.stopVoiceInput();
            };

            this.recognition.onend = () => {
                this.stopVoiceInput();
            };
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            toast.error("Speech Recognition is not supported in this browser. Please type your response.");
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
            this.stopVoiceInput();
        } else {
            try {
                const textarea = document.getElementById("liveAnswerText");
                this.preVoiceText = textarea ? textarea.value.trim() : "";
                if (this.preVoiceText) {
                    this.preVoiceText += " ";
                }

                this.recognition.start();
                this.isRecording = true;
                const micIcon = document.getElementById("micIcon");
                const micText = document.getElementById("micText");
                const btnVoiceToggle = document.getElementById("btnVoiceToggle");

                if (micIcon) micIcon.className = "ri-mic-fill ri-pulse";
                if (micText) micText.textContent = "Listening...";
                if (btnVoiceToggle) btnVoiceToggle.style.borderColor = "#EF4444";
                toast.info("Voice recording active. Speak into your microphone.");
            } catch (err) {
                console.error("Speech recognition error:", err);
                this.stopVoiceInput();
            }
        }
    }

    stopVoiceInput() {
        this.isRecording = false;
        const micIcon = document.getElementById("micIcon");
        const micText = document.getElementById("micText");
        const btnVoiceToggle = document.getElementById("btnVoiceToggle");

        if (micIcon) micIcon.className = "ri-mic-line";
        if (micText) micText.textContent = "Voice Input";
        if (btnVoiceToggle) btnVoiceToggle.style.borderColor = "";
    }

    buildResumeText(r) {
        if (!r) return "";
        let text = `Name: ${r.personalInfo?.fullName || ""}\n`;
        text += `Email: ${r.personalInfo?.email || ""}\n`;
        text += `Location: ${r.personalInfo?.location || ""}\n`;
        if (r.summary) text += `Professional Summary: ${r.summary}\n`;
        if (r.skills && r.skills.length) {
            text += `Skills: ${r.skills.join(", ")}\n`;
        }
        if (r.experience && r.experience.length) {
            text += `Professional Experience:\n`;
            r.experience.forEach(exp => {
                text += `- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate}): ${exp.description || ""}\n`;
            });
        }
        if (r.projects && r.projects.length) {
            text += `Key Projects:\n`;
            r.projects.forEach(p => {
                text += `- ${p.title}: ${p.description || ""}\n`;
            });
        }
        if (r.education && r.education.length) {
            text += `Education:\n`;
            r.education.forEach(edu => {
                text += `- ${edu.degree} from ${edu.college} (${edu.startYear} - ${edu.endYear}): CGPA/Score ${edu.cgpa || ""}\n`;
            });
        }
        return text;
    }

    async loadSavedResumes() {
        const select = document.getElementById("selectSavedResume");
        if (!select) return;

        try {
            const res = await api.get("/api/v1/resumes");
            const data = res.data || res;
            if (Array.isArray(data) && data.length) {
                this.savedResumes = data;
                let html = `<option value="">-- Select Saved Resuvix Resume --</option>`;
                data.forEach(r => {
                    const title = r.title || r.targetRole || "Saved Resume";
                    html += `<option value="${r._id}">${this.escapeHTML(title)} (${this.escapeHTML(r.targetRole || 'MERN')})</option>`;
                });
                select.innerHTML = html;
            }
        } catch (e) {
            console.warn("Saved resumes fetch error:", e.message);
        }
    }

    checkATSTransfer() {
        if (typeof sessionStorage === "undefined") return;

        const transferRaw = sessionStorage.getItem("resuvix_ats_interview_transfer");
        if (transferRaw) {
            try {
                const data = JSON.parse(transferRaw);
                if (data && data.jobRole) {
                    this.atsTransferData = data;
                    const alert = document.getElementById("atsTransferAlert");
                    const text = document.getElementById("atsTransferText");
                    const badge = document.getElementById("atsTransferScoreBadge");
                    const setupJobRole = document.getElementById("setupJobRole");

                    if (setupJobRole) setupJobRole.value = data.jobRole;
                    if (text) text.textContent = `Imported target role "${data.jobRole}" with ${data.missingSkills ? data.missingSkills.length : 0} focus keywords.`;
                    if (badge) badge.textContent = `ATS Score: ${data.atsScore || 85}/100`;
                    if (alert) alert.style.display = "block";

                    toast.success("🎯 ATS Audit data transferred cleanly into Interview Setup!");
                }
            } catch (e) {
                console.error("ATS transfer parsing error:", e);
            }
        }
    }

    async startInterviewSession() {
        const jobRole = document.getElementById("setupJobRole").value.trim();
        if (!jobRole) {
            toast.warning("Please specify a target job role or select a quick role pill.");
            return;
        }

        const companyName = document.getElementById("setupCompany").value.trim();
        const experienceLevel = document.getElementById("setupExpLevel").value;
        const interviewType = document.getElementById("setupCategory").value;
        const difficulty = document.getElementById("setupDifficulty").value;
        const questionCount = document.getElementById("setupQuestionCount").value;
        const jdText = document.getElementById("setupJdText").value.trim();

        const btnStart = document.getElementById("btnStartInterview");
        const originalText = btnStart.innerHTML;
        btnStart.disabled = true;
        btnStart.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Initializing Role AI Engine...`;

        try {
            const formData = new FormData();
            formData.append("jobRole", jobRole);
            formData.append("companyName", companyName);
            formData.append("experienceLevel", experienceLevel);
            formData.append("interviewType", interviewType);
            formData.append("difficulty", difficulty);
            formData.append("questionCount", questionCount);
            if (jdText) formData.append("jdText", jdText);

            // Handle file upload or selected saved resume
            const resumeFile = document.getElementById("setupResumeFile").files[0];
            if (resumeFile) {
                formData.append("resumeFile", resumeFile);
            } else {
                const selectSaved = document.getElementById("selectSavedResume");
                const selectedId = selectSaved ? selectSaved.value : "";
                if (selectedId && this.savedResumes) {
                    const matchedResume = this.savedResumes.find(r => r._id === selectedId);
                    if (matchedResume) {
                        const compiledText = this.buildResumeText(matchedResume);
                        formData.append("resumeText", compiledText);
                    }
                }
            }

            const jdFile = document.getElementById("setupJdFile").files[0];
            if (jdFile) formData.append("jdFile", jdFile);

            const res = await api.uploadFile("/api/v1/interviews/start", formData);

            const interview = res.data || res;
            if (interview && interview._id) {
                this.currentInterview = interview;
                this.currentQuestionIdx = 0;
                this.showLiveView();
                toast.success(`Generated ${interview.questions.length} questions for ${jobRole}!`);
            }
        } catch (err) {
            console.error("Start interview error:", err);
            if (err.isLimitReached || (err.message && err.message.includes("free AI Mock Interview has been completed"))) {
                this.openPremiumModal();
            } else {
                toast.error(err.message || "Failed to start interview session.");
            }
        } finally {
            btnStart.disabled = false;
            btnStart.innerHTML = originalText;
        }
    }

    showSetupView() {
        document.getElementById("viewSetupCard").style.display = "block";
        document.getElementById("viewLiveCard").style.display = "none";
        document.getElementById("viewReportCard").style.display = "none";
        document.getElementById("viewSetupCard").scrollIntoView({ behavior: "smooth" });
    }

    showLiveView() {
        document.getElementById("viewSetupCard").style.display = "none";
        document.getElementById("viewLiveCard").style.display = "block";
        document.getElementById("viewReportCard").style.display = "none";

        const liveRoleTitle = document.getElementById("liveRoleTitle");
        if (liveRoleTitle) liveRoleTitle.textContent = `${this.currentInterview.jobRole} Mock Interview`;

        this.renderCurrentQuestion();
        document.getElementById("viewLiveCard").scrollIntoView({ behavior: "smooth" });
    }

    renderCurrentQuestion() {
        if (!this.currentInterview || !this.currentInterview.questions.length) return;

        const q = this.currentInterview.questions[this.currentQuestionIdx];
        const total = this.currentInterview.questions.length;

        const liveProgressText = document.getElementById("liveProgressText");
        const liveProgressBarFill = document.getElementById("liveProgressBarFill");
        const liveQuestionText = document.getElementById("liveQuestionText");
        const liveConceptsContainer = document.getElementById("liveConceptsContainer");
        const liveAnswerText = document.getElementById("liveAnswerText");
        const liveFollowUpCard = document.getElementById("liveFollowUpCard");
        const liveFollowUpAnswerText = document.getElementById("liveFollowUpAnswerText");

        if (liveProgressText) liveProgressText.textContent = `Question ${this.currentQuestionIdx + 1} of ${total}`;
        if (liveProgressBarFill) liveProgressBarFill.style.width = `${((this.currentQuestionIdx + 1) / total) * 100}%`;
        if (liveQuestionText) liveQuestionText.textContent = q.question;
        if (liveAnswerText) liveAnswerText.value = q.userAnswer || "";

        if (liveFollowUpCard) liveFollowUpCard.style.display = "none";
        if (liveFollowUpAnswerText) liveFollowUpAnswerText.value = "";

        if (liveConceptsContainer) {
            let html = "";
            (q.keyConcepts || []).forEach(kc => {
                html += `<span class="concept-badge"><i class="ri-price-tag-3-line"></i> ${this.escapeHTML(kc)}</span>`;
            });
            liveConceptsContainer.innerHTML = html;
        }
    }

    async submitCurrentAnswer() {
        if (!this.currentInterview) return;

        const answerText = document.getElementById("liveAnswerText").value.trim();
        if (!answerText) {
            toast.warning("Please type or speak your response before submitting.");
            return;
        }

        const liveFollowUpAnswerText = document.getElementById("liveFollowUpAnswerText");
        const followUpAns = liveFollowUpAnswerText ? liveFollowUpAnswerText.value.trim() : "";

        const btnSubmit = document.getElementById("btnSubmitLiveAnswer");
        const originalText = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Processing Answer...`;

        try {
            const res = await api.post(`/api/v1/interviews/${this.currentInterview._id}/answer`, {
                questionIndex: this.currentQuestionIdx,
                answer: answerText,
                followUpAnswer: followUpAns,
            });

            const data = res.data || res;
            if (data && data.shouldFollowUp && data.followUpQuestion && !followUpAns) {
                const card = document.getElementById("liveFollowUpCard");
                const text = document.getElementById("liveFollowUpText");
                if (text) text.textContent = data.followUpQuestion;
                if (card) card.style.display = "block";
                toast.info("💡 Dynamic Follow-Up Question added by Interviewer!");
                return;
            }

            if (this.currentQuestionIdx < this.currentInterview.questions.length - 1) {
                this.currentQuestionIdx++;
                this.renderCurrentQuestion();
                toast.success("Answer saved! Moving to next question.");
            } else {
                toast.success("All questions answered! Generating performance report...");
                await this.completeInterviewSession();
            }
        } catch (err) {
            toast.error(err.message || "Failed to save answer.");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalText;
        }
    }

    async completeInterviewSession() {
        if (!this.currentInterview) return;

        try {
            toast.info("Calculating final performance score & detailed breakdown...");
            const res = await api.post(`/api/v1/interviews/${this.currentInterview._id}/complete`);
            const completedRecord = res.data || res;

            if (completedRecord) {
                this.currentInterview = completedRecord;
                this.renderReportView(completedRecord);
                await this.loadHistory();
            }
        } catch (err) {
            toast.error(err.message || "Failed to complete interview.");
        }
    }

    renderReportView(record) {
        document.getElementById("viewSetupCard").style.display = "none";
        document.getElementById("viewLiveCard").style.display = "none";
        document.getElementById("viewReportCard").style.display = "block";

        const reportScoreCircle = document.getElementById("reportScoreCircle");
        const reportVerdictTag = document.getElementById("reportVerdictTag");
        const reportJobRoleTitle = document.getElementById("reportJobRoleTitle");
        const reportCategoryBarsContainer = document.getElementById("reportCategoryBarsContainer");
        const reportStrengthsList = document.getElementById("reportStrengthsList");
        const reportWeaknessesList = document.getElementById("reportWeaknessesList");
        const reportCommFeedback = document.getElementById("reportCommFeedback");
        const reportQuestionsReviewContainer = document.getElementById("reportQuestionsReviewContainer");

        if (reportScoreCircle) reportScoreCircle.textContent = `${record.overallScore !== undefined ? record.overallScore : 0}%`;
        if (reportVerdictTag) reportVerdictTag.textContent = record.performanceVerdict || "Significant Improvement Required";
        if (reportJobRoleTitle) reportJobRoleTitle.textContent = `${record.jobRole} Interview Report`;

        if (reportCategoryBarsContainer) {
            let html = "";
            (record.categoryScores || []).forEach(cat => {
                html += `
                    <div class="cat-bar-item">
                        <div class="cat-bar-head">
                            <span>${this.escapeHTML(cat.category)}</span>
                            <span>${cat.score}%</span>
                        </div>
                        <div class="cat-bar-bg">
                            <div class="cat-bar-fill" style="width: ${cat.score}%;"></div>
                        </div>
                    </div>
                `;
            });
            reportCategoryBarsContainer.innerHTML = html;
        }

        if (reportStrengthsList) {
            let html = "";
            (record.overallStrengths || []).forEach(s => {
                html += `<li>✓ ${this.escapeHTML(s)}</li>`;
            });
            reportStrengthsList.innerHTML = html;
        }

        if (reportWeaknessesList) {
            let html = "";
            (record.overallWeaknesses || []).forEach(w => {
                html += `<li>⚡ ${this.escapeHTML(w)}</li>`;
            });
            reportWeaknessesList.innerHTML = html;
        }

        if (reportCommFeedback && record.communicationAnalysis) {
            reportCommFeedback.textContent = record.communicationAnalysis.feedback || "Good domain articulation and structured tone.";
        }

        if (reportQuestionsReviewContainer) {
            let html = "";
            (record.questions || []).forEach((q, idx) => {
                const evalData = q.evaluation || {};
                html += `
                    <div class="review-q-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h4 style="font-size: 15px; font-weight: 800; color: var(--text); margin: 0;">#${idx + 1}: ${this.escapeHTML(q.question)}</h4>
                            <span class="concept-badge" style="background: rgba(34, 197, 94, 0.1); color: #166534; font-size: 13px;">Score: ${evalData.score !== undefined ? evalData.score : 0}/100</span>
                        </div>

                        <div style="background: #F8FAFC; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; font-size: 13.5px;">
                            <strong>Your Response:</strong> "${this.escapeHTML(q.userAnswer || 'No response provided.')}"
                        </div>

                        ${evalData.starAnalysis ? `
                            <div style="font-size: 12.5px; color: var(--text-light); margin-bottom: 8px;">
                                <strong>STAR Method Breakdown:</strong> Situation: ${evalData.starAnalysis.situation} | Task: ${evalData.starAnalysis.task} | Action: ${evalData.starAnalysis.action} | Result: ${evalData.starAnalysis.result}
                            </div>
                        ` : ''}

                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); font-size: 13.5px;">
                            <div style="color: var(--primary); margin-bottom: 6px;">
                                💡 <strong>Recommended Answer Structure:</strong> ${this.escapeHTML(q.tips || 'Focus on safety, compliance, and clear methodologies.')}
                            </div>
                            <div style="color: #059669; font-weight: 500;">
                                🎯 <strong>Appropriate Model Answer:</strong> "${this.escapeHTML(evalData.idealAnswer || q.modelAnswer || 'Exemplary master response not loaded.')}"
                            </div>
                        </div>
                    </div>
                `;
            });
            reportQuestionsReviewContainer.innerHTML = html;
        }

        document.getElementById("viewReportCard").scrollIntoView({ behavior: "smooth" });
    }

    async loadHistory() {
        const body = document.getElementById("historyTableBody");
        if (!body) return;

        try {
            const res = await api.get("/api/v1/interviews/history");
            const data = res.data || res;
            const interviews = data.interviews || [];

            if (interviews.length === 0) {
                body.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-light); padding: 24px;">No past interview reports found. Start your first mock interview above!</td></tr>`;
                return;
            }

            let html = "";
            interviews.forEach(inv => {
                const dateStr = inv.completedAt ? new Date(inv.completedAt).toLocaleDateString() : new Date(inv.createdAt).toLocaleDateString();
                html += `
                    <tr>
                        <td>${dateStr}</td>
                        <td><strong>${this.escapeHTML(inv.jobRole)}</strong></td>
                        <td>${inv.interviewType || 'Full Mock'}</td>
                        <td>${inv.questionCount || 10} Qs</td>
                        <td><span style="font-weight: 800; color: #22C55E;">${inv.overallScore || 0}%</span></td>
                        <td><span class="concept-badge">${this.escapeHTML(inv.performanceVerdict || 'Completed')}</span></td>
                        <td>
                            <button class="btn-outline view-inv-btn" data-id="${inv._id}" style="padding: 4px 12px; font-size: 12px; border-radius: 8px;">
                                View Report
                            </button>
                        </td>
                    </tr>
                `;
            });

            body.innerHTML = html;

            body.querySelectorAll(".view-inv-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.dataset.id;
                    try {
                        const reportRes = await api.get(`/api/v1/interviews/${id}`);
                        const record = reportRes.data || reportRes;
                        if (record) this.renderReportView(record);
                    } catch (e) {
                        toast.error("Failed to load interview report details.");
                    }
                });
            });
        } catch (e) {
            console.warn("History fetch error:", e.message);
        }
    }

    // ==========================================================
    // REUSING STANDARD RESUVIX AI PAYMENT & PLANS MODAL SYSTEM
    // ==========================================================

    renderPlansGrid() {
        const grid = document.getElementById("modalPlansGrid");
        if (!grid) return;

        let html = `
            <div class="plan-card-option ${this.selectedPlan === 'single' ? 'active' : ''}" data-plan="single" data-price="${this.perResumePrice}">
                <div class="plan-name">Single AI Service Pass</div>
                <div class="plan-price">₹${this.perResumePrice} <span style="font-size: 12px; font-weight: 500;">/ one-time</span></div>
                <div style="font-size: 11px; color: var(--text-light); margin-top: 4px;">Unlock 1 AI Resume or Mock Interview</div>
            </div>

            <div class="plan-card-option ${this.selectedPlan === 'unlimited' ? 'active' : ''}" data-plan="unlimited" data-price="${this.proUnlimitedPrice}">
                <div class="plan-name">Pro Unlimited Yearly Pass (Best Value)</div>
                <div class="plan-price">₹${this.proUnlimitedPrice} <span style="font-size: 12px; font-weight: 500;">/ yearly</span></div>
                <div style="font-size: 11px; color: var(--success); font-weight: 700; margin-top: 4px;">Unlimited AI Resumes & Mock Interviews for 1 Year</div>
            </div>
        `;

        grid.innerHTML = html;

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

    async openPremiumModal() {
        await this.fetchSettings();
        this.renderPlansGrid();
        this.updateFinalPriceDisplay();
        const modal = document.getElementById("premiumModalOverlay");
        if (modal) modal.classList.add("active");
    }

    closePremiumModal() {
        const modal = document.getElementById("premiumModalOverlay");
        if (modal) modal.classList.remove("active");
    }

    async openBillingModal() {
        const modal = document.getElementById("billingModalOverlay");
        if (modal) {
            modal.classList.add("active");
            const titleEl = document.getElementById("billingPlanTitle");
            const validityEl = document.getElementById("billingPlanValidity");
            const benefitsEl = document.getElementById("billingBenefitsList");
            const txListEl = document.getElementById("billingTransactionsList");

            if (txListEl) txListEl.innerHTML = `<div style="font-size: 13px; color: var(--text-light);"><i class="ri-loader-4-line ri-spin"></i> Fetching live payment details...</div>`;

            try {
                const payData = await api.get("/api/v1/payments/my-payments");
                if (payData && payData.user) {
                    this.user = { ...this.user, ...payData.user };
                    Storage.saveUser(this.user);
                    this.updateUserUI();
                }

                const payments = payData?.payments || [];
                const isPro = this.user.planType === "pro" || (this.user.premium && this.user.planType !== "single");
                const paidResumes = this.user.paidResumesCount || 0;
                const paidInterviews = this.user.paidInterviewsCount || 0;
                const isSingle = this.user.planType === "single" || paidResumes > 0 || paidInterviews > 0;

                if (titleEl) titleEl.textContent = isPro ? "Pro Unlimited Yearly Pass" : isSingle ? "Single Pass Add-on Active" : "Free Starter Pass";

                if (validityEl) {
                    let validityText = "Unlimited Free Tier Access";
                    if (isPro) {
                        const expDate = this.user.subscriptionExpiresAt ? new Date(this.user.subscriptionExpiresAt).toLocaleDateString("en-IN") : "1 Year From Purchase";
                        validityText = `Active Pro Pass • Valid Until: ${expDate}`;
                    } else if (isSingle) {
                        validityText = `Single Pass Add-ons • Resume Credits: ${paidResumes} | Interview Credits: ${paidInterviews}`;
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
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> 📄 <strong>Paid Resume Credits:</strong> ${paidResumes} Remaining</li>
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> 🎙️ <strong>Paid Interview Credits:</strong> ${paidInterviews} Remaining</li>
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> Unlimited Free ATS Score Scans</li>
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> Unlimited Free AI Cover Letters</li>
                            <li style="display: flex; align-items: center; gap: 10px;"><i class="ri-checkbox-circle-fill" style="color: #22C55E;"></i> 1-Time Free AI Resume & 1-Time Free Mock Interview</li>
                        `;
                    }
                }

                if (txListEl) {
                    if (payments.length === 0) {
                        txListEl.innerHTML = `<div style="font-size: 13px; color: var(--text-light); padding: 12px; background: #F8FAFC; border-radius: 12px; border: 1px solid var(--border);">No paid payment transactions found. You are currently using the Free Starter tier.</div>`;
                    } else {
                        let txHtml = "";
                        payments.forEach(tx => {
                            const dt = new Date(tx.createdAt || Date.now()).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                            });
                            txHtml += `
                                <div style="background: #F8FAFC; border: 1px solid var(--border); border-radius: 14px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
                                    <div>
                                        <strong style="color: var(--text); font-weight: 800;">₹${tx.finalAmount || tx.originalAmount}</strong>
                                        <span style="color: var(--text-light); margin-left: 8px;">• ${dt}</span>
                                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">ID: ${tx.razorpayPaymentId || tx.razorpayOrderId || 'N/A'}</div>
                                    </div>
                                    <span class="badge" style="background: rgba(34, 197, 94, 0.1); color: #22C55E; font-weight: 800; font-size: 11px; padding: 4px 10px;">
                                        <i class="ri-checkbox-circle-fill"></i> ${tx.paymentStatus.toUpperCase()}
                                    </span>
                                </div>
                            `;
                        });
                        txListEl.innerHTML = txHtml;
                    }
                }
            const btnBillingUpgrade = document.getElementById("btnBillingUpgrade");
            if (btnBillingUpgrade) {
                btnBillingUpgrade.onclick = () => {
                    modal.classList.remove("active");
                    this.openPremiumModal();
                };
            }
            } catch (err) {
                console.warn("Failed to load payment details:", err);
            }
        }
    }

    async handleRazorpayPayment() {
        try {
            toast.info("Initiating secure Razorpay checkout...");

            const keyRes = await api.get("/api/v1/payments/key");
            const razorpayKey = keyRes.key;

            const orderRes = await api.post("/api/v1/payments/create-order", {
                couponCode: this.appliedCouponCode || undefined,
                plan: this.selectedPlan
            });

            const { order } = orderRes;

            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency || "INR",
                name: "Resuvix AI",
                description: this.selectedPlan === 'unlimited' ? "Pro Yearly Unlimited Access Pass" : "Single AI Service Pass",
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
                            if (verifyRes.user) {
                                this.user = { ...this.user, ...verifyRes.user };
                            } else {
                                this.user.premium = true;
                            }
                            Storage.saveUser(this.user);
                            this.updateUserUI();
                            this.closePremiumModal();
                            window.location.reload();
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
