# Claude API Chat

A fully featured, open-source web UI for chatting with Claude via the Anthropic API. Designed for personal use with your own API key. Inspired by claude.ai, but enhanced with features like conversation saving, file attachments, token counting, and export/import support.

Built with Next.js 14 App Router, TypeScript, Tailwind CSS, and shadcn/ui.

---

## Features

- Streaming Responses using Server-Sent Events
- Conversation Management with auto-title, context trimming, and local persistence (via Prisma + SQLite)
- Token Counting with context usage breakdown and cost estimates
- Settings Panel to configure model, temperature, max tokens, and API key
- File Uploads (text, code, and images with content-aware formatting)
- Export Conversations as:
  - Markdown (readable)
  - JSON (structured)
  - Compact AI format (optimized for continuation)
- Context Manager with auto-trim, usage alerts, and visual indicators
- Artifact Canvas for editing, copying, or downloading generated code
- Dark/Light Theme with local preference memory

---

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma with SQLite (default)
- Anthropic SDK for Claude API
- Lucide React Icons
- Monaco Editor for code blocks

---

## Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/claude-api-chat.git
cd claude-api-chat
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Configure Your API Key

Create a `.env.local` file in the root directory:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

Or enter it manually in the Settings Panel at runtime.

### 4. Setup the Database

```bash
npx prisma migrate dev --name init
```

This will create a SQLite DB in `prisma/dev.db` by default.

### 5. Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start chatting.

---

## Project Structure

- `app/` — Main Next.js App Router layout & routes
- `components/` — Reusable UI components (markdown renderer, file upload, sidebar, etc.)
- `lib/` — Token utils, settings, export handlers, Prisma
- `hooks/` — Custom React hooks
- `prisma/` — Prisma schema and migrations
- `public/` — Static assets

---

## Notes

- This project does not sync with claude.ai — conversations are local.
- Anthropic’s API has no memory — all context must be sent with each call.
- You are responsible for managing your API token usage and costs.

---

## License

MIT License. Use at your own risk. Not affiliated with Anthropic.
