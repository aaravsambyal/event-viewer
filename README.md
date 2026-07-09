<div align="center">
   <h1> Event Viewer 🏛️ </h1>

   <img src="https://img.shields.io/badge/Tailwind_CSS-3178C6?style=for-the-badge" />
   <img src="https://img.shields.io/badge/TypeScript-38B2AC?style=for-the-badge" />
   <img src="https://img.shields.io/badge/Next.js-1AFCDA?style=for-the-badge" />
   <img src="https://img.shields.io/badge/SQLite-003BFF?style=for-the-badge" />
   <img src="https://img.shields.io/badge/Event-Viewer-004DAA?style=for-the-badge" />
</div>

## 📌 Overview

**Event Viewer** is a template site for a high-performance, hierarchical image archiving system designed for institutions. It provides a state-of-the-art OneDark aesthetic with an interactive particle-driven UI, ensuring official event photography is preserved with departmental precision and administrative oversight.

## 🎯 Objectives

- Organize events into main and sub-events for structured documentation.
- Restrict upload access based on departmental assignments and officer roles.
- Deliver a professional, dark-themed experience with fluid animations and micro-interactions.
- Robust authentication for officers and administrators to manage digital assets.

## 🛠 Features

- **Interactive UI**: Premium particle field background that reacts to mouse movements in real-time, implemented in [`MouseGlow.tsx`](components/MouseGlow.tsx).
- **Hierarchical Events**: Support for Main events and Sub-events with inherited image galleries, managed in [`route.ts`](app/api/events/[id]/images/route.ts).
- **Role-Based Access**: Secure login and permission levels for Admins and Departmental Members.
- **Image Gallery**: Fast, responsive image documentation with metadata and uploader tracking.
- **Mobile Responsive**: Fully optimized layout for all devices using modern CSS variables and flexbox.

## 🎨 Color Palette Reference (OneDark Theme)

| Palette     | Background                                              | Surface                                                 | Accent (Gold)                                           | Text                                                    |
| :---------- | :------------------------------------------------------ | :------------------------------------------------------ | :------------------------------------------------------ | :------------------------------------------------------ |
| **OneDark** | ![#21252b](https://img.shields.io/badge/-21252b-21252b) | ![#282c34](https://img.shields.io/badge/-282c34-282c34) | ![#e5c07b](https://img.shields.io/badge/-e5c07b-e5c07b) | ![#abb2bf](https://img.shields.io/badge/-abb2bf-abb2bf) |

## 📁 Project Structure

```text
.
├── app/                # Next.js App Router (Pages & APIs)
│   ├── admin/          # Administrative dashboards
│   ├── member/         # Officer/Member dashboards
│   ├── api/            # Backend API routes (SQLite interactions)
│   └── globals.css     # Central OneDark Design System
├── components/         # Reusable UI Components
│   ├── MouseGlow.tsx   # Interactive particle engine
│   ├── Navbar.tsx      # Glassmorphic navigation
│   ├── Sidebar.tsx     # Role-based sidebar
│   └── EventCard.tsx   # Premium event display cards
├── lib/                # Database and Auth utilities
└── public/             # Static assets and uploads
```

## 🚀 Working

1. **Authentication**: Officers sign in via the secure login portal to access their dashboard.
2. **Event Creation**: Admins create Main events (e.g., "National Day"). Members can create Sub-events (e.g., "Department Parade") linked to main ones.
3. **Image Archiving**: Authorized officers upload documentation. Main events automatically aggregate images from all nested sub-events.
4. **Public Access**: Citizens can browse public event galleries in a highly performant, visually stunning interface.

## ⚙️ Installation & Usage

### 1 Clone the repository

[![Git](https://img.shields.io/badge/Git-F05032?style=plastic&logo=git&logoColor=white)](https://git-scm.com/)
[![Project](https://img.shields.io/badge/Project-Repository-blue?style=plastic&logo=github&logoColor=white)](https://github.com/akshat-jasrotia/event-viewer)

```bash
git clone https://github.com/akshat-jasrotia/event-viewer.git
cd event-viewer
```

### 2 Install dependencies

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=plastic&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

```bash
npm install
```

### 3 Run the Application

```bash
npm run dev
```

Open your browser and visit: `http://localhost:3000`

## 📽️ Visuals & Results

### 🏠 Homepage

<p align="center">
  <img src="results/homepage.png" width="45%" />
</p>

### 🛡️ Admin Login

<p align="center">
  <img src="results/admin_account.png" width="45%" />
</p>

### 🔐 Login

<p align="center">
  <img src="results/login.png" width="45%" />
</p>

### 👤 Member Creation

<p align="center">
  <img src="results/member_creation.png" width="45%" />
</p>
### 🎪 Event Creation

<p align="center">
  <img src="results/event_creation.png" width="45%" />
</p>

### 🎪 Sub Event Creation

<p align="center">
  <img src="results/sub_event_creation_admin.png" width="45%" />
  <img src="results/sub_event_creation_member.png" width="45%" />
</p>

### 📂 Drill Down View

<p align="center">
  <img src="results/drill_down_view.png" width="30%" />
  <img src="results/drill_down_view_inside_event.png" width="30%" />
  <img src="results/drill_down_view_images.png" width="30%" />
</p>

### 🖼️ Images View

<p align="center">
  <img src="results/images_view_images.png" width="45%" />
  <img src="results/images_view_evnet_wise_images.png" width="45%" />
</p>

### 🌳 Tree View

<p align="center">
  <img src="results/tree_view.png" width="45%" />
</p>

### 🎬 Demo Video

[results/video.mp4](results/video.mp4)

## 🔮 Future Roadmap

> Cleaner UI and better UX.

## 👤 Author

[![Email](https://img.shields.io/badge/Email-D14836?style=plastic)](mailto:akshatjasrotia85@gmail.com)
[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=plastic)](https://youtube.com/@akshatjasrotia)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=plastic)](https://https://github.com/akshat-jasrotia)
