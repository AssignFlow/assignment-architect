# AssignFlow – Assignment Architect

AssignFlow (codename: **assignment-architect**) is a student-focused productivity web app that turns messy assignment instructions into clear, step‑by‑step action plans.

Students paste an assignment prompt, syllabus snippet, or rubric, and AssignFlow helps them break it down into tasks, mini‑deadlines, and a simple schedule so starting becomes the easiest part.

> Tech stack: Vite + React + TypeScript + shadcn/ui, Supabase (auth + database), deployed via Vercel.  
> UI scaffolded with Lovable and customized in VS Code.

---

## Features (MVP)

- Paste assignment instructions into a parser workspace  
- Add metadata: title, course, due date  
- Generate a structured overview of the assignment (type, due date, effort estimate, key requirements)  
- Auto-created task list (sub‑steps, estimated time, suggested order)  
- Assignment detail view with checklist, notes, and progress tracking  
- Dashboard with:
  - “Today’s focus”
  - Upcoming deadlines
  - Recent assignments  
- Per‑user accounts (Supabase auth)  
- Persistent storage of assignments and tasks per user  
- Responsive UI with modern design, light/dark mode

---

## Project structure

High‑level layout:

- `src/` – React app (pages, components, hooks, styles)  
- `public/` – static assets  
- `supabase/` – Supabase config, migrations, and types  
- `index.html` – Vite entry HTML  
- `vite.config.ts` – Vite configuration  
- `tailwind.config.ts` / `postcss.config.js` – styling setup  
- `.env` – environment variables (never commit secrets)

---

## Getting started (local dev)

1. **Clone the repo**

   ```bash
   git clone git@github.com:AssignFlow/assignment-architect.git
   cd assignment-architect
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set environment variables**

   Create a `.env` file in the project root (if Lovable/Supabase did not already create one) and add the required keys, for example:

   ```bash
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

   (Use your actual Supabase project values.)

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open the printed `http://localhost:####` URL in your browser.

---

## Supabase

This project uses Supabase for:

- Email/password authentication  
- User profiles  
- Assignments and tasks storage  

Database tables (planned):

- `profiles` – user profile data  
- `assignments` – one row per assignment  
- `assignment_tasks` – tasks linked to assignments  
- `user_preferences` – theme/planning preferences per user  

Migrations and config live in the `supabase/` folder.

---

## Deployment

Recommended deployment flow:

- Source control: GitHub (this repo)  
- Backend: Supabase project connected via environment variables  
- Hosting: Vercel (build the Vite app and serve static assets + API routes)

---


---

### TODO:
- Calendar-style view of mini‑deadlines  
- Sharing / export options for plans  
- Make Action Plan Draggable
- Due date drop down
- Fix Due date off by a day

## License

TBD.
