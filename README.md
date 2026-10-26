# CED Grant Management System — Anna University

> **Centre for Entrepreneurship Development (CED), Anna University**  
> Complete web portal for end-to-end management of the Innovation Voucher Programme (IVP) & Student Startup Grants.

---

## 🌟 Key Features

### 🏢 Administrator Portal
- **Grant Workflow Pipeline**: Full lifecycle tracking across 10 stages from initial application to final tranche disbursements.
- **Reviewer Assignment & Scoring**:
  - Panel evaluators (e.g. Arun Kumar R, Sakthivel S) with individual criterion scores, remarks, and approval statuses.
  - Team/Reviewer evaluation dashboard detailing who evaluated whom and when.
- **Targeted Notification Broadcast**:
  - Broadcast urgent notices or bulletins to all startups, specific cohorts/batches (e.g. Batch 2026-27), pipeline stages (e.g. *Students who completed CED Evaluation*), or individual students.
- **Documents & Drive Links Central Repository**:
  - Centralized tracking for:
    1. Presentation Pitch Deck
    2. College Consent & Bonafide Letter
    3. Detailed Budget & Funding Template
    4. MSME Udyam Registration Certificate
    5. Bank Passbook / Cancelled Cheque Proof (DBT)
    6. Working Prototype Demo Video / CAD Drive Folder
  - Quick "Open Link", "Copy Link", and inline Drive link update tools.
- **Full Startup Directory & Drawer**:
  - Comprehensive 5-tab startup drawer with WhatsApp direct connect, print/save PDF, stage advancing, and milestone release tracking.
- **Excel Import & Export**: One-click import and export of applicants and scores.
- **Soft Delete & Trash Recovery**: Recycle bin in Settings with full restore capability.

### 🎓 Student Founder Portal
- **Simple, Uniform Student Authentication**:
  - Phone number as username.
  - Password fixed to the last 4 digits of phone number + `ivp` (e.g. `9443533618` → password `3618ivp`).
- **7-Stage Incubation Roadmap**:
  - Complete visibility into all 7 incubation milestones with an active **"YOU ARE HERE"** indicator, percentage progress, and completion checks.
- **Reviewer Evaluation Particulars**:
  - View individual panel evaluator scores, technical marks, and panel feedback.
- **Full Profile & Missing Data Entry**:
  - 6 organized tabs allowing students to fill missing email, roll number, college branch, MSME Udyam details, bank DBT accounts, and Google Drive document links.
- **My Documents & Drive Links**:
  - Dedicated page to attach, test, and save Google Drive links for all required grant documents.
- **Notifications & Bulletins**:
  - Real-time notification banners and inbox for targeted admin broadcasts.

---

## 🛠️ Tech Stack
- **Frontend Framework**: React 18, Vite
- **Styling**: Vanilla CSS with a bespoke, polished design system tailored for Anna University CED.
- **Icons**: Custom SVG Icon system
- **Build Tool**: Vite 6 (Fast Refresh & Rollup optimization)
- **Deployment**: Vercel, Netlify, Cloudflare Pages, or static hosting.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/GurusharanS0906/CEDIVP.git

# Navigate into project directory
cd CEDIVP

# Install dependencies
npm install

# Start development server
npm run dev
```
The application will run locally at `http://localhost:3000/`.

### Production Build
```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

---

## 🔐 Demo Credentials
- **Admin Portal**:
  - Username: `admin`
  - Password: `adminivp` or `admin123`
- **Student Portal**:
  - Mobile: Any registered student phone number (e.g. `9443533618`)
  - Password: Last 4 digits of phone + `ivp` (e.g. `3618ivp`)

---

## 📄 License
Centre for Entrepreneurship Development (CED), Anna University, Chennai. All rights reserved.
