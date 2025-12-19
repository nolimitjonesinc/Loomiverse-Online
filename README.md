# Loomiverse Online

**Where Every Choice Weaves Destiny**

A web-based AI-powered interactive story generation platform featuring psychologically rich, emergent characters.

## Features

### Emergent Character System
Characters are **grown, not designed**. The system simulates 140+ life events from birth to age 18, producing personalities that emerged through accumulated experience rather than authored backstories.

**8 Psychological Layers:**
1. World Context (era, region, historical events)
2. Cultural Identity (ethnicity, historical trauma, code-switching)
3. Generational Echoes (grandparents' wounds, family myths)
4. Family Structure (parents with wounds, sibling dynamics)
5. Atmospheric Conditions (emotional climate, ambient threat)
6. Biological Seed (temperament, shadow traits)
7. Embodiment (body relationship, dissociation patterns)
8. Attachment Formation (attachment style, core beliefs)

### Story Bible System
Maintains rich continuity context that gets injected into every AI prompt:
- Character tracking with full psychology
- World facts that cannot be contradicted
- Chapter summaries for narrative consistency
- Choice history for branching paths
- Narrative phase awareness (setup → climax → resolution)

### Choose Your Own Adventure
Each chapter ends with 3 meaningful choices that affect the story's direction.

### Multi-Provider AI Support
- OpenAI GPT-4
- Anthropic Claude

### 25+ Author Styles
Rich writing style guidance from George R.R. Martin to Nate Bargatze.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Configuration

Create a `.env.local` file with your API keys:

```env
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Or configure them in the Settings panel within the app.

## Project Structure

```
src/
├── App.jsx          # Main application (character gen, story engine, UI)
├── main.jsx         # React entry point
├── index.css        # Global styles
└── data/
    └── AuthorStyles.json  # 25+ author writing styles
```

## License

Private - All rights reserved.
