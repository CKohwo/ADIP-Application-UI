# ADIP Application — Greenfield UX Specification

## Purpose

This document describes the intended user experience for the new application.

It is a target specification. It is NOT a statement that these screens
already exist.

## Application Journey

```text
Landing Gate
     |
     v
Home / Mission Control
     |
     +---- Product Intelligence
     |
     +---- Brand Intelligence
     |
     +---- Seller Intelligence
     |
     +---- Category Intelligence
     |
     +---- System Operations
```

## Landing Gate

Purpose:
- establish ADIP identity
- explain the platform succinctly
- provide a clear entry point into the workspace

No unnecessary backend request should be required simply to display the gate.

## Home / Mission Control

Purpose:
- communicate system state
- expose intentional system validation
- expose pipeline execution
- orient the user to the intelligence modules

Core ideas:
- API/system status
- data/module availability
- pipeline metadata
- module navigation

The final implementation must use real backend state where backend state is
available. Decorative animation must never be presented as proof of successful
execution.

## Intelligence Module UX

Every module should provide a consistent mental model while preserving its
domain-specific content.

Preferred sequence:

Discover
  -> Understand
  -> Investigate
  -> Interpret
  -> Decide

## Product Intelligence

Primary entry point:
- searchable product discovery

After selection:
- product identity/context
- current feature signals
- historical trends
- deterministic interpretation
- AI executive insight

Secondary:
- catalog browse/search/filter/sort
- 25-row pagination
- comparison-oriented discovery

A user should not need to know an internal product identifier.

## Visual Language

The original ADIP direction is a dark analytical interface.

Core palette:

- background: #020617
- cards/sidebar: #0f172a
- inner surface: #0a0e1a
- primary: #38bdf8
- success: #22c55e
- warning: #f59e0b
- error: #ef4444

Typography:
- Inter with system fallback

These values are design guidance, not a reason to compromise usability.

## Responsive Behavior

Desktop:
- full navigation
- analytical multi-column layouts where appropriate

Tablet:
- compact navigation

Mobile:
- navigation becomes an overlay
- analytical cards stack
- tables become appropriately scrollable or transformed for readability

## Accessibility

Interactive controls must:
- be keyboard reachable
- expose meaningful labels
- have visible focus
- communicate loading/error states
- avoid relying solely on color
