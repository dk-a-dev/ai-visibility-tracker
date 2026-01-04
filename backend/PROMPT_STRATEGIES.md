# Prompt Distribution Strategies

## Overview

Different brands have different AI visibility goals. The prompt distribution feature allows you to customize which types of questions get asked about your brand based on your strategy.

## Default Distribution

```json
{
  "informational": 0.35,    // 35% - Discovery phase questions
  "comparison": 0.30,       // 30% - Competitive evaluation
  "problem_solving": 0.20,  // 20% - Solution-seeking queries
  "feature": 0.15          // 15% - Feature-specific questions
}
```

This balanced approach works well for most brands.

## Recommended Strategies by Brand Type

### 🚀 Startup (Building Awareness)

**Goal:** Get discovered in broad searches

```json
{
  "informational": 0.50,    // High - "What are the best..."
  "comparison": 0.20,       // Low - Not competing yet
  "problem_solving": 0.20,  // Medium - Solution-focused
  "feature": 0.10          // Low - Features not well-known
}
```

**Use when:**
- New to market
- Building brand awareness
- Want to appear in discovery searches

### ⚔️ Competitive Brand (Fighting for Market Share)

**Goal:** Win head-to-head comparisons

```json
{
  "informational": 0.25,    // Low - Already known
  "comparison": 0.45,       // High - Direct comparisons
  "problem_solving": 0.20,  // Medium - Solution quality
  "feature": 0.10          // Low - Features are secondary
}
```

**Use when:**
- Established player
- Direct competitors exist
- Need to win "X vs Y" queries

### 🎯 Feature-Rich Product (Differentiation)

**Goal:** Showcase unique capabilities

```json
{
  "informational": 0.30,    // Medium - General visibility
  "comparison": 0.25,       // Medium - Compare features
  "problem_solving": 0.15,  // Low - Focus on features
  "feature": 0.30          // High - "Which tool has X?"
}
```

**Use when:**
- Unique features
- Technical differentiation
- Complex product

### 🔧 Solution-Focused (Problem Solver)

**Goal:** Be the answer to specific problems

```json
{
  "informational": 0.25,    // Low - Specific use case
  "comparison": 0.25,       // Medium - Compare solutions
  "problem_solving": 0.40,  // High - "How to solve X?"
  "feature": 0.10          // Low - Solutions matter more
}
```

**Use when:**
- Solving specific pain points
- Problem-first approach
- Consultative selling

## How to Use

### In API Request

When creating a project, include `prompt_distribution`:

```json
{
  "name": "My SaaS Product",
  "category": "Project Management Software",
  "brands": [
    {"name": "MyProduct", "is_primary": true},
    {"name": "Competitor1"},
    {"name": "Competitor2"}
  ],
  "primary_goals": ["Increase brand awareness"],
  "prompt_distribution": {
    "informational": 0.50,
    "comparison": 0.20,
    "problem_solving": 0.20,
    "feature": 0.10
  }
}
```

### In Frontend Survey

Add a question like:

**"What's your primary goal for AI visibility?"**

- 📣 **Build brand awareness** → Startup strategy (50% informational)
- ⚔️ **Beat competitors** → Competitive strategy (45% comparison)
- 🎯 **Showcase unique features** → Feature-rich strategy (30% feature)
- 🔧 **Be the solution** → Problem-solving strategy (40% problem-solving)
- ⚖️ **Balanced approach** → Default (35/30/20/15)

The frontend automatically sets the distribution based on their selection.

## Prompt Categories Explained

### Informational (Discovery)
Users exploring options, not yet comparing:
- "What are the best {category} for startups?"
- "Top {category} in 2026"
- "Leading {category} platforms"

### Comparison (Evaluation)
Direct brand comparisons:
- "{Brand1} vs {Brand2} for team collaboration"
- "Free vs paid {category} comparison"
- "Which {category} has better automation?"

### Problem-Solving (Decision)
Solution-focused queries:
- "How to solve data silos with {category}?"
- "Need {category} for remote team management"
- "Which {category} handles integration best?"

### Feature-Specific (Technical)
Capability-focused:
- "Which {category} has API access?"
- "{category} with Slack integration"
- "Best {category} for mobile users"

## Tips

1. **Match your marketing strategy** - If your content focuses on comparisons, use competitive distribution
2. **Consider your funnel stage** - Early stage = informational, late stage = comparison
3. **Test and iterate** - Try different strategies and compare results
4. **Seasonal adjustments** - Launch phase vs growth phase might need different strategies
5. **Competitive response** - If competitors dominate comparisons, focus on problem-solving

## Example: A Real Scenario

**Scenario:** A new CRM for startups competing with Salesforce and HubSpot.

**Strategy Decision:**
- Don't compete head-to-head with Salesforce (they'll win)
- Focus on "CRM for startups" niche
- Highlight ease of use (problem-solving)

**Distribution:**
```json
{
  "informational": 0.45,    // "Best CRM for startups"
  "comparison": 0.15,       // Minimal direct comparison
  "problem_solving": 0.30,  // "Easy CRM setup for small teams"
  "feature": 0.10          // Basic feature mentions
}
```

**Result:** Appears in startup-specific searches, avoids losing head-to-head with giants.

---

## Implementation Details

- Stored in `projects.prompt_distribution` (JSONB column)
- Falls back to default if not provided
- Used by `generate_prompts()` in prompt_generator.py
- Can be updated anytime via PATCH /api/projects/{id}

## Future Enhancements

- AI-recommended distribution based on category and competitors
- A/B testing different distributions
- Historical analysis of which distribution performs best
- Auto-adjust based on current visibility metrics
