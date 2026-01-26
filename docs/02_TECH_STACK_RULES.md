# Tech Stack & Rules

## 1. Project Structure (STRICT)
All source code must be located under the `src/` directory.
- **`src/backend/`**: FastAPI application. Handles API, DB connections, and Email sending.
- **`src/frontend/`**: React + Vite application. User interface.
- **`src/collector/`**: Standalone Python scripts. Runs independently to crawl data and save to DB.

## 2. Tech Stack (MVP Free Tier)
- **AI Model**: `GPT-4.1.-nano` ONLY.
- **Frontend**: React, TailwindCSS, Axios -> Deploy on Vercel.
- **Backend**: Python FastAPI, Uvicorn, SQLAlchemy -> Deploy on Render.
- **Collector**: Python script (BeautifulSoup, FeedParser) -> Scheduled execution (Cron or manual).
- **Database**: Supabase (PostgreSQL + pgvector).

## 3. Coding Conventions
- **Shared Config**: Use a single `.env` file at the root. Both `backend` and `collector` read `DATABASE_URL` from here.
- **Imports**: Use absolute imports where possible.
- **Frontend State**: Use React Context API or simple State (No Redux for MVP).