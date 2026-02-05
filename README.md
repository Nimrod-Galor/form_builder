# Form Builder

A schema-driven, multi-stage form builder that renders fields dynamically, validates input, and persists draft data in localStorage.

## Features

- Schema-based form rendering
- Multi-stage navigation with progress indicator
- Conditional fields (`showIf`)
- Optional read-only summary stage (schema-controlled)
- Validation with inline errors
- Draft persistence in localStorage
- Accessible labels and helper text
- Plain text informational blocks (no state/validation)

## Project Structure

- index.html — page markup and layout
- formBuilder.js — rendering, state, and UI logic
- schema.js — form schema definition
- validation.js — validation helpers and rules

## Getting Started

Open `index.html` in a browser.

## Notes

- Form values are stored in localStorage under `formDraft`.
- `formSchema` is the source of truth for fields and rules.
- To make the summary stage optional, set `optional: true` on the summary stage in `schema.js`.
