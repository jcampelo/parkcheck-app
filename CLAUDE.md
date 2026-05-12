# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step — open any HTML file directly in the browser:

- `index.html` — landing page with role selection
- `cliente.html` — customer check-in interface
- `gerente.html` — manager dashboard

For local development, use any static file server (e.g., `npx serve .` or VS Code Live Server extension).

## Architecture

Vanilla HTML/CSS/JS single-page app with no framework or bundler. All state is persisted in browser `localStorage` under two keys:

- `parkcheck_data` — array of check-in/check-out records
- `parkcheck_settings` — pricing configuration

### Pages

| File | Role | Responsibility |
|------|------|---------------|
| `index.html` | Landing | Role selection (Cliente / Gerente) |
| `cliente.html` | Customer | Check-in form, voucher PNG download via Canvas API |
| `gerente.html` | Manager | Vehicle list, live duration/cost updates, checkout modal, settings |

### Data Model

```js
// Check-in record (parkcheck_data[])
{ id, plate, name, phone, checkinTime, status, checkoutTime, amount }

// Pricing settings (parkcheck_settings)
{ rateFirstHour, rateSubsequent, useSubsequentRate, showCost }
```

### Key Conventions

- UI language is Brazilian Portuguese throughout.
- Layout is mobile-first, capped at `max-width: 430px` (phone mockup).
- Colors use the OKLCh color space via CSS custom properties.
- The manager dashboard refreshes vehicle durations and costs every 10 seconds via `setInterval`.
- Currency is formatted as Brazilian Real (`R$`).
- Vouchers are generated as PNG downloads using the Canvas API (no server-side PDF).
