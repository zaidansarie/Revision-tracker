# ZaidRev - Personal Revision Tracker

A clean, responsive revision tracking progressive web application designed for personal use on mobile phones and laptops, built for deployment on Vercel with Supabase.

---

## 🔗 Live Application & Demo
- **Live Demo**: [https://revision-tracker-brown.vercel.app/](https://revision-tracker-brown.vercel.app/)
- **Repository**: [https://github.com/zaidansarie/Revision-tracker](https://github.com/zaidansarie/Revision-tracker)

---

## 🚀 Features

1. **Authentication & Multi-User Data Isolation**
   - Session-based protection on all revision routes with Next.js Edge Middleware.
   - **Personal Account** (Private revision records):
     - Username: `zaid`
     - Password: `zai827--`
   - **Guest / Demo Account** (For resume reviewers, recruiters & testing):
     - Username: `user`
     - Password: `user2467::`
     - **Complete Isolation**: Allows anyone to test adding folders, topics, custom intervals, and checking off revisions freely without interfering with personal study data.

2. **Homepage**
   - **Topics to Revise Today**: Automatically lists all topics due for revision today or overdue.
   - **Filter Controls**: Filter by **All** (selected automatically by default) or filter by any folder.
   - **Mark Revised Action**: Completing a revision recalculates and reschedules the next revision based on today's actual date. Early revisions are disallowed to preserve optimal retention intervals.
   - **Folders Section**: Located below today's revisions, displaying all created folders with their topic counts.
   - **Create Folder**: Plus (+) icon to add a new folder.
   - **Folder 3-Dots Menu**: Options to **Rename** or **Delete** any folder.

3. **Folder View**
   - Click any folder to drill down into it:
     - **Topics to Revise Today**: Shows only the topics inside this specific folder that are due today.
     - **All Topics**: Below the due section, lists every topic in this folder.
     - **Add Topic**: Plus (+) icon to add new topics to the folder.
     - **Topic 3-Dots Menu**: Options to **Edit Study Date**, **Rename**, or **Delete** an individual topic.

4. **Settings (Under Menu)**
   - Located inside the top header menu.
   - Configure custom revision intervals in days (default: `1, 3, 7, 30`).
   - **Repeat rule**: The last interval repeats indefinitely once reached (e.g., repeating every 30 days).
   - **Theme Toggle**: Light Mode and Dark Mode support.

5. **Date & Delay Handling**
   - Current date is detected and displayed.
   - If a revision is delayed (e.g., scheduled on Oct 31 but completed on Nov 2), subsequent revisions are scheduled relative to the completion date, shifting future dates forward by the delay.

6. **PWA & Data Backup**
   - Service Worker & PWA installation support on mobile and desktop.
   - Push notifications for daily morning reminders.
   - Full backup export to formatted JSON and spreadsheet-ready CSV.

---

## 🛠️ Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the SQL code from [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy your project URL and public anon key into `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## 💻 Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. In Project Settings > Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click Deploy.
