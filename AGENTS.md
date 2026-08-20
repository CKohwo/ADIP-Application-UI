# AGENTS.md — ADIP Application Greenfield Build

## Mission

Build the ADIP Application User Interface from a genuinely empty greenfield workspace.

This repository is NOT a migration, continuation, or repair of the old
`ADIP-Application-user-interface-` implementation.

The old repository is an artifact/reference vault only. Do not assume that
any frontend code from it exists here, works here, or should be copied here.

## Ground Truth

At the beginning of this project:

- There is no implemented Landing page in this repository.
- There is no implemented Home page in this repository.
- There are no implemented Product, Brand, Seller, Category, or System pages.
- There is no existing frontend routing implementation.
- There is no existing frontend state implementation.
- There is no existing frontend API client implementation.
- There is no existing CSS architecture to preserve.
- There is no existing JavaScript architecture to preserve.

Codex must establish the application from first principles.

Do not report an implementation as "already working" unless it has actually
been created and verified in this repository.

## Technology

Frontend:
- Vanilla HTML
- Vanilla CSS
- Vanilla JavaScript
- No React
- No Next.js
- No Taipy
- No Streamlit
- No Gradio
- No frontend build framework unless explicitly approved later

Backend:
- Existing ADIP Intelligence Service / FastAPI backend.
- The frontend is a consumer of the FastAPI API.
- The frontend must not read backend Parquet files, caches, Python modules,
  repository internals, or generated artifacts directly.

## Architectural Principle

The boundary is:

    ADIP Intelligence Service (FastAPI)
                    |
                 HTTP/JSON
                    |
             Vanilla JS API client
                    |
             Application state
                    |
          Router + module renderers
                    |
                DOM/CSS

The frontend owns presentation and interaction.
The backend owns intelligence, data preparation, pipeline execution, and
business computations.

Do not reproduce backend business logic in JavaScript.

## Product Philosophy

The UI should make ADIP understandable to a user who does not already know
the underlying marketplace dataset.

For intelligence modules, prefer:

Discover → Understand → Investigate → Interpret → Decide

A module should not force the user to know an internal product identifier or
technical dataset terminology before they can begin exploring.

## Build Discipline

Work in small, verifiable phases.

Before modifying files:
1. Read this file.
2. Read ARCHITECTURE.md and UX-SPEC.md.
3. Read relevant data-reference documents.
4. Inspect the currently available FastAPI API contract.
5. State what you intend to build.

After each meaningful phase:
1. Run the application.
2. Verify the relevant interactions.
3. Check browser console errors.
4. Check network/API failures.
5. Fix regressions before moving forward.

Never rewrite functioning work merely to make it stylistically different.

Never invent backend endpoints or response fields.

When backend behavior is uncertain, inspect the backend source or call the
running API. Do not guess.

## Large Data

The dataset is large (170K+ records).

The frontend must never render the entire dataset as DOM rows.

Use:
- searchable product discovery
- filtering before rendering
- pagination for catalog views
- a default 25-row page size
- compact summaries rather than raw-dataset dumping

The architecture should remain compatible with future server-side pagination.

## Shared vs Module-Specific Code

Shared infrastructure belongs in reusable files/components:

- API communication
- application state
- routing
- common rendering primitives
- common table/pagination behavior
- common chart/container behavior
- common insight presentation

Module files should contain module-specific configuration and behavior.

Do not prematurely build a giant generic framework. Abstract only repeated
patterns that are demonstrably shared.

## Navigation

The application is a single-page frontend experience.

Navigation should not reload the entire application.

Planned application areas:

- Landing Gate
- Home / Mission Control
- Product Intelligence
- Brand Intelligence
- Seller Intelligence
- Category Intelligence
- System Operations

These are planned destinations, NOT pre-existing implementations.

## Data Contract

The frontend must consume the real FastAPI contract.

Known conceptual data domains include:

- Product features
- Product historical timeseries
- Product AI-generated intelligence
- Corresponding intelligence domains for Brand, Seller, and Category

The supplied reference documents are examples and semantic guides, not
permission to invent endpoint structures.

## Definition of Done

The greenfield application is complete when:

1. Landing experience works.
2. Home / mission-control experience works.
3. Product Intelligence works against the real API.
4. Brand Intelligence works against the real API.
5. Seller Intelligence works against the real API.
6. Category Intelligence works against the real API.
7. System Operations works against the real API.
8. Routing is stable.
9. API failures are handled visibly.
10. Loading states are truthful and tied to real operations.
11. Large datasets are handled safely.
12. Responsive behavior works.
13. Browser console is clean during normal use.
14. No module depends on another module's private implementation.
15. The application can be explained clearly by its author in an interview.

## Important Anti-Patterns

Do NOT:

- import the old application's architecture without explicit reason
- claim old pages are working
- create fake API success states
- simulate successful pipeline completion with timers
- hardcode real dataset rows into production UI
- render 170K records into the DOM
- make the frontend calculate backend intelligence
- create speculative endpoints
- rewrite unrelated working code during a focused task
- optimize for framework badges over architectural clarity