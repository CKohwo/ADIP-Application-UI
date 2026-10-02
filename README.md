# ADIP — Automated Data Intelligence Platform

> **Analytical Intelligence Infrastructure for transforming raw data into structured analytics, historical context, deterministic observations, and AI-generated intelligence.**

ADIP (Automated Data Intelligence Platform) is an end-to-end analytical intelligence system designed to transform continuously collected raw data into structured, explorable, and interpretable intelligence.

The platform integrates data ingestion, transformation, feature engineering, time-series generation, AI-powered insight generation, API delivery, and a browser-based analytical interface into a single system.

Rather than functioning as a traditional dashboard that simply displays raw records, ADIP is designed to answer a more useful question:

> **What can the available data tell us, and how can that intelligence be explored safely and systematically?**

---

## System Overview

ADIP operates as a layered intelligence system:

```text
Raw Data Sources
      │
      ▼
Data Ingestion
      │
      ▼
HTTP / Data Integration Layer
      │
      ▼
Transformation
      │
      ▼
Feature Engineering
      │
      ├──────────────► Feature Intelligence
      │
      ▼
Time-Series Generation
      │
      ├──────────────► Historical Intelligence
      │
      ▼
Context Construction
      │
      ▼
Prompt Templates
      │
      ▼
LLM Insight Engine
      │
      ▼
FastAPI
      │
      ▼
HTTP / JSON API Boundary
      │
      ▼
ADIP Analytical Interface
```

The frontend does **not** access Parquet files, pipeline internals, or backend intelligence artifacts directly.

The architectural boundary is:

```text
FastAPI
→ HTTP / JSON
→ Centralized API Client
→ Application State
→ Module Renderers
→ DOM / CSS
```

This separation allows the intelligence pipeline and presentation layer to evolve independently.

---

# Intelligence Modules

The ADIP application currently contains four intelligence domains and one operational observability module.

## Product Intelligence

Product Intelligence provides exploration and analysis of individual products.

Capabilities include:

* Market overview
* Product discovery
* Product search
* Exact product selection
* Selected product profiles
* Historical trends
* Historical metric selection
* Deterministic interpretation
* AI Executive Insight
* Product catalog
* Search
* Filtering
* Sorting
* Client-side pagination

Product identity is based on:

```text
product_id
```

---

## Brand Intelligence

Brand Intelligence provides source-aware analysis of marketplace brands.

Unlike Seller and Category Intelligence, Brand Intelligence supports separate backend sources and preserves their semantic differences.

Capabilities include:

* Source-specific Brand Intelligence
* API and Web Scraper source separation
* Brand discovery
* Exact brand selection
* Selected Brand Profile
* Historical trends
* Deterministic interpretation
* AI Executive Insight
* Brand catalog
* Dynamic filtering
* Sorting
* Pagination

Brand selection uses the exact backend brand value for the active source.

The module intentionally avoids collapsing source-specific measurements into a false universal schema.

---

## Seller Intelligence

Seller Intelligence analyzes seller-level marketplace measurements using the API intelligence source.

Capabilities include:

* Dataset orientation
* Market overview
* Seller discovery
* Seller search
* Exact seller selection
* Selected Seller Profile
* Historical trends
* Historical metric selection
* Deterministic interpretation
* AI Executive Insight
* Seller catalog
* Dynamic Price Tier filtering
* Sorting
* 25-row client-side pagination

Seller identity is based on:

```text
seller_name
```

Seller Intelligence is currently API-only.

The frontend does not introduce an artificial Scraper Seller source.

---

## Category Intelligence

Category Intelligence analyzes marketplace categories using the Web Scraper intelligence source.

Capabilities include:

* Dataset orientation
* Market overview
* Category discovery
* Category search
* Exact category selection
* Selected Category Profile
* Historical trends
* Historical metric selection
* Deterministic interpretation
* AI Executive Insight
* Category catalog
* Dynamic Price Tier filtering
* Sorting
* 25-row client-side pagination

Category identity is based on:

```text
category
```

The module uses only documented Category measurements and does not invent additional marketplace metrics.

---

# Deterministic Interpretation

ADIP intentionally separates deterministic observations from AI-generated intelligence.

Deterministic Interpretation is derived directly from measured historical data.

The process follows:

```text
Selected Entity
→ Exact Historical Record Matching
→ Copy Records
→ Validate Dates
→ Chronological Sorting
→ Validate Measurements
→ Direct First-to-Last Comparison
→ Bounded Observation
```

