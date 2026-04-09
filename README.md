# ScholarSeva – Scholarship Finder for Students

## 📌 PROJECT OVERVIEW
ScholarSeva is a scholarship discovery and **decision-support platform** designed to help students easily find, evaluate, and choose the most suitable scholarships. Unlike traditional listing sites, ScholarSeva focuses on guiding students through the complex landscape of financial aid with personalized insights and intelligent recommendations.

---

## ❗ PROBLEM STATEMENT
Finding the right scholarship in India is often a daunting task for students due to several challenges:
* **Information Overload:** Platforms like the National Scholarship Portal and Buddy4Study list thousands of options, making it hard to filter through the noise.
* **Poor User Experience:** Complex navigation and cluttered interfaces often lead to student frustration.
* **Lack of Clarity:** Difficulty in identifying which scholarships are actually relevant to a student's specific profile.
* **No Strategic Guidance:** Existing platforms fail to provide answers to critical questions:
  * Which scholarship is the "best" fit for me?
  * Do I really meet all the eligibility criteria?
  * How should I prioritize my applications?

> **"Existing platforms provide access, but not guidance."**

---

## 💡 SOLUTION
ScholarSeva transforms the scholarship search from a tedious task into a guided experience:
* **Smart Filtering:** A multi-dimensional filtering and scoring system.
* **Personalized Experience:** Results tailored to the user's specific socioeconomic and educational profile.
* **AI-Powered Insights:** Deep analysis of scholarship details to provide context and clarity.
* **Decision Support:** Tools to compare, track, and prioritize applications strategically.

---

## 🚀 FEATURES

### 🧠 Core Features
* **Advanced Filtering:** Instant filtering by Category (SC/ST/OBC/Gen), Income Range, State of Residence, and Education Level.
* **Dynamic Scholarship Cards:** High-level summary views with match indicators.
* **Detailed Modal View:** In-depth information about benefits, eligibility, and deadlines without leaving the page.
* **Official Redirection:** Seamless links to official government and private portals for final application.

### 📊 Advanced Features
* **Match Score & Success Percentage:** Proprietary algorithm that calculates how well a student fits a scholarship.
* **Smart Recommendation System:** Automatically highlights high-probability opportunities.
* **Scholarship Comparison:** Side-by-side comparison of up to 3 scholarships to evaluate benefits and requirements.
* **Application Tracker:** Manage the student journey through categories like Saved, Interested, Applied, and Completed.
* **Deadline Alerts:** Visual indicators for closing dates to ensure no opportunity is missed.

### 🤖 AI Features (Powered by OpenRouter)
* **AI "Why This Match?":** Provides clear, personalized bullet points explaining the eligibility match.
* **AI Quick Summary:** Condenses long, complex scholarship descriptions into digestible key info.
* **AI Compare Summary:** Generates a structured conclusion on which scholarship is better for the user’s specific profile.
* **AI Best Choice Suggestion:** Scans all available options to recommend the absolute best student-scholarship fit.
* **AI Priority Alert:** Intelligent analysis of deadlines and match scores to suggest what to apply for first.
* **AI Chatbot Assistant:** A dedicated helper to answer specific questions about scholarship eligibility and application steps.

### 🔐 User Features
* **Secure Auth:** LocalStorage-based Login and Registration system.
* **Persistent Profile:** Save socioeconomic details once to apply them across all filtering and scoring.
* **Personalized Dashboard:** A central hub for saved scholarships and application progress.

---

## ⚙️ TECHNOLOGIES USED

### Frontend
* **HTML5:** Semantic structure.
* **CSS3:** Modern, responsive design including dark mode and glassmorphism.
* **Vanilla JavaScript:** High-performance logic without heavy framework overhead.

### Backend
* **Node.js & Express.js:** Robust proxy backend for secure AI API communication.

### Data & AI
* **JSON:** Local data store for scholarship listings (`scholarships.json`).
* **localStorage:** Client-side persistence for user profiles and application tracking.
* **OpenRouter API:** Integrating diverse LLM models (GPT-3.5, Claude-3, Mistral) for intelligent insights.

---

## 🧠 HOW IT WORKS
1. **Profile Entry:** User signs up and provides socioeconomic/educational details.
2. **Scoring & Filtering:** The system automatically filters the database and assigns a Match Score to each scholarship.
3. **AI Enhancement:** OpenRouter-powered models generate explanations and summaries for the top matches.
4. **Action & Tracking:** The user compares top choices, saves their favorites, and tracks their application status through to completion.

---

## 🎯 PROJECT HIGHLIGHT
**“Unlike traditional platforms, ScholarSeva focuses on decision-making rather than just discovery.”**

We don't just tell you what's available; we tell you what's right for **you**.

---

## 🧪 FUTURE IMPROVEMENTS
* **Real-time API Integration:** Connection with live government scholarship feeds.
* **Document Verification AI:** Automated checking of eligibility documents using OCR and LLMs.
* **Native Notification System:** Browser and email alerts for upcoming deadlines.
* **Full Cloud Backend:** Migrating from localStorage to a dedicated database (MongoDB/PostgreSQL) for cross-device sync.

---

## 🎤 FINAL LINE
**ScholarSeva transforms scholarship discovery into an intelligent, guided decision-making experience.**