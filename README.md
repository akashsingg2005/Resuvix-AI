# 🚀 Resuvix AI — AI-Powered Resume Builder, ATS Checker & Career Platform

[![Live Frontend](https://img.shields.io/badge/Live%20Demo-Cloudflare%20Pages-orange?style=for-the-badge&logo=cloudflare)](https://resuvix-ai.pages.dev/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-AI%20Engine-purple?style=for-the-badge&logo=google)](https://ai.google.dev/)

**Resuvix AI** is a full-stack, enterprise-grade AI career platform built using **HTML5, CSS3, JavaScript (ES6+), Node.js, Express, and MongoDB Atlas**. It is designed to help job seekers land 3x more interviews with a free ATS resume checker, an interactive AI resume builder with live A4 auto-pagination, a job-tailored AI cover letter generator, and an AI technical & HR mock interview simulator.

---

## 🛠️ Tech Stack & Technologies

### 🎨 Frontend
- **HTML5**: Semantic markup, accessible forms, structured modals, Open Graph / JSON-LD schema metadata.
- **CSS3**: Custom design architecture (`global.css`, `components.css`, `builder.css`, `dashboard.css`), Flexbox/Grid layouts, CSS variables, glassmorphism UI, keyframe animations, and 100% mobile-responsive breakpoints.
- **JavaScript (ES6+)**: Modular client architecture, Async/Await fetch/axios services, DOM-scoped state synchronization, live A4 document engine, dynamic event delegation, and real-time PDF generation.

### ⚙️ Backend & Infrastructure
- **Node.js**: Asynchronous event-driven server runtime environment.
- **Express.js**: REST API server framework handling authentication, rate-limiting, and AI prompt engineering.
- **MongoDB Atlas & Mongoose**: Distributed cloud NoSQL database storing user profiles, resumes, and audit history.
- **Google Gemini AI API**: Advanced generative AI models powering resume summary generation, bullet points, cover letters, and interview feedback.
- **Brevo & Resend HTTPS APIs**: HTTPS-based transactional email APIs bypassing platform SMTP port restrictions.
- **Razorpay**: Payment gateway integration for subscription billing.
- **Cloudflare Pages & Render**: Dual-cloud hosting for fast static frontend delivery and backend API execution.

---

## 🌟 Key Features

### 1. 🎯 Free ATS Resume Checker & Scanner
- **100-Point Audit Engine**: Analyzes formatting, contact placement, section headings, and job description keyword match.
- **ATS Compliance Verification**: Benchmarks resumes against top applicant tracking systems like **Workday, Greenhouse, and Lever**.
- **Actionable Gap Analysis**: Highlights missing keywords, weak impact bullet points, and formatting errors with instant fix recommendations.

### 2. 📄 Interactive AI ATS Resume Builder
- **Multiple Professional Templates**: Switch seamlessly between *Classic LaTeX ATS*, *Silicon Executive*, *Linear Minimalist*, and *Stripe Corporate*.
- **Google Gemini AI Auto-Fill**: Auto-generate role-matched professional summaries and high-impact action bullet points with a single click.
- **Continuous Live A4 Preview**: Side-by-side interactive paper preview with adjustable font scaling.
- **Clean PDF Export**: Export high-resolution, ATS-parsable PDF documents without layout distortion.

### 3. ✍️ Role-Matched AI Cover Letter Generator
- **Targeted Application Writing**: Generates personalized cover letters tailored to your resume and specific job descriptions.
- **Live A4 Paper Preview**: Real-time editable preview with high-res PDF download.

### 4. 🎙️ AI Technical & HR Mock Interview Practice
- **Role & Tech Stack Tailored**: Practice interactive mock interviews for Software Engineering, Frontend/Backend, HR, Product, Data Science, and custom roles.
- **Real-Time Answer Scoring**: Get instant AI feedback on code clarity, STAR method structure, and technical accuracy.

### 5. 📧 High-Reliability Email Delivery & Auth
- **Brevo & Resend HTTPS Email API**: Uses HTTPS-based email APIs to bypass cloud platform outbound SMTP port blocks for 100% reliable OTP delivery.
- **Secure Authentication**: JWT-based session security with bcrypt password hashing.

### 6. 💳 Flexible Pricing & Payments
- **Razorpay Integration**: Supports Pro Pass subscription (₹499/year) and Single Pass (₹49 one-time).

---

## 🏗️ Architecture & Project Structure

```text
Resuvix-AI/
├── client/                      # Frontend Web Application (Hosted on Cloudflare Pages)
│   ├── assets/                  # Logos, favicon, icons, graphics
│   ├── css/                     # Global, builder, dashboard, home responsive CSS
│   ├── js/                      # Frontend JS Modules
│   │   ├── api.js               # Centralized Axios API Service
│   │   ├── auth.js              # Authentication UI & Session Handlers
│   │   ├── builder.js           # Dynamic Resume Builder & Live Preview Engine
│   │   ├── ats-checker.js       # Resume ATS Audit & Upload UI
│   │   ├── cover-letter.js      # Cover Letter Generator Engine
│   │   ├── interview-prep.js    # Interactive Mock Interview Engine
│   │   └── dashboard.js        # User Dashboard & Saved Documents
│   ├── pages/                   # Feature Pages (builder.html, ats-checker.html, etc.)
│   ├── index.html               # Main Landing Page (SEO Optimized with Schema.org)
│   ├── robots.txt               # Search Engine Crawler Directives
│   ├── sitemap.xml              # Google Search Sitemap
│   └── _headers                 # Cloudflare Pages Security & Header Rules
│
└── server/                      # Node.js/Express REST API (Hosted on Render)
    ├── src/
    │   ├── config/              # Environment & Database Connections
    │   ├── controllers/         # API Endpoint Handlers (Auth, Resumes, AI, Payment)
    │   ├── middlewares/         # JWT Auth, Rate Limiter, Error Handler
    │   ├── models/              # MongoDB Mongoose Schemas (User, Resume, Audit)
    │   ├── routes/              # Express API Routes
    │   ├── services/            # Brevo/Resend Email & Gemini AI Services
    │   ├── utils/               # Helpers & Utility Functions
    │   └── app.js               # Main Express Application Setup
    ├── server.js                # Node Server Entry Point & DNS Settings
    └── package.json             # Server Dependencies & Scripts
```

---

## ⚙️ Environment Variables Reference

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/resuvix?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Email Service (Brevo HTTPS API)
BREVO_API_KEY=your_brevo_api_key

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend Origin
CLIENT_URL=https://resuvix-ai.pages.dev
```

---

## 🚀 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/) account or local MongoDB instance
- [Google Gemini API Key](https://ai.google.dev/)

### 1. Clone Repository
```bash
git clone https://github.com/akashsingg2005/Resuvix-AI.git
cd Resuvix-AI
```

### 2. Setup & Run Backend Server
```bash
cd server
npm install
npm run dev
```
The backend server will run on `http://localhost:5000`.

### 3. Setup & Run Frontend Client
You can serve the `client/` folder using any local HTTP server (e.g. `npx serve client` or VS Code Live Server):
```bash
npx serve client -p 3000
```
Open `http://localhost:3000` in your browser.

---

## 🌐 Deployment Details

| Component | Platform | Deployment URL |
|---|---|---|
| **Frontend Client** | Cloudflare Pages | [https://resuvix-ai.pages.dev/](https://resuvix-ai.pages.dev/) |
| **Backend REST API** | Render | [https://resuvix-ai.onrender.com](https://resuvix-ai.onrender.com) |

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🎟️ Custom Coupons & Special Offers

For custom promo code creation, student discounts, institutional access, or bulk credits, reach out directly:

- 📩 **Coupon & Discount Enquiries**: [`akashsingg23@gmail.com`](mailto:akashsingg23@gmail.com)
- 📝 **Subject Line**: `[Resuvix AI] Custom Coupon / Offer Request`

---

## 💬 Contact & Support

- **Official Platform**: [Resuvix AI](https://resuvix-ai.pages.dev/)
- **Support Email**: [`akashsingg23@gmail.com`](mailto:akashsingg23@gmail.com)
- **GitHub Repository**: [@akashsingg2005](https://github.com/akashsingg2005)