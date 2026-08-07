/**
 * ==========================================================
 * RESUVIX AI - ATS RESUME BUILDER ENGINE
 * Multi-Resume Creation & Watermarked Export Paywall Support
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
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    const builder = new BuilderApp(user);
    await builder.init();
});

class BuilderApp {

    constructor(user) {
        this.user = user;
        this.selectedTemplate = "latex-classic";
        this.fontSize = 14;
        this.resumeId = null;
        this.isWatermarked = false;

        // Check if editing existing resume via URL parameter (e.g. builder.html?id=...)
        const urlParams = new URLSearchParams(window.location.search);
        this.resumeId = urlParams.get("id");

        // Blank state for new customers
        this.experiences = [];
        this.educations = [];
        this.projects = [];
        this.customSections = [];
    }

    async init() {
        this.initMobileNotice();
        this.initUserData();
        this.initFontSizeControls();
        this.initTemplateSwitcher();
        this.renderFormSections();
        this.initLiveSync();
        this.initAIHandlers();
        this.initActionButtons();
        this.initRefetchHandler();

        // Load existing resume if editing, otherwise check watermarking status for new resume
        if (this.resumeId) {
            await this.loadExistingResume(this.resumeId);
        } else {
            await this.checkNewResumeWatermarkStatus();
        }
    }

    initMobileNotice() {
        const overlay = document.getElementById("mobileDesktopNoticeOverlay");
        const dismissBtn = document.getElementById("btnDismissMobileNotice");

        if (window.innerWidth <= 768 && overlay) {
            overlay.classList.add("active");
        }

        if (dismissBtn) {
            dismissBtn.addEventListener("click", () => {
                if (overlay) overlay.classList.remove("active");
            });
        }
    }

    /**
     * Check if a new resume should be watermarked for free tier users
     */
    async checkNewResumeWatermarkStatus() {
        try {
            const res = await api.get("/api/v1/resumes");
            const resumes = res.data || res;
            const existingCount = Array.isArray(resumes) ? resumes.length : 0;

            if (!this.user.premium) {
                if (this.user.hasUsedFreeQuota || existingCount >= 1) {
                    this.isWatermarked = true;
                } else {
                    this.isWatermarked = false;
                }
            } else {
                this.isWatermarked = false;
            }
            this.syncLivePreview();
        } catch (err) {
            console.error("Check watermark status error:", err);
        }
    }

    /**
     * Fresh & Clean Workspace Initialization
     * Pre-fills ONLY logged-in Name and Email. All other fields remain completely blank.
     */
    initUserData() {
        const inpFullName = document.getElementById("inpFullName");
        const inpEmail = document.getElementById("inpEmail");
        const inpPhone = document.getElementById("inpPhone");
        const inpLocation = document.getElementById("inpLocation");
        const inpLinkedin = document.getElementById("inpLinkedin");
        const inpGithub = document.getElementById("inpGithub");
        const inpWebsite = document.getElementById("inpWebsite");
        const inpJobTitle = document.getElementById("inpJobTitle");
        const inpSummary = document.getElementById("inpSummary");
        const inpSkills = document.getElementById("inpSkills");

        if (inpFullName) inpFullName.value = this.user.fullName || "";
        if (inpEmail) inpEmail.value = this.user.email || "";

        if (inpPhone) inpPhone.value = "";
        if (inpLocation) inpLocation.value = "";
        if (inpLinkedin) inpLinkedin.value = "";
        if (inpGithub) inpGithub.value = "";
        if (inpWebsite) inpWebsite.value = "";
        if (inpJobTitle) inpJobTitle.value = "";
        if (inpSummary) inpSummary.value = "";
        if (inpSkills) inpSkills.value = "";
    }

    async loadExistingResume(id) {
        try {
            toast.info("Loading saved resume from database...");
            const res = await api.get(`/api/v1/resumes/${id}`);
            const data = res.data || res;
            if (data) {
                this.isWatermarked = data.isWatermarked || (!this.user.premium && this.user.hasUsedFreeQuota);

                if (data.template) {
                    this.selectedTemplate = data.template;
                    document.querySelectorAll(".tpl-pill").forEach(btn => {
                        btn.classList.toggle("active", btn.dataset.template === data.template);
                    });
                }

                if (data.personalInfo) {
                    if (data.personalInfo.fullName) document.getElementById("inpFullName").value = data.personalInfo.fullName;
                    if (data.personalInfo.email) document.getElementById("inpEmail").value = data.personalInfo.email;
                    if (data.personalInfo.phone) document.getElementById("inpPhone").value = data.personalInfo.phone;
                    if (data.personalInfo.location) document.getElementById("inpLocation").value = data.personalInfo.location;
                    if (data.personalInfo.linkedin) document.getElementById("inpLinkedin").value = data.personalInfo.linkedin;
                    if (data.personalInfo.github) document.getElementById("inpGithub").value = data.personalInfo.github;
                    if (data.personalInfo.portfolio) document.getElementById("inpWebsite").value = data.personalInfo.portfolio;
                }

                if (data.summary) document.getElementById("inpSummary").value = data.summary;
                if (data.skills) {
                    document.getElementById("inpSkills").value = Array.isArray(data.skills) ? data.skills.join("\n") : data.skills;
                }

                if (data.experience && Array.isArray(data.experience)) {
                    this.experiences = data.experience.map((e, idx) => ({ ...e, id: e.id || Date.now() + idx }));
                    this.renderExperienceInputs();
                }

                if (data.projects && Array.isArray(data.projects)) {
                    this.projects = data.projects.map((p, idx) => ({ ...p, id: p.id || Date.now() + idx + 10 }));
                    this.renderProjectInputs();
                }

                if (data.education && Array.isArray(data.education)) {
                    this.educations = data.education.map((e, idx) => ({ ...e, id: e.id || Date.now() + idx + 20 }));
                    this.renderEducationInputs();
                }

                if (data.customSections && Array.isArray(data.customSections)) {
                    this.customSections = data.customSections.map((c, idx) => ({ ...c, id: c.id || Date.now() + idx + 30 }));
                    this.renderCustomSectionInputs();
                }

                this.syncLivePreview();
                toast.success("Saved resume loaded successfully!");
            }
        } catch (err) {
            console.error("Load resume error:", err);
            toast.error("Failed to load existing resume.");
        }
    }

    initFontSizeControls() {
        const btnInc = document.getElementById("btnFontInc");
        const btnDec = document.getElementById("btnFontDec");
        const label = document.getElementById("fontSizeLabel");

        const applyFontSize = () => {
            if (label) label.textContent = `${this.fontSize}px`;
            document.querySelectorAll(".paper-resume").forEach(paper => {
                paper.style.setProperty("--resume-font-size", `${this.fontSize}px`);
            });
        };

        if (btnInc) {
            btnInc.addEventListener("click", () => {
                if (this.fontSize < 22) {
                    this.fontSize++;
                    applyFontSize();
                }
            });
        }

        if (btnDec) {
            btnDec.addEventListener("click", () => {
                if (this.fontSize > 10) {
                    this.fontSize--;
                    applyFontSize();
                }
            });
        }

        applyFontSize();
    }

    initTemplateSwitcher() {
        const buttons = document.querySelectorAll(".tpl-pill");

        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                const tpl = btn.dataset.template;
                this.selectedTemplate = tpl;

                this.syncLivePreview();
                toast.info(`Switched to ${btn.textContent} Layout`);
            });
        });
    }

    renderFormSections() {
        this.renderExperienceInputs();
        this.renderEducationInputs();
        this.renderProjectInputs();
        this.renderCustomSectionInputs();
        this.syncLivePreview();
    }

    /* Experience Inputs with Generic Placeholders */
    renderExperienceInputs() {
        const container = document.getElementById("experienceEntriesContainer");
        if (!container) return;

        let html = "";
        this.experiences.forEach((item) => {
            html += `
                <div class="dynamic-entry-box" data-id="${item.id}">
                    <button type="button" class="btn-remove-entry btn-del-exp" data-id="${item.id}" title="Remove Entry">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                    <div class="form-grid-2">
                        <div class="form-field">
                            <label>Role / Position</label>
                            <input type="text" class="exp-position" data-id="${item.id}" value="${this.escapeHTML(item.position || '')}" placeholder="Enter role / position">
                        </div>
                        <div class="form-field">
                            <label>Company / Organization</label>
                            <input type="text" class="exp-company" data-id="${item.id}" value="${this.escapeHTML(item.company || '')}" placeholder="Enter company / organization name">
                        </div>
                        <div class="form-field">
                            <label>Start Date</label>
                            <input type="text" class="exp-start" data-id="${item.id}" value="${this.escapeHTML(item.startDate || '')}" placeholder="Enter start date">
                        </div>
                        <div class="form-field">
                            <label>End Date</label>
                            <input type="text" class="exp-end" data-id="${item.id}" value="${this.escapeHTML(item.endDate || '')}" placeholder="Enter end date">
                        </div>
                    </div>
                    <div class="form-field">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label style="margin:0;">Key Action Bullet Points (1 per line)</label>
                            <button type="button" class="btn-ai-action btn-ai-role-bullets" data-id="${item.id}">
                                <i class="ri-sparkling-fill"></i> Gemini AI Bullets
                            </button>
                        </div>
                        <textarea class="exp-desc" data-id="${item.id}" rows="3" placeholder="Enter key action bullet points (1 per line) or generate using AI">${this.escapeHTML(item.description || '')}</textarea>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll(".btn-ai-role-bullets").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = Number(e.currentTarget.dataset.id);
                const pos = document.querySelector(`.exp-position[data-id="${id}"]`)?.value.trim() || document.getElementById("inpJobTitle")?.value.trim() || "Professional";
                const comp = document.querySelector(`.exp-company[data-id="${id}"]`)?.value.trim() || "Company";

                try {
                    toast.info(`Generating Gemini AI ATS Bullets for ${pos}...`);
                    const res = await api.post("/api/v1/ai/generate-resume", {
                        jobTitle: `${pos} at ${comp}`
                    });

                    const descInput = document.querySelector(`.exp-desc[data-id="${id}"]`);
                    if (descInput && res.experience && res.experience[0]?.description) {
                        descInput.value = res.experience[0].description;
                        this.readFormValues();
                        this.syncLivePreview();
                        toast.success(`ATS Bullets generated for ${pos}!`);
                    }
                } catch (err) {
                    toast.error("Failed to generate AI bullets.");
                }
            });
        });

        container.querySelectorAll(".btn-del-exp").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = Number(e.currentTarget.dataset.id);
                this.experiences = this.experiences.filter(x => x.id !== id);
                this.renderExperienceInputs();
            });
        });

        const btnAdd = document.getElementById("btnAddExperience");
        if (btnAdd) {
            btnAdd.onclick = () => {
                this.experiences.push({
                    id: Date.now(),
                    company: "",
                    position: "",
                    startDate: "",
                    endDate: "",
                    description: ""
                });
                this.renderExperienceInputs();
            };
        }
    }

    /* Education Inputs with Generic Placeholders */
    renderEducationInputs() {
        const container = document.getElementById("educationEntriesContainer");
        if (!container) return;

        let html = "";
        this.educations.forEach((item) => {
            html += `
                <div class="dynamic-entry-box" data-id="${item.id}">
                    <button type="button" class="btn-remove-entry btn-del-edu" data-id="${item.id}" title="Remove Entry">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                    <div class="form-grid-2">
                        <div class="form-field">
                            <label>Degree / Course</label>
                            <input type="text" class="edu-degree" data-id="${item.id}" value="${this.escapeHTML(item.degree || '')}" placeholder="Enter degree / course">
                        </div>
                        <div class="form-field">
                            <label>University / Institution</label>
                            <input type="text" class="edu-college" data-id="${item.id}" value="${this.escapeHTML(item.college || '')}" placeholder="Enter university / institution">
                        </div>
                        <div class="form-field">
                            <label>Year</label>
                            <input type="text" class="edu-year" data-id="${item.id}" value="${this.escapeHTML(item.year || '')}" placeholder="Enter graduation year">
                        </div>
                        <div class="form-field">
                            <label>Marks / Percentage</label>
                            <input type="text" class="edu-marks" data-id="${item.id}" placeholder="Enter marks / percentage" value="${this.escapeHTML(item.marks || '')}">
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll(".btn-del-edu").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = Number(e.currentTarget.dataset.id);
                this.educations = this.educations.filter(x => x.id !== id);
                this.renderEducationInputs();
            });
        });

        const btnAdd = document.getElementById("btnAddEducation");
        if (btnAdd) {
            btnAdd.onclick = () => {
                this.educations.push({
                    id: Date.now(),
                    degree: "",
                    college: "",
                    year: "",
                    marks: ""
                });
                this.renderEducationInputs();
            };
        }
    }

    /* Project Inputs with Generic Placeholders */
    renderProjectInputs() {
        const container = document.getElementById("projectEntriesContainer");
        if (!container) return;

        let html = "";
        this.projects.forEach((item) => {
            html += `
                <div class="dynamic-entry-box" data-id="${item.id}">
                    <button type="button" class="btn-remove-entry btn-del-proj" data-id="${item.id}" title="Remove Entry">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                    <div class="form-field">
                        <label>Project Name & Tech Stack</label>
                        <input type="text" class="proj-title" data-id="${item.id}" value="${this.escapeHTML(item.title || '')}" placeholder="Enter project name and tech stack">
                    </div>
                    <div class="form-grid-2">
                        <div class="form-field">
                            <label>GitHub Link / Text</label>
                            <input type="text" class="proj-github" data-id="${item.id}" placeholder="Enter GitHub link" value="${this.escapeHTML(item.github || '')}">
                        </div>
                        <div class="form-field">
                            <label>Live Link / Text</label>
                            <input type="text" class="proj-live" data-id="${item.id}" placeholder="Enter live demo link" value="${this.escapeHTML(item.live || '')}">
                        </div>
                    </div>
                    <div class="form-field">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label style="margin:0;">Project Bullet Points (1 per line)</label>
                            <button type="button" class="btn-ai-action btn-ai-project-bullets" data-id="${item.id}">
                                <i class="ri-sparkling-fill"></i> Gemini AI Project Bullets
                            </button>
                        </div>
                        <textarea class="proj-desc" data-id="${item.id}" rows="3" placeholder="Enter project bullet points (1 per line) or generate using AI">${this.escapeHTML(item.description || '')}</textarea>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll(".btn-ai-project-bullets").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = Number(e.currentTarget.dataset.id);
                const projTitle = document.querySelector(`.proj-title[data-id="${id}"]`)?.value.trim() || "Project Initiative";
                const targetRole = document.getElementById("inpJobTitle")?.value.trim() || "Professional";

                try {
                    toast.info(`Generating Gemini AI Project Bullets for ${projTitle}...`);
                    const res = await api.post("/api/v1/ai/generate-resume", {
                        jobTitle: `${projTitle} for ${targetRole}`
                    });

                    const descInput = document.querySelector(`.proj-desc[data-id="${id}"]`);
                    if (descInput && res.projects && res.projects[0]?.description) {
                        descInput.value = res.projects[0].description;
                        this.readFormValues();
                        this.syncLivePreview();
                        toast.success(`Project bullets generated for ${projTitle}!`);
                    }
                } catch (err) {
                    toast.error("Failed to generate AI project bullets.");
                }
            });
        });

        container.querySelectorAll(".btn-del-proj").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = Number(e.currentTarget.dataset.id);
                this.projects = this.projects.filter(x => x.id !== id);
                this.renderProjectInputs();
            });
        });

        const btnAdd = document.getElementById("btnAddProject");
        if (btnAdd) {
            btnAdd.onclick = () => {
                this.projects.push({
                    id: Date.now(),
                    title: "",
                    description: "",
                    github: "",
                    live: ""
                });
                this.renderProjectInputs();
            };
        }
    }

    /* Custom Sections with Generic Placeholders */
    renderCustomSectionInputs() {
        const container = document.getElementById("customSectionsContainer");
        if (!container) return;

        let html = "";
        this.customSections.forEach((item) => {
            html += `
                <div class="dynamic-entry-box" data-id="${item.id}">
                    <button type="button" class="btn-remove-entry btn-del-custom" data-id="${item.id}" title="Remove Section">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                    <div class="form-field">
                        <label>Custom Section Title</label>
                        <input type="text" class="custom-heading" data-id="${item.id}" value="${this.escapeHTML(item.heading || '')}" placeholder="Enter section title (e.g. Achievements)">
                    </div>
                    <div class="form-field">
                        <label>Bullets / Details (1 per line)</label>
                        <textarea class="custom-details" data-id="${item.id}" rows="3" placeholder="Enter bullet details (1 per line)">${this.escapeHTML(item.details || '')}</textarea>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll(".btn-del-custom").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = Number(e.currentTarget.dataset.id);
                this.customSections = this.customSections.filter(x => x.id !== id);
                this.renderCustomSectionInputs();
            });
        });

        const btnAdd = document.getElementById("btnAddCustomSection");
        if (btnAdd) {
            btnAdd.onclick = () => {
                this.customSections.push({
                    id: Date.now(),
                    heading: "",
                    details: ""
                });
                this.renderCustomSectionInputs();
            };
        }
    }

    initLiveSync() {
        document.addEventListener("input", () => {
            this.readFormValues();
            this.syncLivePreview();
        });
    }

    readFormValues() {
        this.experiences.forEach(item => {
            const comp = document.querySelector(`.exp-company[data-id="${item.id}"]`);
            const pos = document.querySelector(`.exp-position[data-id="${item.id}"]`);
            const st = document.querySelector(`.exp-start[data-id="${item.id}"]`);
            const en = document.querySelector(`.exp-end[data-id="${item.id}"]`);
            const desc = document.querySelector(`.exp-desc[data-id="${item.id}"]`);

            if (comp) item.company = comp.value;
            if (pos) item.position = pos.value;
            if (st) item.startDate = st.value;
            if (en) item.endDate = en.value;
            if (desc) item.description = desc.value;
        });

        this.educations.forEach(item => {
            const deg = document.querySelector(`.edu-degree[data-id="${item.id}"]`);
            const col = document.querySelector(`.edu-college[data-id="${item.id}"]`);
            const yr = document.querySelector(`.edu-year[data-id="${item.id}"]`);
            const mk = document.querySelector(`.edu-marks[data-id="${item.id}"]`);

            if (deg) item.degree = deg.value;
            if (col) item.college = col.value;
            if (yr) item.year = yr.value;
            if (mk) item.marks = mk.value;
        });

        this.projects.forEach(item => {
            const ttl = document.querySelector(`.proj-title[data-id="${item.id}"]`);
            const desc = document.querySelector(`.proj-desc[data-id="${item.id}"]`);
            const gh = document.querySelector(`.proj-github[data-id="${item.id}"]`);
            const lv = document.querySelector(`.proj-live[data-id="${item.id}"]`);

            if (ttl) item.title = ttl.value;
            if (desc) item.description = desc.value;
            if (gh) item.github = gh.value;
            if (lv) item.live = lv.value;
        });

        this.customSections.forEach(item => {
            const hd = document.querySelector(`.custom-heading[data-id="${item.id}"]`);
            const dt = document.querySelector(`.custom-details[data-id="${item.id}"]`);

            if (hd) item.heading = hd.value;
            if (dt) item.details = dt.value;
        });
    }

    formatHeaderLink(url) {
        if (!url || !url.trim()) return '';
        const trimmed = url.trim();
        const href = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
        return `<a href="${href}" target="_blank" style="color: inherit; text-decoration: underline;">${this.escapeHTML(trimmed)}</a>`;
    }

    formatProjectLink(url, label) {
        if (!url || !url.trim()) return '';
        const trimmed = url.trim();
        const href = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
        const displayLabel = label || trimmed;
        return `<a href="${href}" target="_blank" style="color: inherit; text-decoration: underline;">${this.escapeHTML(displayLabel)}</a>`;
    }

    syncLivePreview() {
        const pagesContainer = document.getElementById("pagesContainer");
        if (!pagesContainer) return;

        const name = document.getElementById("inpFullName")?.value || "";
        const subtitle = document.getElementById("inpJobTitle")?.value || "";
        const email = document.getElementById("inpEmail")?.value || "";
        const phone = document.getElementById("inpPhone")?.value || "";
        const loc = document.getElementById("inpLocation")?.value || "";
        const linkedin = document.getElementById("inpLinkedin")?.value || "";
        const github = document.getElementById("inpGithub")?.value || "";
        const website = document.getElementById("inpWebsite")?.value || "";
        const summary = document.getElementById("inpSummary")?.value || "";
        const skillsStr = document.getElementById("inpSkills")?.value || "";

        const emailLink = email ? `<a href="mailto:${email}">${this.escapeHTML(email)}</a>` : '';
        const phoneLink = phone ? this.escapeHTML(phone) : '';
        const linkedinLink = linkedin ? this.formatHeaderLink(linkedin) : '';
        const githubLink = github ? this.formatHeaderLink(github) : '';
        const websiteLink = website ? this.formatHeaderLink(website) : '';

        const totalItemsCount = this.projects.length + this.experiences.length + this.educations.length + this.customSections.length;
        const needsMultiPage = totalItemsCount >= 5 || (this.projects.length >= 3 && this.experiences.length >= 3);

        const dataObj = { name, subtitle, loc, phoneLink, emailLink, linkedinLink, githubLink, websiteLink, summary, skillsStr, projects: this.projects, experiences: this.experiences, educations: this.educations, customSections: this.customSections };

        const showWatermark = this.isWatermarked && !this.user.premium;

        if (!needsMultiPage) {
            pagesContainer.innerHTML = `
                <div class="paper-resume template-${this.selectedTemplate} ${showWatermark ? 'watermarked' : ''}" id="paperResume">
                    ${this.renderTemplateHTML(this.selectedTemplate, dataObj, 'all')}
                </div>
            `;
        } else {
            pagesContainer.innerHTML = `
                <div class="paper-resume template-${this.selectedTemplate} ${showWatermark ? 'watermarked' : ''}">
                    ${this.renderTemplateHTML(this.selectedTemplate, dataObj, 'page1')}
                </div>

                <div class="paper-resume template-${this.selectedTemplate} ${showWatermark ? 'watermarked' : ''}">
                    ${this.renderTemplateHTML(this.selectedTemplate, dataObj, 'page2')}
                </div>
            `;
        }

        document.querySelectorAll(".paper-resume").forEach(paper => {
            paper.style.setProperty("--resume-font-size", `${this.fontSize}px`);
        });
    }

    renderTemplateHTML(templateName, d, pageMode = 'all') {

        const buildHeader = () => {
            if (templateName === "latex-classic") {
                const phoneEmailRow = [d.phoneLink, d.emailLink].filter(Boolean).join(' | ');
                const linksRow = [d.linkedinLink, d.githubLink, d.websiteLink].filter(Boolean).join(' | ');
                return `
                    <div class="latex-header">
                        ${d.name ? `<h1>${this.escapeHTML(d.name)}</h1>` : ''}
                        ${d.loc ? `<div class="latex-header-loc">${this.escapeHTML(d.loc)}</div>` : ''}
                        ${phoneEmailRow ? `<div class="latex-header-phone-email">${phoneEmailRow}</div>` : ''}
                        ${linksRow ? `<div class="latex-header-links">${linksRow}</div>` : ''}
                    </div>
                `;
            } else if (templateName === "silicon-executive") {
                const contactItems = [d.loc, d.phoneLink, d.emailLink, d.linkedinLink, d.githubLink, d.websiteLink].filter(Boolean);
                return `
                    <div class="sv-top-banner">
                        ${d.name ? `<h1>${this.escapeHTML(d.name)}</h1>` : ''}
                        ${d.subtitle ? `<div class="sv-subtitle">${this.escapeHTML(d.subtitle)}</div>` : ''}
                        ${contactItems.length ? `<div class="sv-contact-flex">${contactItems.join(' • ')}</div>` : ''}
                    </div>
                `;
            } else if (templateName === "linear-sleek") {
                const contactItems = [d.loc, d.phoneLink, d.emailLink, d.linkedinLink, d.githubLink, d.websiteLink].filter(Boolean);
                return `
                    <div class="linear-header">
                        ${d.name ? `<h1>${this.escapeHTML(d.name)}</h1>` : ''}
                        ${d.subtitle ? `<div class="linear-sub">${this.escapeHTML(d.subtitle)}</div>` : ''}
                        ${contactItems.length ? `<div class="linear-contact-row">${contactItems.join(' • ')}</div>` : ''}
                    </div>
                `;
            } else {
                const contactItems = [d.loc, d.phoneLink, d.emailLink, d.linkedinLink, d.githubLink, d.websiteLink].filter(Boolean);
                return `
                    <div class="stripe-header">
                        ${d.name ? `<h1>${this.escapeHTML(d.name)}</h1>` : ''}
                        ${d.subtitle ? `<div style="font-size: 1.1em; font-weight: 700; color: #6366F1; margin-top: 2px;">${this.escapeHTML(d.subtitle)}</div>` : ''}
                        ${contactItems.length ? `<div style="font-size: 0.9em; color: #64748B; margin-top: 6px;">${contactItems.join(' • ')}</div>` : ''}
                    </div>
                `;
            }
        };

        const buildSummary = () => {
            if (!d.summary) return '';
            return `
                <div class="resume-sec">
                    <div class="sec-heading-ats">Professional Summary</div>
                    <p>${this.escapeHTML(d.summary)}</p>
                </div>
            `;
        };

        const buildSkills = () => {
            if (!d.skillsStr) return '';
            const skillLines = d.skillsStr.split('\n').filter(Boolean);
            return `
                <div class="resume-sec">
                    <div class="sec-heading-ats">Technical Skills</div>
                    ${skillLines.map(line => {
                        const colonIdx = line.indexOf(':');
                        if (colonIdx !== -1) {
                            const label = line.substring(0, colonIdx + 1);
                            const val = line.substring(colonIdx + 1);
                            return `<div class="skills-row"><strong>${this.escapeHTML(label)}</strong>${this.escapeHTML(val)}</div>`;
                        }
                        return `<div class="skills-row">${this.escapeHTML(line)}</div>`;
                    }).join('')}
                </div>
            `;
        };

        const buildProjects = () => {
            const validProjs = d.projects.filter(p => p.title || p.description);
            if (!validProjs.length) return '';
            return `
                <div class="resume-sec">
                    <div class="sec-heading-ats">Projects</div>
                    ${validProjs.map(item => `
                        <div style="margin-bottom: 12px;">
                            <div class="item-title-row">
                                <span>${this.escapeHTML(item.title)}</span>
                                <span>
                                    ${item.live ? this.formatProjectLink(item.live, 'Live') : ''}
                                    ${item.github ? `${item.live ? ' | ' : ''}${this.formatProjectLink(item.github, 'GitHub')}` : ''}
                                </span>
                            </div>
                            ${item.description ? `<ul>${item.description.split('\n').filter(Boolean).map(b => `<li>${this.escapeHTML(b)}</li>`).join('')}</ul>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        };

        const buildExperience = () => {
            const validExps = d.experiences.filter(e => e.position || e.company || e.description);
            if (!validExps.length) return '';
            return `
                <div class="resume-sec">
                    <div class="sec-heading-ats">Experience</div>
                    ${validExps.map(item => `
                        <div style="margin-bottom: 14px;">
                            <div class="item-title-row">
                                <span>${this.escapeHTML(item.position)}</span>
                                <span>${this.escapeHTML(item.startDate)}${item.endDate ? ` – ${this.escapeHTML(item.endDate)}` : ''}</span>
                            </div>
                            ${item.company ? `<div class="item-sub-row"><span>${this.escapeHTML(item.company)}</span><span></span></div>` : ''}
                            ${item.description ? `<ul>${item.description.split('\n').filter(Boolean).map(b => `<li>${this.escapeHTML(b)}</li>`).join('')}</ul>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        };

        const buildEducation = () => {
            const validEdus = d.educations.filter(e => e.degree || e.college);
            if (!validEdus.length) return '';
            return `
                <div class="resume-sec">
                    <div class="sec-heading-ats">Education</div>
                    ${validEdus.map(item => `
                        <div style="margin-bottom: 10px;">
                            <div class="item-title-row">
                                <span>${this.escapeHTML(item.degree)}</span>
                                <span>${this.escapeHTML(item.year || '')}</span>
                            </div>
                            <div class="item-sub-row">
                                <span>${this.escapeHTML(item.college)}</span>
                                <span>${this.escapeHTML(item.marks || '')}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        };

        const buildCustomSections = () => {
            const validSecs = d.customSections.filter(s => s.heading || s.details);
            if (!validSecs.length) return '';
            return validSecs.map(sec => `
                <div class="resume-sec">
                    <div class="sec-heading-ats">${this.escapeHTML(sec.heading)}</div>
                    ${sec.details ? `<ul>${sec.details.split('\n').filter(Boolean).map(d => `<li>${this.escapeHTML(d)}</li>`).join('')}</ul>` : ''}
                </div>
            `).join('');
        };

        if (templateName === "silicon-executive") {
            if (pageMode === 'page1') {
                return buildHeader() + `<div class="sv-body-pane">` + buildSummary() + buildSkills() + buildProjects() + `</div>`;
            } else if (pageMode === 'page2') {
                return `<div class="sv-body-pane" style="padding-top:24px;">` + buildExperience() + buildEducation() + buildCustomSections() + `</div>`;
            } else {
                return buildHeader() + `<div class="sv-body-pane">` + buildSummary() + buildSkills() + buildProjects() + buildExperience() + buildEducation() + buildCustomSections() + `</div>`;
            }
        } else {
            if (pageMode === 'page1') {
                return buildHeader() + buildSummary() + buildSkills() + buildProjects();
            } else if (pageMode === 'page2') {
                return buildExperience() + buildEducation() + buildCustomSections();
            } else {
                return buildHeader() + buildSummary() + buildSkills() + buildProjects() + buildExperience() + buildEducation() + buildCustomSections();
            }
        }
    }

    initRefetchHandler() {
        const btnRefetch = document.getElementById("btnRefetchData");
        if (btnRefetch) {
            btnRefetch.addEventListener("click", async () => {
                try {
                    toast.info("Refetching saved user data from server...");
                    const res = await api.get("/api/v1/resumes");
                    if (res && res.length) {
                        const saved = res[0];
                        if (saved.personalInfo) {
                            if (saved.personalInfo.fullName) document.getElementById("inpFullName").value = saved.personalInfo.fullName;
                            if (saved.personalInfo.email) document.getElementById("inpEmail").value = saved.personalInfo.email;
                            if (saved.personalInfo.phone) document.getElementById("inpPhone").value = saved.personalInfo.phone;
                            if (saved.personalInfo.location) document.getElementById("inpLocation").value = saved.personalInfo.location;
                        }
                        if (saved.summary) document.getElementById("inpSummary").value = saved.summary;
                        if (saved.skills && saved.skills.length) document.getElementById("inpSkills").value = saved.skills.join("\n");
                        this.syncLivePreview();
                        toast.success("Saved user data refetched successfully!");
                    } else {
                        toast.info("Loaded fresh workspace.");
                    }
                } catch (err) {
                    toast.error("Failed to refetch saved data.");
                }
            });
        }
    }

    /**
     * Dedicated AI Handlers
     */
    initAIHandlers() {
        const btnAutoFillAISkillsSummary = document.getElementById("btnAutoFillAISkillsSummary");
        if (btnAutoFillAISkillsSummary) {
            btnAutoFillAISkillsSummary.addEventListener("click", async () => {
                const jobTitle = document.getElementById("inpJobTitle").value.trim();
                if (!jobTitle) {
                    toast.error("Please enter the Target Job Role you are applying for.");
                    return;
                }

                try {
                    toast.info(`Calling Google Gemini AI for ${jobTitle} skills & summary...`);
                    const res = await api.post("/api/v1/ai/generate-resume", {
                        jobTitle
                    });

                    if (res.summary) {
                        document.getElementById("inpSummary").value = res.summary;
                    }

                    if (res.skills) {
                        document.getElementById("inpSkills").value = Array.isArray(res.skills) ? res.skills.join("\n") : res.skills;
                    }

                    this.syncLivePreview();
                    toast.success(`Generated ATS Skills & Summary for ${jobTitle}!`);
                } catch (err) {
                    toast.error("AI Generation failed. Please try again.");
                }
            });
        }
    }

    /**
     * Seamless Save & Export Paywall Enforcement
     */
    initActionButtons() {
        const btnSave = document.getElementById("btnSaveResume");
        if (btnSave) {
            btnSave.addEventListener("click", async (e) => {
                if (e) e.preventDefault();

                if (!Storage.isLoggedIn()) {
                    toast.error("Please login to save your resume.");
                    window.location.href = "../login.html";
                    return;
                }

                this.readFormValues();
                const fullName = document.getElementById("inpFullName").value.trim();
                const jobTitle = document.getElementById("inpJobTitle").value.trim();
                const title = `${fullName || "Professional"} Resume${jobTitle ? ` — ${jobTitle}` : ''}`;

                const payload = {
                    title,
                    template: this.selectedTemplate,
                    personalInfo: {
                        fullName: fullName,
                        email: document.getElementById("inpEmail").value.trim(),
                        phone: document.getElementById("inpPhone").value.trim(),
                        location: document.getElementById("inpLocation").value.trim(),
                        linkedin: document.getElementById("inpLinkedin").value.trim(),
                        github: document.getElementById("inpGithub").value.trim(),
                        portfolio: document.getElementById("inpWebsite").value.trim()
                    },
                    summary: document.getElementById("inpSummary").value.trim(),
                    skills: document.getElementById("inpSkills").value.split("\n").map(s => s.trim()).filter(Boolean),
                    experience: this.experiences.filter(e => e.position || e.company || e.description),
                    education: this.educations.filter(e => e.degree || e.college),
                    projects: this.projects.filter(p => p.title || p.description),
                    customSections: this.customSections.filter(c => c.heading || c.details),
                    atsScore: 98
                };

                const originalHTML = btnSave.innerHTML;
                btnSave.disabled = true;
                btnSave.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Saving...`;

                try {
                    toast.info("Saving resume to MongoDB database...");
                    
                    let response;
                    if (this.resumeId) {
                        response = await api.put(`/api/v1/resumes/${this.resumeId}`, payload);
                    } else {
                        response = await api.post("/api/v1/resumes", payload);
                    }

                    const savedObj = response.data || response;
                    if (savedObj && savedObj._id) {
                        this.resumeId = savedObj._id;
                        this.isWatermarked = savedObj.isWatermarked || (!this.user.premium && this.user.hasUsedFreeQuota);
                    }

                    toast.success("Resume saved successfully to database!");
                    setTimeout(() => {
                        window.location.href = "dashboard.html";
                    }, 1200);
                } catch (err) {
                    console.error("Save resume database error:", err);
                    toast.error(err.message || "Failed to save resume to database.");
                    btnSave.disabled = false;
                    btnSave.innerHTML = originalHTML;
                }
            });
        }

        const btnExportPDF = document.getElementById("btnExportPDF");
        if (btnExportPDF) {
            btnExportPDF.addEventListener("click", (e) => {
                if (e) e.preventDefault();

                if (this.isWatermarked && !this.user.premium) {
                    toast.error("PDF Export Locked! Watermarked preview can only be downloaded after Pro upgrade or purchasing a single pass.");
                    setTimeout(() => {
                        window.location.href = "dashboard.html";
                    }, 1500);
                    return;
                }

                toast.info("Opening Multi-Page PDF Print Window...");
                window.print();
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