Examples of supported deterministic wording include:

* Increased
* Decreased
* Remained unchanged
* Latest recorded value

The deterministic layer does **not** generate:

* Causal explanations
* Revenue claims
* Sales claims
* Demand claims
* Profitability claims
* Forecasts
* Recommendations
* Strategic conclusions

This keeps measured observations distinct from generative interpretation.

---

# AI Executive Insight

AI-generated intelligence is treated as a separate backend-produced layer.

The frontend does not regenerate AI content or derive AI insight from browser-side calculations.

AI insight is rendered from the backend response and remains independent from entity selection.

Depending on the intelligence domain, AI insight can include:

```text
Role
Executive Summary
Key Findings
Opportunities
Risks
Entity Spotlights
```

The frontend preserves backend ordering where applicable and handles missing or partial AI responses defensively.

Backend-provided content is rendered using safe DOM APIs.

---

# System Operations

System Operations provides observability into the ADIP backend and intelligence asset readiness.

It is intentionally separate from the analytical intelligence modules.

## System Health

The application uses:

```text
GET /health
```

The backend returns system-level information including:

* Status
* Service
* Version
* Source asset availability

The frontend reports these values directly from the backend response.

---

## Intelligence Asset Readiness

The health response reports whether intelligence assets exist for each source group.

Current source groups include:

```text
api_product
api_brand
api_seller
scraper_category
scraper_brand
```

Each group reports the availability of:

```text
Features
Timeseries
LLM Insight
```

The System Operations interface derives readiness only from these boolean backend values.

Availability states include:

* Available
* Partial availability
* Unavailable
* Not reported

The interface does not claim pipeline completion, execution success, or hidden processing states that the backend has not reported.

---

## Application Control

System Operations also exposes the ADIP application control endpoint:

```text
POST /run-application
```

The control provides explicit request states:

```text
Idle
→ Starting Application
→ Request Accepted
```

or:

```text
Idle
→ Starting Application
→ Request Failed
```

A successful backend acknowledgement triggers one health refresh.

The interface does not simulate pipeline stages, poll continuously, or claim that the entire intelligence pipeline has completed unless the backend explicitly reports such information.

---

# Backend API

The frontend communicates with ADIP exclusively through the centralized FastAPI client.

Current API capabilities include:

```text
GET /health

POST /run-application

GET /dashboard/product

GET /dashboard/brand?source=api

GET /dashboard/brand?source=scraper

GET /dashboard/seller

GET /dashboard/category
```

The API boundary is a core architectural constraint.

The frontend does not:

* Read Parquet files directly
* Access backend directories
* Access intelligence JSON files directly
* Duplicate backend intelligence logic
* Invent undocumented endpoints
* Fabricate measurements

---

# Frontend Architecture

ADIP uses a Vanilla HTML, CSS, and JavaScript single-page application architecture.

The application uses hash-based routing.

```text
index.html
    │
    ▼
js/app.js
    │
    ├── Router
    │
    ├── Application Shell
    │
    ├── Lazy Module Requests
    │
    └── Module Action Binding
           │
           ▼
      Application State
           │
           ▼
      Module Renderers
           │
           ▼
         DOM / CSS
```

The interface includes:

```text
Landing
│
└── Workspace
    │
    ├── Home / Mission Control
    ├── Product Intelligence
    ├── Brand Intelligence
    ├── Seller Intelligence
    ├── Category Intelligence
    └── System Operations
```

---

# Application State

State is centralized and module-oriented.

Each intelligence module maintains isolated state while sharing common application infrastructure.

Examples include:

```text
product
brand
seller
category
health
pipeline
```

The architecture avoids duplicating operational state.

For example, System Operations reuses shared:

```text
health.status
health.data
health.error

pipeline.status
pipeline.data
pipeline.error
```

rather than creating duplicate System-specific health or pipeline state.

---

# Data Handling Principles

ADIP follows several important data-handling rules.

## Exact Entity Identity

Entities are selected using documented backend identity fields.

Examples:

```text
Product  → product_id
Brand    → brand
Seller   → seller_name
Category → category
```

Historical records use exact entity matching.

---

## Copy Before Sorting

Backend arrays are not mutated during analytical rendering.

Where sorting is required:

```text
Backend Data
→ Copy
→ Filter
→ Sort
→ Render
```

This prevents one interface operation from silently altering shared cached data.

---

## Preserve Valid Zero Values

A value of:

```text
0
```

