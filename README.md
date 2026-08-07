# OBITREND AI Fashion Creator — Real Backend + Frontend Foundation

## Run locally

1. Install Node.js LTS.
2. Open a terminal in this folder.
3. Run:
   `npm install`
4. Copy `.env.example` to `.env`.
5. Add your server-side API key to `.env`.
6. Run:
   `npm start`
7. Open `http://localhost:3000`.

## Security
Keep `.env` private. Never put the API key into browser JavaScript, HTML, GitHub, or the mobile app.

## Current generation flow
Browser -> POST /api/generate -> server -> image API -> browser.

## Production upgrades
Authentication, database, cloud image storage, credits, payments, rate limiting, moderation, job queue, generation history, and deployment should be added before public launch.

The image endpoint uses the Images API edit flow with `gpt-image-1`; confirm the currently supported model and parameters in the provider's current API documentation before production deployment.
