# SkillTrack

A full-stack personal skill learning tracker built with React, TypeScript, and Supabase. Track skills, log learning sessions, set goals, and build consistent learning habits.

[![Demo Video](https://img.youtube.com/vi/J_y6x8ADjrY/maxresdefault.jpg)](https://www.youtube.com/watch?v=J_y6x8ADjrY)

> 🎬 Click the thumbnail above to watch the demo video.

## Getting Started

Clone the repository:
```bash
git clone https://github.com/your-username/skills-tracker.git
cd skills-tracker
npm install
```

Create a `.env` file in the root of the project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project under **Settings → API**.

4. **Set up the database**

Run the SQL scripts in your Supabase SQL editor in this order:

- Create tables: `profiles`, `categories`, `skills`, `learning_logs`, `goals`, `milestones`, `earned_badges`, `settings`
- Enable Row Level Security policies on all tables
- Set up the `handle_new_user` trigger for auto-seeding on signup
- Set up the `delete_user` RPC function

5. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---
## Database Schema

profiles — user profile data  
categories — skill grouping  
skills — tracked skills  
learning_logs — learning sessions  
goals — learning objectives  
milestones — progress checkpoints  
earned_badges — achievements  
settings — user preferences  

## Project Structure

src/  
components/ reusable UI components  
context/ authentication context  
lib/ Supabase client and utilities  
pages/ application pages including auth, dashboard, goals, skills, profile, settings  
styles/ styling files  
router.tsx application routing  

## License

MIT
