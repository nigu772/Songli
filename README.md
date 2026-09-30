# Songli

## Installation

```bash
npm install
npm start
```

## Environment Variables

Set these on Render:

- SESSION_SECRET
- SPOTIFY_CLIENT_ID
- SPOTIFY_CLIENT_SECRET
- ADMIN_USERNAME
- ADMIN_PASSWORD

## Render

Build Command:
```text
npm install
```

Start Command:
```text
npm start
```

The server listens on `0.0.0.0` and `process.env.PORT`.

## Core rules

- Event code: exactly 4 digits.
- Creator password: minimum 6 characters.
- Guest song limit: 1–10.
- Spotify credentials are server-side only.
- Events are not publicly searchable.

## GitHub structure

The `public` folder must contain:

- `public/index.html`
- `public/styles.css`
- `public/app.js`

Do not put these three files in the repository root.
