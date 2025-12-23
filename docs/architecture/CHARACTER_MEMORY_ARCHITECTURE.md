# Loomiverse Character Memory Architecture

## Document Purpose

This document outlines the architectural options for managing character memory in Loomiverse. It serves as a decision framework for evaluating different approaches to persistent character memory, considering scalability, cost, user experience, and the unique requirements of story-driven AI characters.

**Target Audience**: Technical decision-makers, future AI assistants working on this project, and stakeholders evaluating infrastructure costs.

**Last Updated**: December 2024

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Industry Context: The Character.ai Case Study](#industry-context-the-characterai-case-study)
3. [Architectural Options Overview](#architectural-options-overview)
4. [Option 1: Full Context Approach](#option-1-full-context-approach)
5. [Option 2: RAG-Based Memory](#option-2-rag-based-memory)
6. [Option 3: Tiered Hybrid System (Recommended)](#option-3-tiered-hybrid-system-recommended)
7. [Core Memories: The Human-Inspired Memory Model](#core-memories-the-human-inspired-memory-model)
8. [Storage Strategy: Local vs Cloud vs Hybrid](#storage-strategy-local-vs-cloud-vs-hybrid)
9. [Cost Model Considerations](#cost-model-considerations)
10. [Implementation Phases](#implementation-phases)
11. [Open Questions for Future Evaluation](#open-questions-for-future-evaluation)
12. [References and Resources](#references-and-resources)

---

## Problem Statement

### The Challenge

Loomiverse enables users to create stories populated with AI characters. These characters must:

1. **Maintain narrative continuity** across sessions (remember plot events, user choices, story arcs)
2. **Preserve emotional journeys** (character growth, relationship evolution, trauma/healing arcs)
3. **Remember relationship dynamics** (how they feel about other characters and the user)
4. **Stay consistent with their personality** while allowing natural evolution
5. **Scale economically** as users create more characters and longer stories

### Why This Is Hard

Traditional approaches face a fundamental tension:

```
More Memory = Better Experience = Higher Costs = Doesn't Scale
Less Memory = Lower Costs = Characters Forget = Broken Experience
```

### Loomiverse-Specific Complexity

Unlike simple chatbots, Loomiverse characters exist within:

- **Story contexts**: A character's memories are tied to specific narrative universes
- **Multi-character relationships**: Characters may remember each other, not just the user
- **Emotional arcs**: A character who overcame fear shouldn't suddenly be fearful again
- **User-driven evolution**: Characters may grow based on user interactions over weeks/months

### The Scale Problem

Consider a moderately successful scenario:
- 10,000 active users
- Average 5 stories per user
- Average 4 characters per story
- Average 100 meaningful interactions per character

That's **200 million memory items** to potentially store, retrieve, and reason about.

---

## Industry Context: The Character.ai Case Study

### Why This Matters

Character.ai is the most direct competitor/precedent for AI character interaction at scale. Their struggles and solutions are directly relevant to Loomiverse's architecture decisions.

### Character.ai's Current Problems (2025)

Users report widespread issues:

1. **Memory Loss**: Characters forget names, settings, relationships established over many messages
2. **Repetition**: Bots ask the same questions repeatedly, breaking immersion
3. **Relationship Amnesia**: Characters who've had months of interaction suddenly act like strangers
4. **Inconsistent Experience**: Some users report good memory, others report complete failure

**Root Cause**: Limited context window combined with aggressive cost optimization.

**Their Official Statement**: "There is a limited amount of conversation context that the character can consider, so it will appear to forget things if they were not mentioned recently."

### Character.ai's Technical Optimizations

To manage costs at scale, Character.ai has implemented:

| Technique | Effect | Trade-off |
|-----------|--------|-----------|
| Multi-Query Attention | 8x KV cache reduction | Potential quality loss |
| Hybrid Attention Windows | O(length) vs O(length²) | Loses long-range dependencies |
| Cross-Layer KV Sharing | 2-3x additional reduction | Model capacity reduction |
| Inter-Turn Caching | 95% cache hit rate | Only helps repeated contexts |

**Result**: 33x cost reduction since 2022, but memory quality suffered significantly.

### Character.ai's Attempted Fix: Chat Memories

In late 2024, they introduced "Chat Memories":
- 400 characters of fixed, user-defined information per chat
- Users manually specify what the character should remember

**Why It's Insufficient**:
- 400 characters is roughly 80 words - far too limited
- Places burden on user to manage memory
- Doesn't capture evolving narrative or emotional states
- No automatic extraction of important moments

### Lessons for Loomiverse

1. **Don't rely solely on context window** - It will fail at scale
2. **Memory quality cannot be sacrificed for cost** - Users notice immediately
3. **Manual memory management frustrates users** - System should be intelligent
4. **Gradual rollouts expose inconsistency** - All users should have same experience

---

## Architectural Options Overview

### Quick Comparison

| Approach | Memory Quality | Cost at Scale | Implementation Complexity | User Control |
|----------|---------------|---------------|---------------------------|--------------|
| Full Context | Excellent initially, then fails | Very High | Low | None |
| RAG-Based | Good | Medium | High | Low |
| Tiered Hybrid | Excellent | Medium-Low | High | High |

### Decision Factors

When evaluating options, consider:

1. **Memory Fidelity**: How accurately can characters recall important information?
2. **Cost Curve**: How do costs grow as users/content scales?
3. **Latency**: How long does memory retrieval add to response time?
4. **User Agency**: Can users influence what characters remember?
5. **Failure Modes**: What happens when the system fails? Is it graceful?

---

## Option 1: Full Context Approach

### How It Works

```
User Message → Concatenate ALL Previous Messages → Send to LLM → Response
```

Every interaction includes the complete conversation history in the LLM's context window.

### Advantages

- **Simplest implementation**: No external memory systems needed
- **Perfect recall** (while within context limits): LLM sees everything
- **Natural conversation flow**: No retrieval latency
- **No summarization loss**: Raw conversations preserved

### Disadvantages

- **Hard context limits**: Even 200k tokens ≈ 150k words ≈ eventually hit wall
- **Linear cost scaling**: Costs grow directly with conversation length
- **No cross-session persistence**: New session = start fresh (unless stored)
- **"Lost in the middle" problem**: LLMs attend poorly to middle of long contexts

### Cost Analysis

Assuming $0.01 per 1k input tokens (typical API pricing):

| Conversation Length | Tokens | Cost Per Message |
|--------------------|--------|------------------|
| 10 messages | ~2k | $0.02 |
| 100 messages | ~20k | $0.20 |
| 1000 messages | ~200k | $2.00 |

**At scale**: 10k users × 10 messages/day × $0.20 = $20,000/day

### When to Use

- Prototyping and MVP
- Short-form interactions (single session)
- When cost is not a constraint

### Verdict for Loomiverse

**Not viable as primary architecture**. Stories and character relationships inherently require long-term memory that will exceed context limits. However, recent context (last N messages) should always be included.

---

## Option 2: RAG-Based Memory

### How It Works

```
1. After each interaction:
   - Extract memorable information
   - Convert to embedding vector
   - Store in vector database

2. Before each response:
   - Convert current query to embedding
   - Retrieve most similar memories
   - Inject relevant memories into (smaller) context
   - Generate response
```

### Core Components

1. **Memory Extractor**: Identifies what's worth remembering from conversations
2. **Embedding Model**: Converts text to semantic vectors
3. **Vector Database**: Stores and indexes embeddings for fast retrieval
4. **Retrieval System**: Finds relevant memories based on current context
5. **Context Assembler**: Combines retrieved memories with recent conversation

### Available Solutions

| Solution | Type | Strengths | Considerations |
|----------|------|-----------|----------------|
| **Mem0** | Open Source + SaaS | Graph + vector hybrid, production-ready | Dependency on external service |
| **Zep** | Open Source | Temporal knowledge graphs | More complex to operate |
| **LangMem** | Open Source | Multiple memory types (semantic, episodic, procedural) | Requires LangChain ecosystem |
| **Pinecone** | SaaS | Managed vector DB, highly scalable | Pure vector, no graph relationships |
| **Weaviate** | Open Source + SaaS | Good hybrid search | Requires hosting |
| **Chroma** | Open Source | Simple, local-first | May need to scale carefully |

### Advantages

- **Scalable**: Costs grow with memories stored, not conversation length
- **Cross-session**: Memories persist across sessions automatically
- **Semantic retrieval**: Finds contextually relevant memories, not just recent ones
- **Bounded context**: Control exactly how much context goes to LLM

### Disadvantages

- **Retrieval quality**: Wrong memories retrieved = confused character
- **Extraction quality**: Important moments might not be captured
- **Latency overhead**: Vector search adds ~50-200ms per query
- **Infrastructure complexity**: Additional databases and services to maintain
- **Cold start problem**: New characters have no memories to retrieve

### Cost Analysis

| Component | Typical Cost |
|-----------|-------------|
| Embedding generation | $0.0001 per 1k tokens |
| Vector storage | $0.25 per 1M vectors/month |
| Vector queries | $0.01 per 1k queries |
| LLM inference (reduced context) | $0.01 per 1k tokens |

**Comparison to Full Context**:
- Full context at 20k tokens: $0.20/message
- RAG with 4k context + retrieval: ~$0.05/message (4x cheaper)

### Verdict for Loomiverse

**Strong foundation but insufficient alone**. RAG excels at retrieving factual memories but struggles with:
- Emotional continuity (how a character *feels* about something)
- Relationship dynamics (complex multi-entity state)
- Narrative arcs (what happened vs. what it *means*)

---

## Option 3: Tiered Hybrid System (Recommended)

### Philosophy

Combine the best of each approach with a human-inspired memory model:

- **Working Memory**: Always present, recent context
- **Character Identity**: Core personality, always included
- **Core Memories**: Defining moments that shaped the character
- **Long-term Memory**: Searchable archive of past experiences
- **Relationship Memory**: How the character relates to others

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      LLM CONTEXT WINDOW                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ TIER 0: CHARACTER IDENTITY (Always Present)              │   │
│  │ - Base personality traits                                │   │
│  │ - Speech patterns and quirks                             │   │
│  │ - Fundamental beliefs and values                         │   │
│  │ - Physical description (if relevant)                     │   │
│  │ Size: ~500-1000 tokens                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ TIER 1: CORE MEMORIES (Always Present)                   │   │
│  │ - Defining moments (max 5-10)                            │   │
│  │ - Formative experiences                                  │   │
│  │ - Major emotional milestones                             │   │
│  │ - Relationship-defining events                           │   │
│  │ Size: ~500-1500 tokens                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ TIER 2: WORKING MEMORY (Always Present)                  │   │
│  │ - Last N messages (configurable, e.g., 20-50)            │   │
│  │ - Current scene/story context                            │   │
│  │ - Active emotional state                                 │   │
│  │ Size: ~2000-4000 tokens                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ TIER 3: RETRIEVED MEMORIES (Dynamic)                     │   │
│  │ - Semantically relevant past events                      │   │
│  │ - Contextually appropriate relationship details          │   │
│  │ - Story-relevant plot points                             │   │
│  │ Size: ~1000-2000 tokens (retrieved via RAG)              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ TIER 4: USER MESSAGE                                     │   │
│  │ Size: Variable                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  TOTAL CONTEXT: ~5000-9000 tokens (manageable, consistent)     │
└─────────────────────────────────────────────────────────────────┘
```

### Storage Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL STORAGE (User's Device)                │
├─────────────────────────────────────────────────────────────────┤
│  • Raw conversation history (last N sessions)                   │
│  • Character identity documents                                  │
│  • Working memory state                                          │
│  • User preferences and settings                                 │
│  • Offline-capable subset of memories                           │
│                                                                  │
│  Technology: SQLite (mobile), IndexedDB (web), or local files   │
│  Cost to Loomiverse: $0                                         │
│  Data Ownership: User                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Sync (summarized/extracted)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD STORAGE (Loomiverse)                   │
├─────────────────────────────────────────────────────────────────┤
│  • Core memories (extracted, compressed)                        │
│  • Relationship graphs                                          │
│  • Character evolution milestones                               │
│  • Cross-device sync metadata                                   │
│  • Memory embeddings for RAG retrieval                          │
│                                                                  │
│  Technology: PostgreSQL + Vector Extension (pgvector) or        │
│              dedicated vector DB (Pinecone, Weaviate)           │
│  Cost to Loomiverse: Variable (see Cost Model section)          │
│  Data Ownership: Shared (user content, our infrastructure)      │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONVERSATION FLOW                            │
└─────────────────────────────────────────────────────────────────┘

User sends message
        │
        ▼
┌───────────────────┐
│ 1. Load Context   │
│    - Identity     │
│    - Core memories│
│    - Working mem  │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ 2. RAG Retrieval  │
│    - Query vector │
│      database     │
│    - Get relevant │
│      memories     │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ 3. Assemble       │
│    Context        │
│    - Combine all  │
│      tiers        │
│    - Add user msg │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ 4. LLM Inference  │
│    - Generate     │
│      response     │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ 5. Memory Update  │
│    - Update       │
│      working mem  │
│    - Extract new  │
│      memories     │
│    - Evaluate for │
│      core memory  │
└───────────────────┘
        │
        ▼
Response to user

```

### Advantages

- **Bounded, predictable costs**: Context size is controlled
- **Memory quality**: Important things always present (core memories)
- **Scalable**: Long-term storage is cheap, inference context is optimized
- **User ownership**: Raw data stays local, users control their content
- **Graceful degradation**: If cloud unavailable, local still works
- **Privacy-friendly**: Sensitive content can stay local-only

### Disadvantages

- **Implementation complexity**: Multiple systems to build and maintain
- **Sync complexity**: Local/cloud state reconciliation
- **Core memory selection**: Requires intelligent extraction (hard problem)
- **Initial development cost**: More upfront engineering

### Verdict for Loomiverse

**Recommended approach**. Balances cost, quality, and scalability while aligning with the product philosophy (user-owned stories, character evolution, emotional depth).

---

## Core Memories: The Human-Inspired Memory Model

### The Concept

Inspired by how human memory works (and Pixar's "Inside Out"), not all memories are equal. Some moments fundamentally shape who we are - these are **core memories**.

For Loomiverse characters:

> **Core Memory**: A specific moment or experience that significantly impacts a character's personality, beliefs, relationships, or emotional state. Core memories are always accessible and influence how the character behaves.

### Why This Matters

Random memory retrieval (standard RAG) has a fundamental problem:
- Retrieves memories similar to current query
- May miss emotionally important but semantically distant memories
- Characters "forget" defining moments because they're not textually similar to current conversation

Example:
```
Current conversation: "What do you want for lunch?"
RAG retrieves: Past conversations about food

But character should ALWAYS remember: "The time they overcame their fear of
the dark" - even though it's not about food, it shapes who they are.
```

### Core Memory Characteristics

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Emotional Intensity** | High emotional charge (positive or negative) | "The day I lost my best friend" |
| **Identity-Shaping** | Changed how the character sees themselves | "When I stood up to the bully" |
| **Relationship-Defining** | Fundamentally altered a relationship | "When [user] saved my life" |
| **Belief-Forming** | Created or changed a core belief | "When I learned not everyone can be trusted" |
| **Milestone** | Marked significant character growth | "When I finally forgave myself" |

### Core Memory Structure

```json
{
  "id": "mem_abc123",
  "character_id": "char_xyz789",
  "type": "core_memory",
  "created_at": "2024-12-15T14:30:00Z",
  "source_conversation_id": "conv_456",

  "content": {
    "summary": "When the user defended me against harsh criticism from another character, making me realize I have people who believe in me.",
    "emotional_impact": "profound gratitude, shift from self-doubt to cautious confidence",
    "behavioral_change": "Now more likely to stand up for others, slightly more trusting",
    "relationship_effect": {
      "user": "deep loyalty, protective instinct",
      "critic_character": "wariness, but potential for forgiveness arc"
    }
  },

  "metadata": {
    "emotional_intensity": 0.92,
    "identity_relevance": 0.85,
    "extraction_confidence": 0.88,
    "user_confirmed": true
  },

  "tags": ["trust", "loyalty", "self-worth", "relationship:user", "growth"]
}
```

### Core Memory Limits

To prevent unbounded growth and maintain significance:

| Character Age | Max Core Memories | Reasoning |
|---------------|-------------------|-----------|
| New (< 20 interactions) | 1-2 | Few defining moments yet |
| Developing (20-100) | 3-5 | Building history |
| Established (100-500) | 5-7 | Rich history, selectivity matters |
| Veteran (500+) | 7-10 | Only truly defining moments |

When limits are reached, system should:
1. Consolidate related memories ("These three moments all relate to trust")
2. Demote less impactful memories to long-term storage
3. Prompt user review for borderline cases

### Core Memory Detection

**How do we identify when a moment should become a core memory?**

#### Automated Detection Signals

```python
# Conceptual scoring model
def evaluate_for_core_memory(interaction):
    score = 0

    # Emotional intensity signals
    if contains_emotional_language(interaction):  # "I've never felt...", "This changes everything"
        score += 0.3

    # Explicit character growth
    if expresses_change(interaction):  # "I used to think... but now..."
        score += 0.3

    # Relationship milestone
    if relationship_shift(interaction):  # First "I trust you", betrayal, reconciliation
        score += 0.25

    # User investment signal
    if user_showed_strong_engagement(interaction):  # Long messages, emotional language
        score += 0.15

    # Story significance
    if plot_turning_point(interaction):  # Major story events
        score += 0.2

    return score  # Threshold: > 0.6 suggests core memory candidate
```

#### LLM-Assisted Evaluation

After each significant interaction, run evaluation prompt:

```
Given this interaction between [Character] and [User]:
[Interaction transcript]

Character's current core memories:
[List of existing core memories]

Evaluate if this interaction should become a core memory.

Consider:
1. Did the character express or experience significant emotional intensity?
2. Did the character's beliefs, self-perception, or values shift?
3. Was there a meaningful change in a relationship?
4. Would this character reasonably remember this moment forever?

If YES, provide:
- Summary of the core memory (2-3 sentences)
- Emotional impact on character
- How this might change character's future behavior
- Relevance score (0-1)

If NO, explain why this is a regular memory rather than core memory.
```

### User Involvement in Core Memories

Users should have visibility and some control:

#### Visibility
- Show users their characters' core memories
- Explain why each was marked as significant
- Display how core memories influence character behavior

#### Control Options
- **Confirm/Reject**: User can confirm suggested core memories or reject them
- **Suggest**: User can suggest a past moment should be a core memory
- **Edit**: User can refine the summary/interpretation (within reason)
- **Remove**: User can demote a core memory (with confirmation)

#### Why User Control Matters
- Users know their story intentions better than the system
- Prevents unwanted character interpretations
- Increases user investment in character development
- Catches extraction errors

### Core Memories for "Evolved" Characters

Loomiverse characters can evolve over time. Core memories must handle:

#### Inherited Memories
When a character evolves (e.g., "young hero" → "battle-worn veteran"):
- Some core memories carry forward (origin story moments)
- New phase may recontextualize old memories
- Evolution event itself becomes a core memory

#### Memory Reinterpretation
As characters grow, core memories may be reframed:

```
Original core memory: "When I was betrayed by my mentor"
Impact: Deep mistrust, isolation

After character growth arc:
Reinterpreted: "When I was betrayed by my mentor - and eventually learned to trust again"
Updated impact: Cautious but open, values loyalty highly
```

### Core Memory Retrieval

Unlike regular RAG (similarity search), core memories are handled specially:

```
┌─────────────────────────────────────────────────────────────┐
│            CORE MEMORY INJECTION RULES                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ALWAYS INCLUDE:                                             │
│  • All core memories (they're part of character identity)   │
│  • Recent emotional state derived from core memories        │
│                                                              │
│  CONDITIONALLY EMPHASIZE:                                    │
│  • When conversation topic relates to a core memory         │
│    → Include full detail, not just summary                  │
│  • When interacting with character from a core memory       │
│    → Surface that specific memory prominently               │
│  • When emotional state matches a core memory trigger       │
│    → Character may reference or be influenced by it         │
│                                                              │
│  NEVER:                                                      │
│  • Omit core memories to save tokens (they're not optional) │
│  • Retrieve them via RAG (they bypass similarity search)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Storage Strategy: Local vs Cloud vs Hybrid

### Option A: Local-Only Storage

```
User's Device
├── SQLite Database / IndexedDB
│   ├── characters/
│   │   ├── character_identity.json
│   │   ├── core_memories.json
│   │   └── long_term_memories.json
│   ├── stories/
│   │   └── story_state.json
│   └── conversations/
│       └── conversation_history.json
```

#### Advantages
- **Zero storage cost** for Loomiverse
- **Complete user ownership** of data
- **Works offline**
- **Privacy maximized** - data never leaves device
- **No sync complexity**

#### Disadvantages
- **No cross-device access** - story on phone can't continue on laptop
- **Data loss risk** - device lost/wiped = memories lost
- **No collaborative features** - can't share characters
- **Limited analytics** - can't understand user patterns

#### When to Use
- Privacy-focused users
- Single-device users
- Offline-first requirements

### Option B: Cloud-Only Storage

```
Loomiverse Cloud
├── PostgreSQL + pgvector
│   ├── users/
│   ├── characters/
│   │   ├── identity
│   │   ├── core_memories
│   │   └── memory_embeddings
│   ├── stories/
│   └── conversations/
```

#### Advantages
- **Cross-device sync** automatic
- **Backup built-in** - no data loss from device issues
- **Enables sharing** - share characters between users
- **Analytics possible** - understand usage patterns
- **Simpler client** - device just displays, doesn't store

#### Disadvantages
- **Storage costs** scale with users
- **Latency** - every operation requires network
- **Privacy concerns** - all user data on our servers
- **Offline unusable** - no internet = no app
- **Compliance complexity** - GDPR, data residency, etc.

#### When to Use
- Multi-device users
- Social/sharing features prioritized
- Users who value convenience over privacy

### Option C: Hybrid Storage (Recommended)

```
User's Device (Local)                    Loomiverse Cloud
├── Full conversation history      ←Sync→ ├── Summarized memories
├── Character identity             ←Sync→ ├── Character identity (backup)
├── Core memories                  ←Sync→ ├── Core memories
├── Recent memories                       ├── Memory embeddings (for RAG)
├── Offline queue                         ├── Relationship graphs
└── User preferences                      └── Sync metadata
```

#### How It Works

1. **Local-First**: Device is source of truth for raw data
2. **Cloud Supplements**: Cloud stores compressed/processed versions
3. **Smart Sync**: Only sync what's needed for cross-device + RAG
4. **Offline Capable**: Core functionality works without internet

#### Sync Strategy

```
LOCAL → CLOUD (Upload)
• Triggered after significant interactions
• Extracts and compresses memories
• Generates embeddings for RAG
• Updates relationship graphs
• Uploads core memory changes

CLOUD → LOCAL (Download)
• On app open (background sync)
• On device switch
• Pulls latest core memories
• Pulls latest character state
• Does NOT pull raw conversations (stays on original device)
```

#### Data Ownership Model

| Data Type | Stored Locally | Stored in Cloud | Owned By |
|-----------|----------------|-----------------|----------|
| Raw conversations | Yes | No | User |
| Character identity | Yes | Yes (backup) | User |
| Core memories | Yes | Yes (sync) | User |
| Long-term memories | Yes (recent) | Yes (all, compressed) | User |
| Memory embeddings | No | Yes | Loomiverse |
| Relationship graphs | Derived locally | Yes | Loomiverse |
| Usage analytics | No | Yes (anonymized) | Loomiverse |

#### Advantages
- **Best of both worlds**: Offline works, sync when online
- **Cost optimized**: Only store processed data in cloud
- **Privacy balanced**: Raw conversations stay local
- **User ownership clear**: Users can export their data anytime
- **Graceful degradation**: Cloud down? Local still works

#### Disadvantages
- **Implementation complexity**: Two storage systems to maintain
- **Sync conflicts**: What if local and cloud diverge?
- **User confusion potential**: "Where is my data?"

---

## Cost Model Considerations

### Cost Components

#### 1. LLM Inference (Dominant Cost)

This is 70-90% of total cost. Optimizing context size is critical.

| Context Size | Cost per Query (est.) | Monthly Cost @ 100 queries/user/month |
|--------------|----------------------|---------------------------------------|
| 20k tokens (full context) | $0.20 | $20/user |
| 8k tokens (hybrid) | $0.08 | $8/user |
| 4k tokens (aggressive) | $0.04 | $4/user |

**Hybrid system target**: 5-9k tokens = ~$0.06/query = **$6/user/month**

#### 2. Embedding Generation

Converting text to vectors for RAG storage.

| Volume | Cost |
|--------|------|
| Per 1k tokens | $0.0001 |
| Per memory (avg 200 tokens) | $0.00002 |
| Per user (1000 memories) | $0.02 |
| 10k users | $200 total (one-time per memory) |

**Negligible compared to inference.**

#### 3. Vector Storage

Storing embeddings for retrieval.

| Provider | Cost per 1M vectors/month |
|----------|---------------------------|
| Pinecone | $0.25 |
| Weaviate Cloud | $0.30 |
| Self-hosted pgvector | ~$50/month for server (millions of vectors) |

Assuming 1000 memories/user × 10k users = 10M vectors = **$2.50-$3/month** on managed, or flat server cost self-hosted.

#### 4. Vector Queries

Searching for relevant memories.

| Provider | Cost per 1k queries |
|----------|---------------------|
| Pinecone | $0.01 |
| Self-hosted | Included in server cost |

At 100 queries/user/month × 10k users = 1M queries = **$10/month** on managed.

#### 5. Cloud Storage (Non-Vector)

PostgreSQL or similar for structured data.

| Data Type | Size per User | 10k Users |
|-----------|---------------|-----------|
| Character profiles | ~10KB | 100MB |
| Core memories | ~50KB | 500MB |
| Metadata | ~20KB | 200MB |
| **Total** | ~80KB | ~800MB |

Cloud database cost for <1GB: **$10-20/month**

### Total Cost Model

#### Per-User Cost Breakdown

| Component | Monthly Cost per User |
|-----------|----------------------|
| LLM inference (100 queries @ 8k context) | $8.00 |
| Embedding generation (amortized) | $0.002 |
| Vector storage (amortized) | $0.0003 |
| Vector queries | $0.001 |
| Cloud storage (amortized) | $0.002 |
| **Total** | **~$8/user/month** |

**Note**: LLM inference dominates. Context optimization is the lever.

#### Scaling Scenarios

| Users | LLM Cost | Storage/Infra | Total Monthly |
|-------|----------|---------------|---------------|
| 1,000 | $8,000 | $50 | $8,050 |
| 10,000 | $80,000 | $200 | $80,200 |
| 100,000 | $800,000 | $1,500 | $801,500 |

### Cost Optimization Levers

#### 1. Context Size Reduction
- Aggressive summarization of memories
- Smarter retrieval (fewer, more relevant memories)
- Core memory compression

**Potential savings**: 30-50% of inference costs

#### 2. Caching
- Cache common character introductions
- Cache repeated queries
- Cache embedding computations

**Potential savings**: 10-20% of inference costs

#### 3. Model Selection
- Use smaller models for extraction/summarization
- Use larger models only for final response
- Consider fine-tuned smaller models for character consistency

**Potential savings**: 40-60% if smaller models work

#### 4. Batching
- Batch memory extraction (end of session, not per message)
- Batch embedding generation
- Batch sync operations

**Potential savings**: Reduced overhead, ~5-10%

### Pricing Tier Recommendations

Based on cost model, suggested user tiers:

| Tier | Price | Includes | Our Cost | Margin |
|------|-------|----------|----------|--------|
| **Free** | $0 | 2 characters, 100 interactions/month, local-only | ~$0.80 | Loss leader |
| **Basic** | $9.99/mo | 10 characters, 500 interactions/month, cloud sync | ~$4.00 | 60% |
| **Pro** | $19.99/mo | 50 characters, 2000 interactions/month, priority | ~$12.00 | 40% |
| **Unlimited** | $39.99/mo | Unlimited characters, unlimited interactions | Variable | Variable |

**Free tier rationale**: Limited enough to prevent abuse, generous enough to demonstrate value.

---

## Implementation Phases

### Phase 1: Foundation (MVP)

**Goal**: Working memory system with local storage

**Components**:
- Local SQLite/IndexedDB storage
- Character identity persistence
- Basic conversation history (last N messages)
- No RAG, no cloud sync

**Memory Model**:
```
Tier 0: Character identity (always in context)
Tier 2: Working memory - last 30 messages (always in context)
```

**User Experience**:
- Characters remember recent conversation
- Characters stay in character (personality)
- No long-term memory across sessions

**Cost**: LLM inference only, no infrastructure

### Phase 2: Long-Term Memory

**Goal**: Characters remember across sessions

**Components**:
- Memory extraction pipeline
- Local long-term memory storage
- Basic retrieval (most recent relevant)
- Manual core memory marking (user-driven)

**Memory Model**:
```
Tier 0: Character identity
Tier 1: Core memories (user-marked, max 5)
Tier 2: Working memory (last 30 messages)
Tier 3: Retrieved memories (basic recency + keyword match)
```

**User Experience**:
- Characters remember important past events
- Users can mark moments as "important"
- Better continuity across sessions

**Cost**: LLM inference + embedding generation

### Phase 3: Intelligent Memory

**Goal**: Automatic core memory detection, better retrieval

**Components**:
- Vector database integration
- Automatic core memory detection
- Semantic retrieval (true RAG)
- Cloud sync for core memories

**Memory Model**:
```
Tier 0: Character identity
Tier 1: Core memories (auto-detected + user confirmed)
Tier 2: Working memory
Tier 3: RAG-retrieved memories
```

**User Experience**:
- Characters automatically remember defining moments
- Better relevance in retrieved memories
- Cross-device sync for core character state

**Cost**: Full infrastructure (vector DB, cloud storage)

### Phase 4: Advanced Features

**Goal**: Rich relationship modeling, character evolution

**Components**:
- Relationship graph storage
- Character evolution system
- Memory reinterpretation
- Collaborative characters (optional)

**Memory Model**:
Full tiered system as described in this document

**User Experience**:
- Characters have rich, evolving relationships
- Characters grow and change meaningfully
- Premium features for power users

---

## Open Questions for Future Evaluation

### Technical Questions

1. **Which vector database?**
   - Pinecone (managed, expensive at scale)
   - Weaviate (hybrid search, self-hostable)
   - pgvector (PostgreSQL extension, simple)
   - Chroma (local-first, simpler)

2. **Which embedding model?**
   - OpenAI embeddings (good quality, API cost)
   - Cohere embeddings (multilingual strength)
   - Open source (sentence-transformers, local)

3. **Memory extraction approach?**
   - LLM-based extraction (accurate, expensive)
   - Rule-based extraction (cheap, limited)
   - Hybrid (rules for common cases, LLM for complex)

4. **Sync conflict resolution?**
   - Last-write-wins (simple, potential data loss)
   - Merge (complex, preserves data)
   - User-prompted resolution (safe, interrupting)

### Product Questions

1. **How much user control over memory?**
   - Full control (edit/delete any memory)
   - Limited control (suggest, but system decides)
   - Minimal control (system handles everything)

2. **Memory visibility to users?**
   - Full transparency (see all memories)
   - Summary view (see core memories only)
   - Hidden (just works, no visibility)

3. **Character memory vs story memory?**
   - Should characters remember things outside their story?
   - Cross-story character interactions?

4. **Memory export/portability?**
   - Can users export their characters' memories?
   - Can characters be "moved" between stories?

### Business Questions

1. **Memory as premium feature?**
   - Free: Basic memory (last N messages)
   - Paid: Full memory system

2. **Memory limits by tier?**
   - How many core memories per character?
   - How many long-term memories stored?

3. **Data retention policy?**
   - How long do we keep inactive user data?
   - User deletion requests - cascade to memories?

---

## References and Resources

### Character.ai Research
- [Character.ai Optimizing Inference Blog](https://research.character.ai/optimizing-inference/)
- [Character.ai Memory Problems Analysis](https://www.roborhythms.com/why-character-ai-memory-broken/)
- [Character.ai Help Center on Memory](https://support.character.ai/hc/en-us/articles/15063870278171-Why-do-Characters-forget-things)

### Memory Architecture Solutions
- [Mem0: Scalable Memory Architecture](https://www.marktechpost.com/2025/04/30/mem0-a-scalable-memory-architecture-enabling-persistent-structured-recall-for-long-term-ai-conversations-across-sessions/)
- [AI Agent Memory: Short/Long Term, RAG, Agentic RAG](https://www.decodingai.com/p/memory-the-secret-sauce-of-ai-agents)
- [Google's Titans + MIRAS for Long-term Memory](https://research.google/blog/titans-miras-helping-ai-have-long-term-memory/)
- [LangGraph Long Memory Implementation](https://github.com/FareedKhan-dev/langgraph-long-memory)

### Technical Deep Dives
- [The AI Memory Problem: Why RAG Needs to Evolve](https://medium.com/@mail.fede.cesarini/the-ai-memory-problem-why-rag-needs-to-evolve-into-something-more-5c3f34441ff0)
- [AI-Native Memory and Persistent Agents](https://ajithp.com/2025/06/30/ai-native-memory-persistent-agents-second-me/)
- [Context Window Scaling Challenges](https://factory.ai/news/context-window-problem)
- [How LLM Memory Works - DataCamp](https://www.datacamp.com/blog/how-does-llm-memory-work)

### Vector Databases
- [Pinecone](https://www.pinecone.io/)
- [Weaviate](https://weaviate.io/)
- [Chroma](https://www.trychroma.com/)
- [pgvector](https://github.com/pgvector/pgvector)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | December 2024 | Initial document creation |

---

*This document should be reviewed and updated as implementation progresses and new information becomes available.*
