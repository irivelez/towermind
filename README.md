# TowerMind

**A physical AI concierge that roams Frontier Tower.**

A robot with a voice. It navigates the 16 floors of Frontier Tower (995 Market St, SF), and anyone can walk up, tap the screen, and have a conversation with the building itself.

**Live:** [towermind.thexperiment.dev](https://towermind.thexperiment.dev) | **Dashboard:** [towermind.thexperiment.dev/dashboard](https://towermind.thexperiment.dev/dashboard)

Built at the **Intelligence at the Frontier** hackathon — March 14-15, 2026.

---

## How It Works

A 3-wheel omni-directional robot carries an iPhone mounted on its frame. The iPhone runs TowerMind's voice agent in Safari. As the robot moves through the building's floors, anyone can approach it, tap the glowing orb on screen, and ask questions by voice.

The robot becomes the building's physical presence — it knows every floor, every speaker, every event, every hidden gem. It's not a chatbot on a screen in a corner. It's a concierge that comes to you.

```
                    ┌──────────────────┐
                    │   iPhone (Safari) │
                    │   towermind.the   │
                    │   xperiment.dev   │
                    │                   │
                    │   ┌───────────┐   │
                    │   │  Tap orb  │   │
                    │   │  to talk  │   │
                    │   └───────────┘   │
                    └────────┬──────────┘
                             │ mounted on
                    ┌────────▼──────────┐
                    │  Physical Robot    │
                    │  3-wheel omni     │
                    │  5-DOF arm        │
                    │  Raspberry Pi 5   │
                    │  ROS 2 Jazzy      │
                    └───────────────────┘
                             │
                    Roams all 16 floors
                    of Frontier Tower
```

## The Stack

### Voice Agent (`/voice-app`)

| Layer | Technology |
|-------|-----------|
| Voice | ElevenLabs Conversational AI (`@11labs/react`) |
| Intelligence | Claude Sonnet 4.6 via OpenClaw |
| Knowledge | Comprehensive system prompt — 16 floors, 50+ speakers, hackathon tracks, hidden gems |
| Frontend | Next.js 16, Tailwind CSS 4, CSS animations |
| Hosting | Vercel → `towermind.thexperiment.dev` |
| Insights | Real-time dashboard with noise-filtered question ranking for event organizers |

### Robot (`/robot`)

| Layer | Technology |
|-------|-----------|
| Compute | Raspberry Pi 5 |
| Locomotion | 3-wheel omnidirectional drive (IDs 7, 8, 9) |
| Manipulation | 5-DOF arm — base, shoulder, elbow, wrist, gripper (IDs 1, 2, 3, 5, 6) |
| Servos | 9x ST/SC bus servos via Waveshare adapter, SCServo SDK |
| Middleware | ROS 2 Jazzy (Docker container) |
| Control | Keyboard teleoperation via SSH (`robot.py`) |

### Architecture

```
Visitor taps iPhone screen
         │
         ▼
ElevenLabs Voice Agent ──► Custom LLM Proxy (Vercel) ──► OpenClaw (Claude Sonnet 4.6)
                                    │
                          Knowledge Base injected
                    (all 16 floors, speakers, events,
                     hidden gems, practical info)
                                    │
                                    ▼
                           Voice response streams
                           back to iPhone speaker
```

The robot and voice agent are physically coupled but architecturally independent — the robot handles navigation, the iPhone handles conversation. This means:

- The voice agent works standalone on any browser (no robot needed)
- The robot can operate without the voice agent
- Together, they create something neither can do alone: a physical AI presence that moves through space and talks to people

## What TowerMind Knows

- **All 16 floors** — what's on each one, who runs it, what's happening now
- **50+ speakers** — Illia Polosukhin (Transformer paper co-author), Juan Benet (IPFS), Aubrey de Grey (longevity), Kevin Owocki (Gitcoin), and more
- **Hackathon** — 4 tracks, $20,500+ prizes, submission process via DevSpot
- **Hidden gems** — Valerie the AI vending machine (Floor 2), Immersia 360° installation, community biolab (Floor 8), Unitree G1 humanoid + Boston Dynamics Spot (Floor 4)
- **Side events** — GDC Esports STAKENSLAY, Brain Rot salon, Half Ripe, sunrise DJ sets
- **Practical info** — transit, hotel deals, food, accessibility
- **Governance** — the building's human-AI co-governed treasury experiment

## Insights Dashboard

The `/dashboard` is built for event organizers, not vanity metrics:

- **Noise-filtered questions** — greetings and filler stripped, only substantive asks
- **Ranked themes** — what visitors care about most, categorized (Wayfinding, Events, People, Hackathon, Tech, etc.)
- **Floor demand** — which floors visitors ask about, signal for staffing and signage
- **Session log** — expandable conversation summaries with extracted questions

## Local Development

```bash
# Voice agent
cd voice-app
npm install
cp .env.example .env.local   # add ELEVENLABS_API_KEY, OPENCLAW_URL, OPENCLAW_TOKEN
npm run dev                   # → http://localhost:3000

# Robot (on Raspberry Pi)
ssh pi@<robot-ip>
cd ~/robot_ws
python3 robot.py              # keyboard control: Tab to switch DRIVE/ARM, X to quit
```

## Deploy

```bash
cd voice-app
npx vercel --prod             # → towermind.thexperiment.dev
```

## Credits

Built by **Irina Velez** ([@irivelez](https://github.com/irivelez)) at the Intelligence at the Frontier hackathon.

Powered by ElevenLabs, Claude Sonnet 4.6, and a robot that wanted to talk to people.