is not automatically treated as missing.

The application distinguishes between:

```text
0
null
undefined
NaN
blank values
invalid values
```

Valid zero measurements remain visible.

---

## No Fabricated Historical Data

Historical charts and deterministic interpretation do not:

* Interpolate missing dates
* Fill missing values with zero
* Invent intermediate observations
* Manufacture trends

Only usable backend measurements are represented.

---

## Rating Evidence

For historical average-rating analysis, records with zero rating coverage are treated as insufficient evidence for a meaningful average-rating observation.

This filtering is applied specifically to rating interpretation and does not automatically affect unrelated metrics.

---

# Catalog Architecture

Catalog operations are performed client-side using already-loaded feature datasets.

The typical flow is:

```text
Loaded Features
→ Search
→ Filter
→ Copy
→ Sort
→ Paginate
→ Render Current Page
```

Catalogs do not create additional requests during:

* Search
* Filtering
* Sorting
* Pagination
* Entity selection

Pagination is bounded to:

```text
25 rows per page
```

Only the active page is rendered.

---

# Repository Structure

```text
.
├── index.html
├── AGENTS.md
├── ARCHITECTURE.md
├── UX-SPEC.md
├── Backend-contract.md
│
├── css/
│   └── styles.css
│
└── js/
    ├── app.js
    ├── api.js
    ├── config.js
    ├── router.js
    ├── state.js
    │
    └── modules/
        ├── home.js
        ├── product.js
        ├── brand.js
        ├── seller.js
        ├── category.js
        ├── system.js
        └── placeholder.js
```

The exact repository structure may evolve as the platform expands.

---

# Technology Stack

## Backend

* Python
* FastAPI
* Pandas
* NumPy
* Parquet
* HTTP/JSON APIs

## Intelligence Layer

* Feature Engineering
* Time-Series Generation
* Context Construction
* Prompt Templates
* LLM Insight Generation
* Cached AI outputs

## Frontend

* HTML
* CSS
* Vanilla JavaScript
* Hash-based SPA routing
* SVG-based historical charts
* DOM APIs

---

# Design Principles

ADIP is built around several architectural principles.

### Backend authority

The backend owns data processing and intelligence generation.

### API-first integration

The frontend consumes backend intelligence through HTTP/JSON.

### Module isolation

Product, Brand, Seller, Category, and System Operations maintain domain-specific behavior.

### Semantic integrity

Measurements are not renamed into unsupported business concepts.

For example, the frontend does not automatically interpret:

```text
listing_volume → sales
observation_count → revenue
stock movement → demand
median_price → profitability
```

### Deterministic and generative separation

Direct measurement observations remain separate from AI-generated interpretation.

### Source awareness

Where backend sources differ semantically, the frontend preserves those differences instead of forcing them into a misleading common model.

### Truthful UI states

Loading, errors, missing data, unavailable assets, and insufficient evidence are represented explicitly.

### Bounded rendering

Discovery, rankings, and catalogs are intentionally bounded to avoid uncontrolled rendering of large datasets.

### Regression containment

Completed intelligence modules are treated as protected during additive implementation work.

---

# Current Status

## Completed

* Data ingestion foundation
* HTTP data integration
* Data transformation
* Feature engineering
* Time-series generation
* AI Insight Engine
* FastAPI intelligence delivery
* Landing experience
* Home / Mission Control
* Product Intelligence
* Brand Intelligence
* Seller Intelligence
* Category Intelligence
* System Operations
* Application health observability
* Intelligence asset readiness reporting
* Application run control

The current ADIP application represents a complete integrated analytical intelligence interface built on top of the ADIP intelligence infrastructure.

---

# Project Evolution

ADIP began as an exploration into automated data ingestion and gradually evolved into a broader analytical intelligence platform.

Its development has progressed through:

```text
Phase 1
Data Ingestion
        ↓
Phase 2
Transformation + Feature Engineering
        ↓
Phase 2B
AI Insight Engine
        ↓
Phase 3
FastAPI + Analytical Intelligence Interface
```

The result is not intended to be a collection of isolated scripts.

ADIP is being developed as reusable **Analytical Intelligence Infrastructure** capable of supporting multiple intelligence domains and future vertical applications.

---

# Future Direction

Future development may include:

* Expanded intelligence domains
* Additional ingestion sources
* Larger-scale datasets
* Improved deployment infrastructure
* Authentication and access control
* Server-side catalog operations where dataset scale requires them
* Pipeline execution observability with additional backend telemetry
* Additional operational metrics
* More advanced intelligence workflows
* New vertical applications built on the ADIP infrastructure

