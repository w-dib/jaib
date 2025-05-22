# Jaib

A minimalist Chrome Extension to save web articles for personal use, intended as a lightweight alternative for services like Pocket.

## Project Goal

The primary goal of Jaib is to provide a simple and non-intrusive way to save web articles directly from the browser, storing them in a personal database for later reading.

## Features

- Save articles directly from the browser using the extension's toolbar icon.
- Save articles using the right-click context menu on any webpage.
- Extract article content using Readability.js for a clean reading experience.
- Store saved articles (title, content, URL, excerpt, author, length) in a Supabase database.
- Provide non-invasive visual feedback (an in-page status box) when saving an article.

## Technologies Used

- **Chrome Extension API:** Building the browser extension logic (background service worker, content scripts, context menus).
- **JavaScript:** Core logic for the extension.
- **Readability.js:** Library for extracting main article content from web pages.
- **Supabase:** Backend-as-a-Service for database storage (PostgreSQL) and API endpoint.

## Getting Started (High Level)

1.  Clone this repository.
2.  Set up a Supabase project and create an `articles` table with the necessary columns (`id`, `title`, `content`, `url`, `excerpt`, `byline`, `length`, `saved_at`).
3.  Enable Row Level Security (RLS) on the `articles` table and create an `INSERT` policy that allows inserts for the `public` role (`WITH CHECK (true)`).
4.  Obtain your Supabase Project URL and `anon` key from your Supabase project settings (API tab).
5.  Update the `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants in the extension's background script (`background.js`) with your credentials. **Note: Exposing API keys directly in code is not recommended for production applications. Consider using a secret management strategy.**
6.  Load the extension in Chrome:
    - Go to `chrome://extensions/`.
    - Enable "Developer mode".
    - Click "Load unpacked".
    - Select the project directory.
7.  Try saving an article by clicking the Jaib icon in your toolbar or by right-clicking a page and selecting "Save to Jaib".

---

## Future Improvements

- Implement a UI to view saved articles.
- Add tagging functionality.
- Improve error handling and user feedback.
- Implement user authentication (if saving to multiple user accounts is desired).
- Secure API keys using environment variables or a build process.

---
