# Amex Reveal Real Rates

A Tampermonkey userscript that reveals the **real** credit card offer terms on American Express pages — cutting through the inflated "As High As" marketing language.

## The Problem

Amex appends `oneXpVariant=elevatedOffer_variant` to their Rates & Fees links. This makes the terms page show inflated language like:

> **"As High As 300,000"** Membership Rewards® points Welcome Offer

But if you remove that parameter, you see the **actual offer**:

> **"Earn 200,000"** Membership Rewards® Points

| With `elevatedOffer_variant` | Without (Real Rate) |
|---|---|
| "As High As 300,000 points" | "Earn 200,000 points" |

## What This Script Does

1. **Auto-rewrites all Rates & Fees links** on Amex card pages — strips the `oneXpVariant` parameter so they point to real terms
2. **Adds a floating "🔍 View Real Rates & Fees" button** — click it to open the real terms in a new tab
3. **SPA-aware** — watches for dynamically injected links and cleans them in real time

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser
2. [Click here to install the script](https://raw.githubusercontent.com/justinwlin/AmexRevealAsHighAs/main/amex-reveal-real-rate.user.js) — Tampermonkey will prompt you to install it
3. Visit any Amex credit card page — the button appears in the bottom-right corner

## License

MIT
