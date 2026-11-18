# RIT CSE Guild — GDG on Campus RIT Hassan

Official website and role-based portal for the **Department of Computer Science and Engineering Student Club** at **Rajeev Institute of Technology (RIT), Hassan**, organized in collaboration with **GDG on Campus – RIT Hassan** for **CODESTORM 2026 – November Edition**.

**Tagline:** *Think. Create. Innovate. Build the Future.*

## Key Sections & Features

- **Official Organizers & Logos:** Displays all three official institutional logos (`Clg-Logo.jpeg`, `Dept-Logo.jpeg`, `GDG_CLUB-logo.jpeg`) prominently on the home page and in the footer.
- **Interactive Three.js 3D Compute Core:** Procedural multi-part 3D centerpiece in the hero with studio PBR lighting, drag-to-orbit controls, and a collapsible control dock (`Assembled`, `Exploded`, `Blueprint`, `Pause/Play`, `Reset`).
- **Firebase Authentication & Cloud Firestore Database:**
  - **Admin Console (Principal, CSE HOD, Faculty Advisor, Student Coordinator):** Sign in with Google Authentication to view total club students, designated Club Heads & Domain Leads, semester breakdowns, approve or decline join requests, add/promote/remove club members, check in event participants (with CSV export), create events, review contact inquiries, and authorize additional Principal/HOD/Coordinator emails.
  - **Member Portal:** Approved club members sign in with Google to view their USN standing, attendance rate, designated club heads, registered event passes, and edit their domain profile.
  - **Join Club & Participant Registration:** Students submit membership requests and register for CODESTORM 2026 & workshops with real-time seat tracking stored in Firestore.
- **Student Open-Source Projects & Resource Vault:** Domain-filterable project showcase, architecture inspector, student project submission, guided study tracks, and mentorship slots.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Three.js, Lucide React
- **Authentication & Database:** Firebase Authentication (Google Sign-In) & Cloud Firestore (`firebase-applet-config.json`, `firestore.rules`, `firebase-blueprint.json`)

## Firestore Database Collections

- `admins/{adminKey}` — Authorized governance officials (`Principal`, `HOD`, `Faculty Advisor`, `Student Coordinator`)
- `members/{memberId}` — Approved CSE club student records (protected so only owners & admins read PII)
- `clubHeads/{headId}` — Public directory of designated Club Heads and Domain Leads
- `joinRequests/{requestId}` — Membership applications (`pending`, `approved`, `rejected`)
- `events/{eventId}` — CODESTORM 2026 & technical club schedule with live `seatsRemaining`
- `registrations/{registrationId}` — Participant passes and check-in states
- `projects/{projectId}` — Student open-source builds
- `inquiries/{inquiryId}` — Contact & workshop proposal queue
- `meta/clubStats` — Aggregate public counters (`totalMembers`, `totalHeads`, `totalEvents`, `totalRegistrations`)

## Local Development

```bash
npm install
npm run dev
```

Build production bundle (`dist/`):

```bash
npm run build
```

## Push to GitHub & Deploy

```bash
git init
git add .
git commit -m "Initial commit: RIT CSE Guild & GDG on Campus CODESTORM 2026 portal"
git branch -M main
git remote add origin https://github.com/<your-username>/rit-cse-guild-codestorm-2026.git
git push -u origin main
```

Deploy the built `dist/` bundle to **Firebase Hosting**, **Vercel**, **Netlify**, or use the **Deploy** action in Google AI Studio.
