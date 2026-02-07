<div align="center">

# 🔐 The AI Vault: Escape the Future

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![ES Modules](https://img.shields.io/badge/ES_Modules-333?style=for-the-badge&logo=javascript&logoColor=F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**An interactive browser-based educational escape room teaching AI, data, ethics, sustainability, and coding through 5 themed rooms with 15+ puzzles.**

[Live Demo](https://alfredang.github.io/escaperooms/) · [Report Bug](https://github.com/alfredang/escaperooms/issues) · [Request Feature](https://github.com/alfredang/escaperooms/issues)

</div>

---

## Screenshot

![The AI Vault - Title Screen](screenshot.png)

## About

**The AI Vault** is a gamified learning experience designed for adult learners in corporate training, polytechnic, and AI literacy programs. Players navigate through 5 themed rooms, each containing 3 unique puzzles that teach real-world concepts in artificial intelligence, data science, ethics, sustainability, and cybersecurity.

The game features optional AI-powered hints (OpenAI / Anthropic), synthesized audio, a meta puzzle finale, and full state persistence — all running entirely in the browser with zero backend dependencies.

### Key Features

| Feature | Description |
|---------|-------------|
| 🚀 **5 Themed Rooms** | Space Operations, Food Systems, Ethics Archive, Green Tech, Cyber City |
| 🧩 **15+ Unique Puzzles** | Flowcharts, dashboards, decision trees, crosswords, simulations, debugging, and more |
| 🤖 **AI-Powered Hints** | Dual-provider support (OpenAI GPT-4o-mini / Anthropic Claude) with Socratic method |
| 🔊 **Synthesized Audio** | Web Audio API sound effects — no audio files needed |
| 💾 **Auto-Save** | Game state persists via localStorage — resume anytime |
| 📱 **Responsive Design** | Fully playable on desktop, tablet, and mobile |
| 🎯 **Achievement System** | Earn badges for speed, accuracy, and mastery |
| 🔐 **Meta Puzzle Finale** | Combine artifacts from all 5 rooms to unlock the vault |
| 🎨 **Dynamic Theming** | Each room has unique colors, animations, and atmosphere |
| ♿ **Accessible** | Keyboard navigation, semantic HTML, high contrast |

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Markup** | HTML5, Semantic Elements |
| **Styling** | CSS3, Custom Properties, Animations, Grid, Flexbox |
| **Logic** | Vanilla JavaScript (ES2022+), ES Modules |
| **State** | Custom pub/sub event system with localStorage persistence |
| **Audio** | Web Audio API (synthesized effects) |
| **AI Integration** | OpenAI API / Anthropic API (optional) |
| **Fonts** | Google Fonts (Inter, Orbitron, JetBrains Mono) |
| **Deployment** | GitHub Pages |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser (SPA)                  │
├─────────────────────────────────────────────────┤
│  index.html ──► main.js ──► App (Orchestrator)  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Router   │  │  Timer   │  │ AudioManager │  │
│  │ (screens) │  │ (elapsed)│  │ (Web Audio)  │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           GameState (pub/sub)             │   │
│  │     ┌─────────────────────────────┐      │   │
│  │     │      localStorage           │      │   │
│  │     └─────────────────────────────┘      │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           PuzzleEngine                    │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐       │   │
│  │  │ Flow-  │ │Pattern │ │ Code-  │ ...x15│   │
│  │  │ chart  │ │Puzzle  │ │ Lock   │       │   │
│  │  └────────┘ └────────┘ └────────┘       │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           AIService (optional)            │   │
│  │  OpenAI ◄──► Fallback ◄──► Anthropic     │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
escaperoom/
├── index.html                       # Single-page app entry point
├── css/
│   ├── variables.css                # Design tokens & room theme properties
│   ├── main.css                     # Reset, layout, typography, responsive
│   ├── components.css               # Buttons, modals, cards, progress bar
│   ├── animations.css               # Keyframes & transition utilities
│   ├── room-space.css               # Room 1: cyan/navy starfield
│   ├── room-food.css                # Room 2: amber dashboard
│   ├── room-ethics.css              # Room 3: purple archive
│   ├── room-green.css               # Room 4: emerald nature-tech
│   └── room-cyber.css               # Room 5: red cyberpunk
├── javascript/
│   ├── main.js                      # Bootstrap
│   ├── app.js                       # Orchestrator
│   ├── state.js                     # GameState with pub/sub
│   ├── router.js                    # Screen navigation
│   ├── timer.js                     # Elapsed timer
│   ├── audio.js                     # Web Audio synthesizer
│   ├── ai-service.js                # Dual AI provider + fallback
│   ├── puzzle-engine.js             # Puzzle type registry & validation
│   ├── puzzle-renderer.js           # DOM factory
│   ├── drag-drop.js                 # HTML5 DnD + touch support
│   ├── progress-tracker.js          # Badges & completion tracking
│   ├── characters.js                # AI character dialogue
│   ├── meta-puzzle.js               # Final vault challenge
│   ├── rooms/
│   │   ├── base-room.js             # Room lifecycle
│   │   ├── room-space.js            # Room 1 controller
│   │   ├── room-food.js             # Room 2 controller
│   │   ├── room-ethics.js           # Room 3 controller
│   │   ├── room-green.js            # Room 4 controller
│   │   └── room-cyber.js            # Room 5 controller
│   └── puzzles/
│       ├── base-puzzle.js            # Puzzle interface contract
│       ├── flowchart-puzzle.js       # Drag-and-drop ordering
│       ├── pattern-puzzle.js         # Sequence prediction
│       ├── code-lock-puzzle.js       # Conditional logic
│       ├── dashboard-puzzle.js       # Chart interpretation
│       ├── optimization-puzzle.js    # Slider constraints
│       ├── recommendation-puzzle.js  # Bias in AI recs
│       ├── decision-tree-puzzle.js   # Ethical branching
│       ├── bias-detection-puzzle.js  # Dataset bias spotting
│       ├── crossword-puzzle.js       # AI ethics vocabulary
│       ├── simulation-puzzle.js      # Climate parameters
│       ├── cause-effect-puzzle.js    # Matching connections
│       ├── resource-puzzle.js        # Budget allocation
│       ├── debug-puzzle.js           # JavaScript bug hunting
│       ├── password-puzzle.js        # Pattern deduction
│       └── prompt-puzzle.js          # Prompt engineering
├── data/
│   ├── puzzles.json                  # All puzzle configurations
│   ├── characters.json               # AI character definitions
│   └── badges.json                   # Badge criteria
└── assets/
    └── images/                       # Icons & avatars
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No build tools, frameworks, or server required

### Installation

```bash
# Clone the repository
git clone https://github.com/alfredang/escaperooms.git

# Navigate to the project
cd escaperooms

# Open in browser (any local server works)
python3 -m http.server 8000
# or
npx serve .
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

### AI Integration (Optional)

The game is fully playable without an API key. To enable AI-powered hints:

1. Click **Settings** on the title screen
2. Select your provider (OpenAI or Anthropic)
3. Enter your API key (stored in sessionStorage only — never persisted)
4. AI hints will use the Socratic method to guide without giving answers

### Debug Mode

Append `?debug=true` to the URL to enable:
- Jump to any room directly
- Auto-solve puzzles
- State inspector

## The 5 Rooms

| # | Room | Theme | Puzzles | Teaches |
|---|------|-------|---------|---------|
| 1 | 🚀 Space Operations AI Hub | Cyan/Navy, Starfield | Flowchart, Pattern, Code Lock | Algorithms, Logic, Programming |
| 2 | 🍔 Smart Food Systems Lab | Amber, Dashboard | Dashboard, Optimization, Recommendation | Data Analysis, Bias Detection |
| 3 | ⚖️ Ethics & Governance Archive | Purple, Archival | Decision Tree, Bias Detection, Crossword | AI Ethics, Fairness, Governance |
| 4 | 🌱 Green Tech Sustainability Core | Emerald, Nature-Tech | Simulation, Cause-Effect, Resource | Climate, Systems Thinking |
| 5 | 💻 Cyber City Code Breakout | Red, Cyberpunk | Debug, Password, Prompt Engineering | Security, Coding, Prompt Design |

## Deployment

This is a static site — deploy anywhere that serves HTML:

### GitHub Pages (Recommended)

The project includes a GitHub Actions workflow for automatic deployment on push to `main`.

### Manual Deployment

Upload all files to any static hosting provider (Netlify, Vercel, S3, etc.).

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Join the [Discussions](https://github.com/alfredang/escaperooms/discussions) to share ideas or ask questions.

## Developed By

**Tertiary Infotech Academy Pte. Ltd.**

## Acknowledgements

- [Google Fonts](https://fonts.google.com/) — Inter, Orbitron, JetBrains Mono
- [Shields.io](https://shields.io/) — README badges
- [OpenAI](https://openai.com/) & [Anthropic](https://anthropic.com/) — Optional AI hint providers

---

<div align="center">

**If you found this useful, please ⭐ star the repo!**

Built with ❤️ using pure HTML, CSS, and JavaScript

</div>
