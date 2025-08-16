# Chat App (Ready-to-run)

## Quick start
1. Copy `.env.example` to `.env` and set your `MONGO_URI` and `JWT_SECRET`.
2. Install dependencies: `npm install`
3. Start MongoDB (or use Atlas).
4. Run server: `npm run start` (or `npm run dev` if you have nodemon)
5. Open http://localhost:3000

## Notes
- This is a simple starter project intended for local development/prototyping.
- For production, secure the JWT (use httpOnly cookies), enable HTTPS, and sanitize inputs.
