# Bajiwala Baji365 Official Agent List - Full-Stack Dynamic Web App

Official and verified Bajiwala Baji365 Master, Super, Admin & Sub Admin agent directory web application built with **Next.js**, **MongoDB**, and **Firebase Authentication**, optimized for deployment on **Vercel**.

---

## Features

- **Dynamic 4-Category Agent Management**: Full CRUD for **Admin**, **Sub Admin**, **Super**, and **Master** agents.
- **Dedicated Category Pages**:
  - `/` - All Verified Agents with live category tabs.
  - `/admin-agent` - Admin Agents.
  - `/sub-admin-agent` - Sub Admin Agents.
  - `/super-agent` - Super Agents.
  - `/master-agent` - Master Agents.
  - `/agent-list` & `/verify-agent` - Agent search & verification tools.
- **Dynamic Complain WhatsApp System**: Header Complain button automatically links to the configured WhatsApp number.
- **Protected Admin Panel (`/admin`)**:
  - Firebase Authentication (Email/Password).
  - Add, Edit, and Delete agents with modal forms.
  - Update Complain WhatsApp number with instant site-wide propagation.
  - Fully mobile responsive for tablets and mobile devices.
- **100% Faithful UI**: Exact dark luxury gold theme, typography, badges, and responsive layouts preserved.

---

## Environment Variables

Copy `.env.example` to `.env.local` or set these in your **Vercel Project Settings > Environment Variables**:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/velkiaglistdemo?retryWrites=true&w=majority

# Firebase Authentication Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## Getting Started Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.
4. Access Admin Panel at [http://localhost:3000/admin](http://localhost:3000/admin).

---

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repository in [Vercel Dashboard](https://vercel.com/new).
3. Set the Environment Variables (`MONGODB_URI`, `NEXT_PUBLIC_FIREBASE_*`).
4. Click **Deploy**.
