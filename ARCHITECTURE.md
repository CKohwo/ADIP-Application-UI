# ADIP Application — Greenfield Architecture

## 1. Status

This is a greenfield frontend architecture document.

It describes the target system, not an inventory of an existing application.

Nothing in this document should be interpreted as evidence that a page or
feature has already been implemented.

## 2. System Boundary

ADIP Application UI is the presentation layer for the ADIP Intelligence
Service.

```text
                 ADIP INTELLIGENCE SERVICE
                        FastAPI
                           |
                    HTTP / JSON API
                           |
                    ┌──────┴──────┐
                    │   api.js    │
                    └──────┬──────┘
                           |
                    Application State
                           |
                Router / Module Controllers
                           |
                    HTML DOM + CSS
```

The frontend does not access the Intelligence repository's internal files.

## 3. Planned Frontend Layers

```text
index.html / application shell
        |
        +-- Landing Gate
        |
        +-- Shared Application Shell
              |
              +-- Router
              +-- Sidebar
              +-- Topbar
              +-- Global API status
              |
              +-- Home
              +-- Product Intelligence
              +-- Brand Intelligence
              +-- Seller Intelligence
              +-- Category Intelligence
              +-- System Operations
```

The exact file structure may be chosen by the implementation agent provided
the architectural boundaries remain clear.

## 4. Intelligence Module Model

Each intelligence module should answer:

1. What does the dataset contain?
2. What is happening?
3. Why does it matter?
4. What does the AI conclude?
5. What can the user investigate next?

### Product

The Product experience should support:

- product discovery
- selected product profile
- deterministic feature analysis
- historical trends
- AI executive intelligence
- catalog-level discovery/comparison
- market-level context where supported by the API

The product selector must allow a user to discover products rather than assume
they already know product identifiers.

### Brand

Brand intelligence should account for the actual backend data sources and
their contract. Do not invent a source selector until the backend contract
confirms the distinction and available parameters.

### Seller

Seller intelligence should present seller-level signals, comparisons,
and AI interpretation according to the actual API contract.

### Category

Category intelligence should present category-level market signals,
comparisons, and AI interpretation according to the actual API contract.

## 5. Truthful UI State

Visual states must correspond to actual application state.

Examples:

- Loading means a request is actually in progress.
- Success means the request actually succeeded.
- Error means the request failed.
- Pipeline progress must not be fabricated by a timer.

Animation may improve communication, but animation must never impersonate
backend progress.

## 6. Large Data Strategy

Dataset contains 170K+ records.

The UI should use:

- searchable selection
- filtering
- 25-row pagination for catalog browsing
- compact aggregation
- lazy rendering

Future server-side pagination should be possible without redesigning the
entire module.

## 7. Target Architecture Principle

Prefer explicit code over framework magic.

Prefer small understandable abstractions over a large frontend framework.

Prefer reuse where behavior is actually identical.

Do not build a generic abstraction merely because two components currently
look similar.
