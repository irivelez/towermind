# TowerMind — Frontier Tower Voice Agent

Live conversational AI concierge for [Frontier Tower](https://frontiertower.io), a 16-floor vertical village for frontier technology at 995 Market St, San Francisco.

**Live:** [towermind.thexperiment.dev](https://towermind.thexperiment.dev)

Built for the **Intelligence at the Frontier** hackathon (March 14-15, 2026) — Track 2: Agentic Funding & Coordination.

---

## What it does

Visitors tap the orb and talk to the building. TowerMind knows every floor, every speaker, every event, every hidden gem — from Valerie the AI vending machine on Floor 2 to the sunrise DJ sets on Floor 6, the Unitree G1 humanoid on Floor 4, and the live quadratic funding rounds on Floor 12.

- Voice-first interaction via ElevenLabs Conversational AI
- Real-time insights dashboard with conversation analytics
- Comprehensive knowledge base covering all 16 floors, 50+ speakers, hackathon tracks, side events, and practical info

## Architecture

```
Browser → ElevenLabs Voice Agent → Custom LLM Proxy → OpenClaw (Claude Sonnet 4.6)
                                         ↓
                              Knowledge Base injection
                          (system prompt with full building context)
```

**Voice:** ElevenLabs `useConversation` hook triggers voice sessions directly from the orb UI element.

**Knowledge:** A comprehensive system prompt (`app/api/knowledge.ts`) is injected into every conversation, covering floor directory, speaker bios, event schedule, hidden gems, and practical info.

**Insights:** The dashboard (`/dashboard`) pulls conversation data from the ElevenLabs API and extracts floor mention frequency, visitor questions, AI-generated summaries, and session timelines.

## Design System

Minimal dark canvas with structured typography:

- **Fonts:** Inter (300-600) for UI, JetBrains Mono (400-700) for labels/data
- **Palette:** Near-black `#030303` canvas, violet/cyan accent system, 4-level text hierarchy
- **Layout:** 920px max-width, horizontal rules as dividers, 1px gap grids
- **Motion:** CSS `fade-up` keyframes with staggered delays, `prefers-reduced-motion` respected
- **Agent metadata:** JSON-LD structured data + custom `agent:*` meta tags

## Tech Stack

- Next.js 16 (Turbopack)
- ElevenLabs Conversational AI (`@11labs/react`)
- Framer Motion (orb status transitions only)
- Tailwind CSS 4
- OpenClaw + Claude Sonnet 4.6
- Vercel (hosting)

## Local Development

```bash
cd voice-app
npm install
cp .env.local.example .env.local  # add your keys
npm run dev
```

Required env vars:
- `ELEVENLABS_API_KEY` — for insights dashboard
- `OPENCLAW_URL` — OpenClaw backend URL
- `OPENCLAW_TOKEN` — OpenClaw auth token

## Deployment

```bash
npx vercel --prod
```

Custom domain: `towermind.thexperiment.dev` (A record → 76.76.21.21)

## Credits

Built by [Irina Velez](https://thexperiment.dev) at the Intelligence at the Frontier hackathon.

Powered by ElevenLabs + Claude Sonnet 4.6.
