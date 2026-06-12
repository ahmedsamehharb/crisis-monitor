# AGENTS.md

## Project Overview

This project is a Crisis Intelligence Platform for German emergency management organizations.

The system collects crisis-related information from official and public sources, consolidates duplicate reports, estimates event credibility and severity, and presents a ranked list of incidents to operators.

The system is NOT a prediction system.

The system detects, aggregates, validates, and summarizes ongoing events.

Primary users:

* VOST Germany
* Emergency coordinators
* Crisis management teams
* Situation center operators

---

# Core Objectives

For every detected event:

1. Collect reports from multiple sources.
2. Merge duplicate reports referring to the same incident.
3. Estimate credibility.
4. Estimate severity.
5. Generate a concise situation summary.
6. Show supporting evidence.
7. Show source provenance.
8. Rank incidents by operational importance.

---

# Technology Stack

Frontend:

* React
* TypeScript
* Vite

Backend:

* Node.js

Data Storage:

* Supabase

Search:

* OpenSearch or Elasticsearch

Maps:

* OpenStreetMap

AI:

* LLM used only for:

  * summarization
  * entity extraction
  * duplicate detection assistance

The LLM must NEVER be treated as a source of truth.

---

# Source Categories

## Official Sources (Highest Trust)

Examples:

* DWD
* HVZ
* PEGELONLINE
* Police
* Fire Departments
* Municipal Warning Systems
* Government Press Releases

Default trust level:
0.9 - 1.0

---

## News Sources

Examples:

* SWR
* Local newspapers
* Regional broadcasters

Default trust level:
0.7 - 0.9

---

## Public Sources

Examples:

* Bluesky
* Reddit
* X
* Facebook
* Instagram
* TikTok

Default trust level:
0.2 - 0.7

Public sources can support an event but should not independently confirm it.

---

# Event Model

Every event must contain:

```ts
interface CrisisEvent {
  id: string;

  title: string;

  summary: string;

  category:
    | "flood"
    | "storm"
    | "wildfire"
    | "fire"
    | "traffic"
    | "infrastructure"
    | "accident"
    | "public_safety"
    | "other";

  location: {
    lat: number;
    lon: number;
    name: string;
  };

  firstDetectedAt: string;
  lastUpdatedAt: string;

  credibilityScore: number;
  severityScore: number;

  confidenceLevel:
    | "low"
    | "medium"
    | "high"
    | "verified";

  sourceCount: number;

  sources: SourceReference[];

  status:
    | "active"
    | "monitoring"
    | "resolved";
}
```

---

# Duplicate Detection

Multiple reports may describe the same incident.

The system must attempt to merge reports when:

* timestamps are close
* locations are near
* extracted entities match
* semantic similarity is high

Example:

Report A:
"Road flooded near Karlsruhe"

Report B:
"Flooding closes highway near Karlsruhe"

Likely same event.

Create one CrisisEvent.

Do not create duplicates.

---

# Credibility Scoring

Credibility estimates whether an event is real.

Factors:

* source trust
* number of independent sources
* agreement between sources
* official confirmation
* recency

Example:

Official DWD warning:
95-100

3 independent news reports:
80-90

20 social media witnesses:
60-80

Single social media post:
20-40

Credibility must always be explainable.

Store evidence used for scoring.

---

# Severity Scoring

Severity estimates operational impact.

Range:
0-100

Factors:

* affected population
* geographic area
* infrastructure disruption
* injuries
* fatalities
* evacuation orders
* weather intensity
* traffic impact

Example:

Minor road closure:
15

Local flooding:
40

Major flood:
80

State-wide disaster:
95+

Severity must be explainable.

---

# Ranking Formula

Operational Priority:

priorityScore =
severityScore * 0.7 +
credibilityScore * 0.3

Sort incidents by priorityScore descending.

Never rank purely by popularity.

---

# Summarization Rules

The AI summary must:

* be factual
* cite source count
* mention uncertainty
* avoid speculation

Good:

"Flooding has been reported near Karlsruhe by 12 independent sources including DWD and local authorities."

Bad:

"A catastrophic flood is likely underway."

---

# Source Provenance

Every displayed fact must be traceable.

Users must be able to inspect:

* source name
* source URL
* timestamp
* extracted content

Never lose provenance.

---

# AI Rules

The AI assistant must:

* never invent incidents
* never invent sources
* never invent coordinates
* never fabricate confidence scores
* never generate fake API responses

If data is missing:

return null

not fabricated values.

---

# Architecture

Pipeline:

Ingestion
→ Normalization
→ Entity Extraction
→ Geocoding
→ Duplicate Detection
→ Credibility Scoring
→ Severity Scoring
→ Summarization
→ Storage
→ Dashboard

Each stage should be implemented as an independent service.

---

# Development Rules

When generating code:

* use JavaScript strict mode
* write reusable modules
* write tests for scoring logic
* prefer pure functions
* separate business logic from UI

Never mock production APIs unless explicitly requested.

Never invent API endpoints.

Always verify endpoint existence before implementation.