These capabilities remain future evolution and are not represented as currently implemented functionality.

---

## Core Principle

> **Raw data is not intelligence. ADIP exists to build the infrastructure that transforms data into structured, explorable, historically grounded, and interpretable intelligence.**

---

**ADIP — Automated Data Intelligence Platform**
*Analytical Intelligence Infrastructure*

# Getting Started

## Prerequisites

To run the ADIP analytical interface locally, you need:

* A modern web browser
* The ADIP FastAPI backend running locally or deployed
* Access to the configured ADIP API endpoints

The frontend is a Vanilla HTML/CSS/JavaScript application and does not require a frontend framework runtime.

The backend is expected to provide the HTTP/JSON contract consumed by the application.

---

## Backend Configuration

The frontend API base URL is centrally configured in:

```text
js/config.js
```

The current local development environment uses:

```text
http://127.0.0.1:8000
```

The frontend communicates with the backend exclusively through the centralized API client:

```text
js/api.js
```

When deploying the application, update the configured backend base URL as required by the deployment environment.

The rest of the frontend should not need to know backend file paths, Parquet locations, or intelligence artifact directories.

---

## Running the Application

### 1. Start the ADIP backend

Ensure the FastAPI backend is running and reachable through the configured API base URL.

The application expects endpoints including:

```text
GET  /health
POST /run-application

GET /dashboard/product
GET /dashboard/brand?source=api
GET /dashboard/brand?source=scraper
GET /dashboard/seller
GET /dashboard/category
```

### 2. Serve the frontend

Open the repository through a local web server.

For example, using Python:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

Alternatively, any suitable static development server can be used.

### 3. Navigate through ADIP

The application provides the following journey:

```text
Landing
   ↓
Home / Mission Control
   ↓
Product Intelligence
Brand Intelligence
Seller Intelligence
Category Intelligence
   ↓
System Operations
```

Intelligence modules load their backend payloads lazily when required and reuse successfully loaded data during normal application interaction.

---

# API Usage Model

ADIP uses a centralized request architecture.

Conceptually:

```text
Module Requires Data
        ↓
Centralized API Client
        ↓
HTTP Request
        ↓
FastAPI
        ↓
JSON Response
        ↓
Application State
        ↓
Module Rendering
```

A module does not independently construct duplicate request infrastructure.

This prevents endpoint duplication and keeps backend communication centralized.

For example:

```text
Seller Route Entered
        ↓
Is Seller State Idle?
        │
       Yes
        ↓
api.getSeller()
        ↓
GET /dashboard/seller
        ↓
Store Successful Payload
        ↓
Reuse Cached Payload
```

Subsequent interactions such as:

* Searching
* Selecting an entity
* Changing a historical metric
* Sorting a catalog
* Filtering a catalog
* Changing pages

reuse the already-loaded payload and do not trigger unnecessary requests.

---

# Intelligence Module Pattern

The intelligence modules follow a common conceptual progression:

```text
Discover
    ↓
Understand
    ↓
Investigate
    ↓
Interpret
    ↓
Decide
```

In practical interface terms, this generally becomes:

```text
Dataset Orientation
    ↓
Market Overview
    ↓
Entity Discovery
    ↓
Selected Entity Profile
    ↓
Historical Trends
    ↓
Deterministic Interpretation
    ↓
AI Executive Insight
    ↓
Catalog Exploration
```

Not every domain uses exactly the same internal implementation.

The shared progression provides consistency, while domain-specific field mappings and business semantics remain isolated within their respective modules.

---

# Documentation

The repository contains governing documentation used during the frontend architecture and implementation process.

## `AGENTS.md`

Defines implementation constraints and engineering rules for agent-assisted development.

Examples include:

* Use centralized API communication
* Do not access backend files directly
* Do not invent endpoints
* Do not fabricate data
* Preserve bounded rendering
* Maintain truthful UI states
* Keep shared infrastructure separate from domain-specific behavior

---

## `ARCHITECTURE.md`

Defines the frontend and system architecture.

The core boundary is:

```text
FastAPI
→ HTTP / JSON
→ API Client
→ Application State
→ Router / Module Renderers
→ DOM / CSS
```

It also establishes the shared application shell and module boundaries.

---

## `UX-SPEC.md`

Defines the broader ADIP application journey and visual system.

