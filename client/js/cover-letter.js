/**
 * ==========================================================
 * RESUVIX AI - AI COVER LETTER WRITER ENGINE (SUPERCHARGED)
 * Role-Targeted AI Generation, PDF Resume Document Upload Parsing,
 * Real-Time Editable A4 Paper, Database Storage & 1-Click Refinements.
 * ==========================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    if (!Storage.isLoggedIn()) {
        window.location.href = "../login.html";
        return;
    }

    const auth = new AuthController();
    try {
        await auth.restoreSession();
    } catch (e) {
        console.warn("Restore session warning:", e);
    }

    let user = Storage.getUser();
    if (!user) {
        if (Storage.getAccessToken()) {
            user = { fullName: "User", email: "" };
        } else {
            window.location.href = "../login.html";
            return;
        }
    }

    const app = new CoverLetterApp(user, auth);
    await app.init();
});

class CoverLetterApp {

    constructor(user, auth) {
        this.user = user;
        this.auth = auth;
        this.selectedTone = "Professional & Confident";
        this.selectedFile = null;
        this.savedResumes = [];
        this.savedLetters = [];
        this.currentLetterId = null;
        this.generatedContent = "";
    }

    async init() {
        this.updateHeaderUI();
        this.initDrawer();
        this.initToneSelector();
        this.initDropzone();
        this.initActionButtons();
        this.initAIRefineButtons();
        this.initFormSubmit();
        this.initPaperEditing();
        await this.loadSavedResumes();
        await this.loadSavedLetters();
    }

    updateHeaderUI() {
        const userNameText = document.getElementById("userNameText");
        const userAvatarText = document.getElementById("userAvatarText");
        const planBadgeContainer = document.getElementById("planBadgeContainer");
        const navItemAdmin = document.getElementById("navItemAdmin");
        const dropBtnAdmin = document.getElementById("dropBtnAdmin");

        const firstName = this.user.fullName ? this.user.fullName.split(" ")[0] : "User";
        const initial = this.user.fullName ? this.user.fullName.charAt(0).toUpperCase() : "U";

        if (userNameText) userNameText.textContent = firstName;
        if (userAvatarText) userAvatarText.textContent = initial;

        if (this.user && this.user.role === "admin") {
            if (navItemAdmin) navItemAdmin.style.display = "flex";
            if (dropBtnAdmin) dropBtnAdmin.style.display = "flex";
        } else {
            if (navItemAdmin) navItemAdmin.style.display = "none";
            if (dropBtnAdmin) dropBtnAdmin.style.display = "none";
        }

        if (this.user.premium && planBadgeContainer) {
            planBadgeContainer.innerHTML = `<span class="dash-badge-pro"><i class="ri-vip-crown-fill"></i> Pro Member</span>`;
        }
    }

    initDrawer() {
        const trigger = document.getElementById("drawerTrigger");
        const closeBtn = document.getElementById("drawerClose");
        const overlay = document.getElementById("drawerOverlay");
        const drawer = document.getElementById("chatgptDrawer");
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

        if (this.user?.premium && drawerUpgradeCard) {
            drawerUpgradeCard.style.display = "none";
        }

        document.querySelectorAll(".drawer-menu-list .drawer-item").forEach(item => {
            item.addEventListener("click", () => {
                closeDrawer();
            });
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeDrawer();
        });
    }

    initDropzone() {
        const dropzone = document.getElementById("coverDropzoneArea");
        const fileInput = document.getElementById("coverPdfFileInput");
        const badge = document.getElementById("coverFileSelectedBadge");

        if (!dropzone || !fileInput) return;

        fileInput.addEventListener("click", (e) => e.stopPropagation());
        dropzone.addEventListener("click", () => fileInput.click());

        const handleFile = (file) => {
            if (!file) return;
            const ext = file.name.split('.').pop().toLowerCase();
            if (ext !== 'pdf' && ext !== 'docx') {
                toast.error("Please select a PDF or DOCX resume document.");
                return;
            }
            this.selectedFile = file;
            if (badge) {
                badge.style.display = "inline-flex";
                badge.className = "file-selected-badge";
                badge.innerHTML = `<i class="ri-checkbox-circle-fill"></i> ${this.escapeHTML(file.name)} (${(file.size / 1024).toFixed(0)} KB)`;
            }
            toast.success(`Attached resume: ${file.name}`);
        };

        fileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
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
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    async loadSavedResumes() {
        const select = document.getElementById("selectSavedResume");
        if (!select) return;

        try {
            const data = await api.get("/api/v1/resumes");
            this.savedResumes = Array.isArray(data) ? data : [];

            if (this.savedResumes.length > 0) {
                let optionsHtml = `<option value="">-- Select Saved Resume for Skill Alignment --</option>`;
                this.savedResumes.forEach(r => {
                    optionsHtml += `<option value="${r._id}">${this.escapeHTML(r.title || 'Saved Resume')}</option>`;
                });
                select.innerHTML = optionsHtml;
            }
        } catch (err) {
            console.warn("Load saved resumes warning:", err);
        }
    }

    async loadSavedLetters() {
        const list = document.getElementById("savedLettersList");
        if (!list) return;

        try {
            const data = await api.get("/api/v1/cover-letters");
            this.savedLetters = Array.isArray(data) ? data : [];

            if (this.savedLetters.length === 0) {
                list.innerHTML = `<p style="font-size: 12.5px; color: #94A3B8; margin: 0;">No saved cover letters yet.</p>`;
                return;
            }

            let html = "";
            this.savedLetters.forEach(item => {
                html += `
                    <div class="saved-letter-item" data-id="${item._id}">
                        <div>
                            <strong style="font-size: 13px; color: #0F172A; display: block;">${this.escapeHTML(item.title)}</strong>
                            <span style="font-size: 11.5px; color: #64748B;">${this.escapeHTML(item.companyName)} • ${new Date(item.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <button class="btn-delete-letter" data-id="${item._id}" title="Delete Letter" style="background: none; border: none; color: #EF4444; cursor: pointer; font-size: 1rem; padding: 4px;">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                `;
            });

            list.innerHTML = html;

            document.querySelectorAll(".saved-letter-item").forEach(itemEl => {
                itemEl.addEventListener("click", (e) => {
                    if (e.target.closest(".btn-delete-letter")) return;
                    const id = itemEl.dataset.id;
                    this.loadLetterById(id);
                });
            });

            document.querySelectorAll(".btn-delete-letter").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    this.deleteLetterById(id);
                });
            });

        } catch (err) {
            console.warn("Load saved cover letters warning:", err);
        }
    }

    loadLetterById(id) {
        const item = this.savedLetters.find(l => l._id === id);
        if (!item) return;

        this.currentLetterId = item._id;
        this.generatedContent = item.content;

        document.getElementById("inpTargetRole").value = item.jobTitle || "";
        document.getElementById("inpCompanyName").value = item.companyName || "";
        document.getElementById("inpJobDescription").value = item.jobDescription || "";

        this.renderPaperPreview();
        toast.success(`Loaded "${item.title}"`);
    }

    async deleteLetterById(id) {
        if (!confirm("Are you sure you want to delete this saved Cover Letter?")) return;

        try {
            await api.delete(`/api/v1/cover-letters/${id}`);
            toast.success("Cover letter deleted.");
            if (this.currentLetterId === id) {
                this.currentLetterId = null;
            }
            await this.loadSavedLetters();
        } catch (err) {
            toast.error(err.message || "Failed to delete cover letter.");
        }
    }

    initToneSelector() {
        const pills = document.querySelectorAll(".tone-pill-btn");
        pills.forEach(pill => {
            pill.addEventListener("click", (e) => {
                pills.forEach(p => p.classList.remove("active"));
                e.currentTarget.classList.add("active");
                this.selectedTone = e.currentTarget.dataset.tone || "Professional & Confident";
            });
        });
    }

    initPaperEditing() {
        const paper = document.getElementById("paperCoverLetter");
        if (!paper) return;

        paper.addEventListener("input", () => {
            this.generatedContent = paper.innerText || paper.textContent;
        });
    }

    initFormSubmit() {
        const form = document.getElementById("coverLetterForm");
        const btnSubmit = document.getElementById("btnGenerateCoverLetter");

        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const jobTitle = document.getElementById("inpTargetRole")?.value.trim();
            const companyName = document.getElementById("inpCompanyName")?.value.trim();
            const jobDescription = document.getElementById("inpJobDescription")?.value.trim();
            const resumeId = document.getElementById("selectSavedResume")?.value;

            if (!jobTitle || !companyName) {
                toast.error("Please enter both target role and company name.");
                return;
            }

            let resumeText = "";
            let skillsStr = "";
            let experienceStr = "";

            if (resumeId) {
                const targetResume = this.savedResumes.find(r => r._id === resumeId);
                if (targetResume) {
                    skillsStr = Array.isArray(targetResume.skills) ? targetResume.skills.join(", ") : (targetResume.skills || "");
                    const pInfo = targetResume.personalInfo || {};
                    const fullName = pInfo.fullName || this.user.fullName;
                    const email = pInfo.email || this.user.email;
                    const phone = pInfo.phone || "";

                    const summary = targetResume.summary || "";
                    const expList = Array.isArray(targetResume.experience)
                        ? targetResume.experience.map(e => `${e.position || ''} at ${e.company || ''} (${e.startDate || ''} - ${e.endDate || ''}): ${e.description || ''}`).join("\n")
                        : "";
                    const projList = Array.isArray(targetResume.projects)
                        ? targetResume.projects.map(p => `${p.title || ''}: ${p.description || ''}`).join("\n")
                        : "";
                    const eduList = Array.isArray(targetResume.education)
                        ? targetResume.education.map(ed => `${ed.degree || ''} from ${ed.college || ''} (${ed.startYear || ''} - ${ed.endYear || ''})`).join("\n")
                        : "";

                    resumeText = `Candidate: ${fullName}\nContact: ${email} ${phone}\nSummary: ${summary}\nSkills: ${skillsStr}\nExperience:\n${expList}\nProjects:\n${projList}\nEducation:\n${eduList}`;
                    experienceStr = expList;
                }
            }

            const originalHTML = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Writing Cover Letter with Gemini AI...`;

            // CLEAR CANVAS FIRST & DISPLAY AI LOADER
            this.clearCanvasAndShowLoader("Drafting personalized Cover Letter with Gemini AI...");

            try {
                toast.info("Generating role-tailored Cover Letter...");
                let data = null;

                if (this.selectedFile) {
                    const formData = new FormData();
                    formData.append("file", this.selectedFile);
                    formData.append("jobTitle", jobTitle);
                    formData.append("companyName", companyName);
                    formData.append("jobDescription", jobDescription || "");
                    formData.append("tone", this.selectedTone);
                    formData.append("fullName", this.user.fullName || "Candidate");
                    formData.append("email", this.user.email || "");

                    data = await api.uploadFile("/api/v1/ai/cover-letter", formData);
                } else {
                    const payload = {
                        jobTitle,
                        companyName,
                        jobDescription,
                        tone: this.selectedTone,
                        fullName: this.user.fullName || "Candidate",
                        email: this.user.email || "",
                        skills: skillsStr,
                        experience: experienceStr,
                        resumeText
                    };

                    data = await api.post("/api/v1/ai/cover-letter", payload);
                }

                let contentText = "";
                if (data && data.coverLetter && data.coverLetter.content) {
                    contentText = data.coverLetter.content;
                } else if (data && data.content) {
                    contentText = data.content;
                } else if (data && data.data && data.data.coverLetter && data.data.coverLetter.content) {
                    contentText = data.data.coverLetter.content;
                } else if (typeof data === "string") {
                    contentText = data;
                }

                if (contentText) {
                    this.generatedContent = contentText;
                    await this.renderPaperPreview(true);
                    toast.success("AI Cover Letter generated successfully!");
                } else {
                    toast.error("Could not generate cover letter. Please check server logs.");
                }
            } catch (err) {
                console.error("Cover Letter AI generation error:", err);
                toast.error(err.message || "Failed to generate Cover Letter.");
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalHTML;
            }
        });
    }

    clearCanvasAndShowLoader(message = "Gemini AI is drafting your Cover Letter...") {
        const paper = document.getElementById("paperCoverLetter");
        if (paper) {
            paper.innerHTML = `
                <div class="ai-writing-loader" style="text-align: center; padding: 70px 20px; color: #6C63FF;">
                    <i class="ri-sparkling-fill ri-spin" style="font-size: 2.8rem; display: block; margin-bottom: 16px; color: #6C63FF;"></i>
                    <h4 style="font-size: 1.15rem; font-weight: 800; color: #0F172A; margin: 0 0 6px;">${this.escapeHTML(message)}</h4>
                    <p style="font-size: 13px; color: #64748B; margin: 0;">Parsing background details & crafting high-impact ATS copy...</p>
                </div>
            `;
        }
    }

    initAIRefineButtons() {
        const refineBtns = document.querySelectorAll(".btn-ai-refine");
        refineBtns.forEach(btn => {
            btn.addEventListener("click", async () => {
                if (!this.generatedContent) {
                    toast.error("Please generate or enter a cover letter first.");
                    return;
                }

                const action = btn.dataset.action;
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Processing...`;

                // CLEAR CANVAS FIRST & SHOW AI WRITING LOADER
                this.clearCanvasAndShowLoader(`Refining Cover Letter (${action.toUpperCase()}) with Gemini AI...`);

                try {
                    let promptInstruction = "";
                    if (action === "concise") promptInstruction = "Make the cover letter punchy, concise, and under 250 words.";
                    else if (action === "professional") promptInstruction = "Elevate the professional tone using high-impact career executive vocabulary.";
                    else if (action === "leadership") promptInstruction = "Emphasize leadership, strategic project ownership, and team impact metrics.";
                    else if (action === "grammar") promptInstruction = "Fix all grammar, punctuation, and flow errors smoothly.";

                    const res = await api.post("/api/v1/ai/cover-letter", {
                        jobTitle: document.getElementById("inpTargetRole")?.value || "Target Role",
                        companyName: document.getElementById("inpCompanyName")?.value || "Company",
                        tone: promptInstruction,
                        fullName: this.user.fullName || "Candidate",
                        experience: this.generatedContent
                    });

                    let contentText = "";
                    if (res && res.coverLetter && res.coverLetter.content) {
                        contentText = res.coverLetter.content;
                    } else if (res && res.content) {
                        contentText = res.content;
                    } else if (res && res.data && res.data.coverLetter && res.data.coverLetter.content) {
                        contentText = res.data.coverLetter.content;
                    }

                    if (contentText) {
                        this.generatedContent = contentText;
                        await this.renderPaperPreview(true);
                        toast.success("Cover Letter refined successfully!");
                    } else {
                        toast.error("Could not refine cover letter.");
                    }
                } catch (err) {
                    toast.error("Failed to refine cover letter.");
                    this.renderPaperPreview(false);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });
        });
    }

    async renderPaperPreview(animate = false) {
        const paper = document.getElementById("paperCoverLetter");
        if (!paper || !this.generatedContent) return;

        if (!animate) {
            paper.textContent = this.generatedContent;
            return;
        }

        paper.textContent = "";
        const text = this.generatedContent;
        let i = 0;
        const chunkSize = Math.max(2, Math.floor(text.length / 120));

        return new Promise((resolve) => {
            const timer = setInterval(() => {
                if (i < text.length) {
                    paper.textContent += text.substr(i, chunkSize);
                    i += chunkSize;
                } else {
                    paper.textContent = text;
                    clearInterval(timer);
                    resolve();
                }
            }, 10);
        });
    }

    initActionButtons() {
        const btnSave = document.getElementById("btnSaveLetter");
        const btnCopy = document.getElementById("btnCopyLetter");
        const btnExportPDF = document.getElementById("btnExportCoverPDF");
        const dropBtnLogout = document.getElementById("dropBtnLogout");
        const drawerLogoutBtn = document.getElementById("drawerLogoutBtn");
        const dropBtnAdmin = document.getElementById("dropBtnAdmin");

        if (btnSave) {
            btnSave.addEventListener("click", async () => {
                if (!this.generatedContent) {
                    toast.error("Please generate or write a cover letter first.");
                    return;
                }

                const jobTitle = document.getElementById("inpTargetRole")?.value.trim() || "Target Role";
                const companyName = document.getElementById("inpCompanyName")?.value.trim() || "Company";
                const jobDescription = document.getElementById("inpJobDescription")?.value.trim() || "";

                try {
                    const originalHTML = btnSave.innerHTML;
                    btnSave.disabled = true;
                    btnSave.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Saving...`;

                    const payload = {
                        title: `${jobTitle} - ${companyName}`,
                        jobTitle,
                        companyName,
                        tone: this.selectedTone,
                        content: this.generatedContent,
                        jobDescription,
                        letterId: this.currentLetterId
                    };

                    const res = await api.post("/api/v1/cover-letters", payload);
                    const savedItem = res.data || res;

                    if (savedItem && savedItem._id) {
                        this.currentLetterId = savedItem._id;
                    }

                    toast.success("Cover Letter saved to your account!");
                    await this.loadSavedLetters();
                    btnSave.disabled = false;
                    btnSave.innerHTML = originalHTML;
                } catch (err) {
                    toast.error(err.message || "Failed to save cover letter.");
                    btnSave.disabled = false;
                }
            });
        }

        if (btnCopy) {
            btnCopy.addEventListener("click", () => {
                if (!this.generatedContent) {
                    toast.error("Please generate a Cover Letter first.");
                    return;
                }
                navigator.clipboard.writeText(this.generatedContent);
                toast.success("Cover Letter copied to clipboard!");
            });
        }

        if (btnExportPDF) {
            btnExportPDF.addEventListener("click", () => {
                if (!this.generatedContent) {
                    toast.error("Please generate a Cover Letter first.");
                    return;
                }

                const toastContainer = document.getElementById("toast-container") || document.querySelector(".toast-container");
                if (toastContainer) toastContainer.style.display = "none";

                toast.info("Preparing Vector PDF Export...");
                setTimeout(() => {
                    window.print();
                    if (toastContainer) toastContainer.style.display = "";
                }, 150);
            });
        }

        // Send via Nodemailer SMTP Email
        const btnEmailLetter = document.getElementById("btnEmailLetter");
        const emailModalOverlay = document.getElementById("emailModalOverlay");
        const emailModalClose = document.getElementById("emailModalClose");
        const btnCancelEmailModal = document.getElementById("btnCancelEmailModal");
        const emailCoverForm = document.getElementById("emailCoverForm");
        const inpRecipientEmail = document.getElementById("inpRecipientEmail");

        if (btnEmailLetter) {
            btnEmailLetter.addEventListener("click", () => {
                if (!this.generatedContent) {
                    toast.error("Please generate a Cover Letter first.");
                    return;
                }
                if (inpRecipientEmail) {
                    inpRecipientEmail.value = this.user?.email || "";
                }
                if (emailModalOverlay) {
                    emailModalOverlay.classList.add("active");
                }
            });
        }

        const closeEmailModal = () => {
            if (emailModalOverlay) emailModalOverlay.classList.remove("active");
        };

        if (emailModalClose) emailModalClose.addEventListener("click", closeEmailModal);
        if (btnCancelEmailModal) btnCancelEmailModal.addEventListener("click", closeEmailModal);

        if (emailCoverForm) {
            emailCoverForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const recipientEmail = inpRecipientEmail?.value.trim();
                if (!recipientEmail) {
                    toast.error("Please enter a valid recipient email.");
                    return;
                }

                const btnSend = document.getElementById("btnSendEmailNow");
                const originalHTML = btnSend.innerHTML;
                btnSend.disabled = true;
                btnSend.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Sending Email via Nodemailer...`;

                try {
                    const payload = {
                        recipientEmail,
                        jobTitle: document.getElementById("inpTargetRole")?.value.trim() || "Target Role",
                        companyName: document.getElementById("inpCompanyName")?.value.trim() || "Target Company",
                        content: this.generatedContent
                    };

                    await api.post("/api/v1/cover-letters/send-email", payload);
                    toast.success(`Cover Letter sent to ${recipientEmail}!`);
                    closeEmailModal();
                } catch (err) {
                    toast.error(err.message || "Failed to send email.");
                } finally {
                    btnSend.disabled = false;
                    btnSend.innerHTML = originalHTML;
                }
            });
        }

        const handleLogout = () => {
            if (this.auth) {
                this.auth.logout();
            } else {
                Storage.logout();
                window.location.href = "../login.html";
            }
        };

        if (dropBtnLogout) dropBtnLogout.addEventListener("click", handleLogout);
        if (drawerLogoutBtn) drawerLogoutBtn.addEventListener("click", handleLogout);
        if (dropBtnAdmin) dropBtnAdmin.addEventListener("click", () => { window.location.href = "admin.html"; });

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
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
}
