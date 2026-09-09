# React Migration Plan

You hit the nail on the head! For long-term, professional development, moving away from a single massive `index.html` file to a modular framework is absolutely the right move. 

Since I just checked and saw that you have **Node.js (v24)** and **npm** successfully installed on your machine, you are fully equipped for this!

## 💡 My Recommendation: Vite + React
I highly recommend we use **React** powered by **Vite**. 
- **React** allows us to break down our UI into reusable "components" (like `<Header />`, `<Sidebar />`, and `<KPICard />`), making the code clean, manageable, and professional.
- **Vite** is a modern build tool that makes React development lightning-fast.

*Note on Node.js:* Node.js is the runtime that will build and serve our React code during development. Our actual backend API (Phase 2) will still be written in **Python (FastAPI)**, as Python is the absolute best choice for the Machine Learning and high-frequency data processing required for Condition Monitoring.

## ⚠️ User Review Required

> [!WARNING]
> **Major Restructuring**
> This process will involve creating a new folder structure, breaking apart our `index.html` file into dozens of smaller files, and installing `npm` dependencies. It will take a few steps to get the React version looking exactly like our current Vanilla JS version.

## ❓ Open Questions

1. **New Folder Name:** Should I create the new React project in a folder called `frontend-react/` so we can keep the old `frontend/` folder as a backup just in case?
2. **Component Library:** Would you like to keep using our 100% custom Vanilla CSS styles (which looks beautiful and unique), or would you prefer I install a CSS framework like **TailwindCSS** to speed up future styling? *(I recommend keeping our custom CSS to preserve the exact look we spent so much time perfecting).*

## 🛠️ Proposed Changes

### 1. Project Initialization
- [ ] Run `npx create-vite@latest frontend-react --template react` to scaffold the project.
- [ ] Install necessary UI dependencies (like `lucide-react` for icons and `chart.js` for our graphs).

### 2. Architecture & Styling
- [ ] Move our custom CSS variables and base styles from `index.html` into `src/index.css`.
- [ ] Setup the core layout wrapper (`AppLayout.jsx`) including the Sidebar and Header.

### 3. Component Migration
- [ ] Extract the Login screen into `src/pages/LoginPage.jsx`.
- [ ] Extract the Dashboard UI into `src/pages/DashboardPage.jsx`.
- [ ] Convert the `simulate()` Javascript data loop into React `useEffect` hooks.

## 🧪 Verification Plan

1. **Development Server:** We will run `npm run dev` and open the local React server in your browser.
2. **Visual Parity Check:** We will click through the React app to ensure it looks and behaves **exactly** identical to our original Vanilla JS version.
