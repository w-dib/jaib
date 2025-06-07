# Jaib v0.1 - Your Open Source Article Saver

> 🚀 Built in 10 days as Pocket announced shutdown. A lightweight, modern alternative for saving and managing your articles. You can try it out at [jaib](https://jaib.waliddib.com)

## Features

- Progressive Web App (PWA) for cross-platform access
- Article parsing and clean reading view
- Ability to mark URLs as unread, archived, favorite, or delete
- Annotations and highlights
- Batch upload URLs from a CSV file, compatible with Pocket export
- Article search and sorting
- Article tagging and organization
- Track scroll position and resume reading across devices (coming in v0.2)
- Chrome extension for saving articles
- Fast and responsive UI built with React + Vite
- Secure authentication with Google and GitHub SSO
- Optional Text-to-Speech with Kokoro TTS

> Note: While the UI shows Premium/Free user indicators, v0.1 does not implement any feature restrictions.

## Coming in v0.2

- Full-text search capabilities
- Automatic article tagging
- Native iOS and Android apps
- Firefox and Safari extensions (currently Chrome only)

## Project Structure

```
Jaib/
├── app/               # Main React + Vite application
│   ├── api/           # Serverless functions (article parsing, TTS)
│   ├── components/    # React components
│   └── supabase/      # Database schemas and functions
├── extension/         # Chrome extension
└── README.md
```

## Setup Guide

### 1. Prerequisites

- Node.js 20+
- A Supabase account
- Vercel CLI (`npm i -g vercel`)
- (Optional) RunPod account for TTS features

### 2. Environment Variables

Create a `.env.local` file in the `app` directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
HUGGING_FACE_API_TOKEN=your_huggingface_token
ELEVEN_LABS_API_TOKEN=your_elevenlabs_token
SUPABASE_SERVICE_KEY=your_service_key
RUNPOD_TTS_URL=your_runpod_instance_url  # Optional for TTS
```

Get these values from:

- Supabase: Project Settings > API
- HuggingFace: Settings > Access Tokens
- RunPod: Your deployed Kokoro instance URL (optional). You can deploy it using a custom template with a docker image from the [Kokoro FastAPI](https://github.com/remsky/Kokoro-FastAPI) repository.

Important: You need to configure these environment variables in two places:

1. Locally in your `.env.local` file
2. In your Vercel project settings (Settings > Environment Variables)

### 3. Authentication Setup

1. Go to your Supabase project's Authentication settings
2. Enable Google and GitHub providers
3. Follow the provider-specific setup guides:
   - [Google Auth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
   - [GitHub Auth Setup](https://supabase.com/docs/guides/auth/social-login/auth-github)

### 4. Database Setup

Run the following SQL in your Supabase SQL editor to set up the schema and RLS policies:

```sql
-- Create tables
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT NOT NULL,
    excerpt TEXT,
    byline TEXT,
    length INTEGER,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    lead_image_url TEXT,
    site_name TEXT,
    raw_content_error BOOLEAN DEFAULT FALSE,
    CONSTRAINT unique_user_article_url UNIQUE (user_id, url)
);

CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_tag_name UNIQUE (user_id, name)
);

CREATE TABLE public.article_tags (
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_article_tags PRIMARY KEY (user_id, article_id, tag_id)
);

CREATE TABLE public.annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    selector_info JSONB NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can select their own articles" ON public.articles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own articles" ON public.articles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles" ON public.articles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles" ON public.articles
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can select their own tags" ON public.tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags" ON public.tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON public.tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON public.tags
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can select their own article-tag links" ON public.article_tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own article-tag links" ON public.article_tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own article-tag links" ON public.article_tags
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can select their own annotations" ON public.annotations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own annotations" ON public.annotations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations" ON public.annotations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations" ON public.annotations
    FOR DELETE USING (auth.uid() = user_id);
```

### 5. Serverless Function Setup

Jaib uses a Supabase Edge Function to parse articles. Deploy the function using the Supabase Dashboard:

1. Go to your project's Edge Functions section
2. Create a new function called `fetch-article-data`
3. Copy the code from `app/supabase/functions/fetch-article-data/index.ts`
4. Deploy the function

The function uses Mozilla's Readability library to parse articles and extract:

- Clean article content
- Title and byline
- Lead image
- Excerpt
- Site metadata

### 6. Text-to-Speech (Optional)

Jaib uses [Kokoro TTS](https://github.com/remsky/Kokoro-FastAPI) for text-to-speech. To enable this:

1. Deploy Kokoro on RunPod
2. Get your instance URL
3. Add it to your `.env.local` as `RUNPOD_TTS_URL`

### 7. Installation and Development

```bash
# Clone the repository
git clone https://github.com/yourusername/jaib
cd jaib

# Install dependencies immediately
cd app
npm install

# Link with Vercel
vercel link

# For development without TTS
npm run dev

# For development with TTS functionality
cd ..  # Go back to root directory
vercel dev  # This will run both the frontend and TTS API
```

### 8. Deployment

```bash
# Deploy to Vercel
vercel deploy
```

Make sure to:

1. Configure all environment variables in your Vercel project settings
2. Set up the production deployment in Vercel dashboard
3. Replace all instances of `https://jaib.waliddib.com` in `extension/background.js` with your own domain:

   ```js
   // In extension/background.js, replace:
   const saveUrl = `https://jaib.waliddib.com/save-article?url=${encodeURIComponent(
     tab.url
   )}`;
   // with your domain:
   const saveUrl = `https://your-domain.com/save-article?url=${encodeURIComponent(
     tab.url
   )}`;

   // Also replace other instances:
   chrome.tabs.create({ url: "https://jaib.waliddib.com/" });
   chrome.tabs.create({ url: "https://jaib.waliddib.com/logout" });
   ```

### 9. Chrome Extension

After deploying your instance and updating the domain in `extension/background.js`, you can load the extension in Chrome:

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` directory from your project

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

---

Built with ❤️ by [Walid Dib](https://waliddib.com)