It governs areas including:

* Landing experience
* Workspace structure
* Responsive behavior
* Accessibility expectations
* Analytical layout conventions
* Dark visual system
* Intelligence exploration patterns

---

## `Backend-contract.md`

Defines the frontend's authoritative understanding of backend data.

The contract establishes:

* Available endpoints
* Payload structure
* Entity identity
* Documented fields
* Valid metrics
* Source boundaries
* Historical processing rules
* AI insight schemas
* Forbidden interpretations
* Missing-data behavior

The frontend must follow the contract rather than infer undocumented backend capabilities.

---

# Engineering Approach

This repository was developed using a constrained, contract-first implementation process.

The workflow used for new intelligence modules was:

```text
1. Inspect Backend Evidence
        ↓
2. Define Backend Contract
        ↓
3. Perform Repository Reconnaissance
        ↓
4. Identify Architecture Boundaries
        ↓
5. Define Protected Existing Work
        ↓
6. Implement One Phase at a Time
        ↓
7. Inspect Implementation Changes
        ↓
8. Manually Validate Application Behavior
        ↓
9. Continue Only After Confirmation
```

This approach was particularly important because the application contains shared:

* State
* Routing
* API infrastructure
* Application shell
* CSS infrastructure

A poorly scoped implementation could introduce regressions into completed modules.

For that reason, intelligence functionality was added incrementally with explicit boundaries around existing Product, Brand, Seller, Category, Home, Landing, and infrastructure components.

---

# What ADIP Is Not

ADIP deliberately avoids several misleading architectural patterns.

It is not simply:

* A static dashboard
* A collection of charts
* A frontend reading local data files
* An LLM wrapper with no analytical infrastructure
* A system that treats AI output as the same thing as measured data
* A system that invents business meaning from unrelated metrics

ADIP instead preserves the distinction between:

```text
Measured Fact
        ↓
Deterministic Observation
        ↓
AI-Generated Interpretation
```

Each layer has a different source of authority.

---

# Current Scope

The current repository represents the completed analytical application layer for the present ADIP intelligence domains.

### Implemented intelligence domains

| Domain                | Source      |
| --------------------- | ----------- |
| Product Intelligence  | API         |
| Brand Intelligence    | API         |
| Brand Intelligence    | Web Scraper |
| Seller Intelligence   | API         |
| Category Intelligence | Web Scraper |

### Operational capabilities

| Capability                     | Status          |
| ------------------------------ | --------------- |
| System Health                  | Implemented     |
| Intelligence Asset Readiness   | Implemented     |
| Application Run Control        | Implemented     |
| Health Refresh                 | Implemented     |
 
The System Operations module intentionally reports only what the current backend contract supports.

---

# Project Status

**Current Status: Core ADIP analytical application build complete.**

The system currently integrates:

```text
Data Intelligence Infrastructure
        +
Feature Intelligence
        +
Historical Intelligence
        +
Deterministic Interpretation
        +
AI Executive Insight
        +
FastAPI Delivery
        +
Analytical SPA
        +
System Observability
```

The project has progressed from isolated data-processing and ingestion experiments into an integrated analytical intelligence system.

---

# Final Architecture Summary

```text
                           ADIP
          Automated Data Intelligence Platform
                              │
         ┌────────────────────┴────────────────────┐
         │                                         │
         ▼                                         ▼
 Intelligence Production                    Intelligence Consumption
         │                                         │
         │                                  Vanilla JavaScript SPA
         │                                         │
 Raw Data                                   ┌──────┴──────┐
     │                                      │             │
     ▼                                      ▼             ▼
 Ingestion                              Intelligence   System
     │                                  Modules       Operations
     ▼                                      │             │
 Transformation                            ├── Product   ├── Health
     │                                     ├── Brand     ├── Readiness
     ▼                                     ├── Seller    └── Application Control
 Feature Engineering                      └── Category
     │
     ▼
 Time-Series Generation
     │
     ▼
 Context Construction
     │
     ▼
 LLM Insight Engine
     │
     ▼
 FastAPI
     │
     ▼
 HTTP / JSON API Boundary
     │
     └───────────────────────────────────────────────►
```

---

# Core Principle

> **Raw data is not intelligence. ADIP exists to provide the infrastructure that transforms data into structured, explorable, historically grounded, and interpretable intelligence.**

---

## Author

**Charles Onokohwomo**

Technologist· Python Engineer · Backend & Data Engineer · Applied AI Infrastructure
