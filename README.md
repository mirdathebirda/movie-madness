# Movie Madness

A random movie picker that finds highly-rated films available on your streaming platforms using the TMDB API.

## Local Development

```bash
npm install
npm run dev
```

Runs on http://localhost:1995

### Environment Variables

Create `.env.local`:

```
TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
```

Get a free TMDB API key at https://www.themoviedb.org/settings/api

## Deploy to GitHub Pages

1. Make the repo public:
   ```bash
   gh repo edit mirdathebirda/movie-madness --visibility public --accept-visibility-change-consequences
   ```

2. Add the TMDB API key as a GitHub secret:
   ```bash
   gh secret set TMDB_API_KEY --repo mirdathebirda/movie-madness
   ```

3. Enable GitHub Pages:
   ```bash
   gh api repos/mirdathebirda/movie-madness/pages -X POST -f build_type=workflow
   ```

4. Push all changes (make sure `package-lock.json` is committed):
   ```bash
   git add -A && git commit -m "deploy" && git push
   ```

5. Trigger the deploy:
   ```bash
   gh workflow run deploy.yml --repo mirdathebirda/movie-madness
   ```

6. Check status:
   ```bash
   gh run list --repo mirdathebirda/movie-madness --limit 1
   ```

Site will be live at: https://mirdathebirda.github.io/movie-madness/
