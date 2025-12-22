# Loomiverse Future Features Roadmap

> *"Where Every Choice Weaves Destiny"*

This document outlines the visionary features planned for Loomiverse, organized by priority and complexity. These features transform Loomiverse from an interactive story app into a complete storytelling universe.

---

## Phase 1: Core Enhancements (Near-term)

### 1.1 Edit Library Mode
- **Bulk select** multiple stories for archive/delete
- **Drag-and-drop** reordering within collections
- **Batch operations**: Move to collection, export, share

### 1.2 Story Export
- Export stories as **PDF** with cover art
- Export as **ePub** for e-readers
- Include character profiles and world facts

### 1.3 Audio Narration (ElevenLabs Integration)
- Text-to-speech for all chapters
- Multiple narrator voice options:
  - Male voices (authoritative, warm, mysterious)
  - Female voices (gentle, commanding, whimsical)
- Background ambient music by genre

---

## Phase 2: Character Conversations

### 2.1 Chat with Characters
After completing a story (or at any point), users can **chat directly with story characters**:

```
User: "Hey Elara, what did you really think about leaving the village?"

Elara: "Honestly? I was terrified. But staying meant accepting a life
       that wasn't mine. The night sky called to me, and I had to answer."
```

**Technical approach:**
- Characters maintain their full psychological profile from the Emergent Character System
- Conversations are context-aware (know the story events)
- Characters can reveal hidden motivations, secrets, "deleted scenes"
- Characters remember past conversations

### 2.2 Character Check-ins
- "What is [Character] doing today?"
- Characters have ongoing lives between stories
- Seasonal events, mood changes based on story outcomes
- Characters can send "messages" to the user

---

## Phase 3: User-in-Story Modes

### 3.1 Reader as Ensemble Member
The user becomes **a character in the story**:
- Create your own character (name, traits, appearance)
- Your character appears alongside the protagonist
- Choices affect both the story AND your character's arc
- Your character develops relationships with story characters
- Character growth tracked across multiple stories

### 3.2 Reader as Narrator
The user becomes **the storyteller guiding events**:
- "Suddenly, a storm approaches the village..."
- Narrator suggestions influence AI story generation
- Can introduce complications, new characters, plot twists
- Stories credit "Narrated by [User]"
- Different narrator styles: Omniscient, Unreliable, Dramatic

### 3.3 Second-Person Dreams Mode
*"You wake up in a cave that smells of raspberries and death..."*

- Full 2nd person narration
- Designed for bedtime/relaxation
- Dreamlike, surreal story logic
- No wrong choices - all paths lead to interesting outcomes
- Ambient soundscapes for sleep

---

## Phase 4: Writers Room

### 4.1 AI Author Personalities
Instead of generic AI, stories are written by **distinct AI authors**:

**The Storytellers:**
- **Marcus Thorne** - Dark fantasy specialist, brooding, lyrical prose
- **Vera Nightingale** - Romance and drama, emotional depth, witty dialogue
- **Jack Steele** - Action/thriller, punchy sentences, fast pacing
- **Professor Aldric** - Mystery/detective, intellectual, red herrings
- **Luna Dreamweaver** - Children's stories, whimsy, life lessons

Each author has:
- Unique writing style and vocabulary
- Preferred genres and themes
- Backstory that influences their work
- Consistent voice across all their stories
- Author profile users can view

### 4.2 Author Selection
- Users choose or are matched with authors
- Authors can "recommend" each other
- Author-specific story collections
- "New from Marcus Thorne" notifications

### 4.3 Collaborative Authors
- Two AI authors co-write a story
- Distinct chapter voices
- Creative tension between styles
- "A Vera Nightingale & Jack Steele collaboration"

---

## Phase 5: Shared Worlds

### 5.1 World Persistence
All stories exist in **shared, persistent worlds**:
- Events in one story affect others
- Burned building in Story A appears burned in Story B
- Characters can cross paths across different users' stories
- World history accumulates over time

### 5.2 Friends vs Friends Mode
**D&D-style multiplayer storytelling:**
- 2-4 players each control a character
- AI acts as Game Master
- Turn-based decisions
- Real-time or async play
- Dice roll mechanics for uncertain outcomes
- Voice chat integration

### 5.3 Neighborhood Mode
- Users create characters in a shared neighborhood/city
- Characters live ongoing lives
- Users can "visit" other characters
- Community events affect everyone
- Elections, festivals, disasters

---

## Phase 6: IP Development Pipeline

### 6.1 Story-to-Media Conversion
Automatically generate from any story:
- **Pitch document** (2-page summary)
- **Movie trailer script** (key scenes, beats)
- **Character sheets** (casting descriptions)
- **Visual storyboards** (AI-generated scene images)
- **Animatic** (rough animated sequence)

### 6.2 Creator Marketplace
- Users can publish stories for others to read
- Revenue sharing for popular stories
- Story licensing for adaptation
- Character licensing
- NFT ownership option for characters

### 6.3 Studio Tools
- Script format export (screenplay)
- Episode breakdown (TV series format)
- Series bible generation
- Continuity tracking across seasons

---

## Phase 7: Gamification & Economy

### 7.1 Loom Tokens
- Earn tokens through reading, creating, engagement
- Spend tokens to unlock:
  - Premium author styles
  - Exclusive genres
  - Custom character art
  - Voice packs
  - Rare character traits

### 7.2 Achievements & Progression
- Reading streaks with escalating rewards
- Genre mastery badges
- Author unlocks through exploration
- Character evolution milestones
- Community contribution rewards

### 7.3 Character NFTs
- Mint beloved characters as NFTs
- Trade/sell characters with full history
- Character royalties on future use
- Verified ownership across platforms

---

## Technical Architecture Notes

### Character Conversation System
```javascript
// Pseudo-structure for character chat
const characterChat = {
  characterId: 'elara-001',
  fullPsychology: { /* 8-layer emergent character data */ },
  storyMemory: { /* all events, choices, outcomes */ },
  conversationHistory: [],

  async respond(userMessage) {
    // Inject full character context
    // Reference story events
    // Maintain consistent voice
    // Track relationship with user
  }
};
```

### Narrator Mode Injection
```javascript
// User as narrator influences generation
const narratorPrompt = {
  userSuggestion: "A mysterious stranger arrives...",
  influenceWeight: 0.7, // How strongly to follow suggestion
  narratorStyle: "dramatic", // omniscient, unreliable, etc
  restrictions: ["cannot kill protagonist", "maintain genre"]
};
```

### Shared World Events
```javascript
// Cross-story world state
const worldState = {
  locations: {
    'village-tavern': {
      status: 'burned',
      burnedInStory: 'story-abc-123',
      burnedBy: 'character-villain-007'
    }
  },
  globalEvents: [
    { type: 'war', started: 'story-xyz', affectsAll: true }
  ]
};
```

---

## Priority Matrix

| Feature | Impact | Complexity | Priority |
|---------|--------|------------|----------|
| Character Chat | High | Medium | 1 |
| Audio Narration | High | Low | 2 |
| User as Narrator | High | Medium | 3 |
| Writers Room | Very High | High | 4 |
| Export PDF/ePub | Medium | Low | 5 |
| Friends Mode | Very High | Very High | 6 |
| Shared Worlds | Very High | Very High | 7 |

---

## Next Steps

1. **Immediate**: Implement Character Chat as proof-of-concept
2. **Short-term**: Add audio narration with ElevenLabs
3. **Medium-term**: Build Writers Room with 3 initial AI authors
4. **Long-term**: Shared worlds and multiplayer

---

*"Become a Loominary and show how big your universe is!"*
