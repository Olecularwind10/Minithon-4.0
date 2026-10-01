# DESIGN.md: Neighborhood Help Platform UI Specification

## 1. Overview & Principles
* **Core Mood:** Approachable civic technology, clean, trustworthy, and modern.
* **Viewport Standard:** Mobile-first responsive layout (390px base width) scaling up to desktop dashboards (1280px).
* **Privacy Standard:** Never display raw coordinates or exact street addresses; always render approximate distance indicators (e.g., "1.4 km away, Near Andheri East").
* **Visual Texture:** Subtle glassmorphism with frosted floating surfaces (`backdrop-blur-md bg-white/85`), soft elevations, and pill-shaped filter controls.

## 2. Color System & Design Tokens

```css
:root {
  /* Brand & Primary Actions */
  --color-primary: #0D9488;          /* Teal 600 - Main actions, active icons */
  --color-primary-hover: #0F766E;    /* Teal 700 - Button hover states */
  --color-primary-subtle: #F0FDFA;   /* Teal 50 - Active tabs, badge backgrounds */

  /* Urgency & Alerts */
  --color-urgency-high: #E11D48;     /* Rose 600 - Urgent tags, emergency highlights */
  --color-urgency-bg: #FFE4E6;       /* Rose 100 - Urgent pill backgrounds */
  --color-urgency-pulse: rgba(225, 29, 72, 0.2);

  /* Trust & Verification */
  --color-trust-verified: #059669;   /* Emerald 600 - Verification badges, success states */
  --color-trust-bg: #ECFDF5;         /* Emerald 50 - Success pill backgrounds */

  /* Accents & Status */
  --color-warning: #D97706;          /* Amber 600 - Rating stars, time slots */
  --color-warning-bg: #FEF3C7;       /* Amber 100 - Amber chip backgrounds */

  /* Surfaces & Canvas */
  --color-bg-canvas: #F8FAFC;        /* Slate 50 - App background */
  --color-surface-card: rgba(255, 255, 255, 0.85); /* Frosted card surface */
  --color-surface-border: #E2E8F0;   /* Slate 200 - Card and container dividers */
  --color-border-subtle: #F1F5F9;    /* Slate 100 */

  /* Typography */
  --color-text-main: #0F172A;        /* Slate 900 - Headings, titles, high contrast */
  --color-text-muted: #475569;       /* Slate 600 - Descriptions, helper labels */
  --color-text-subtle: #94A3B8;      /* Slate 400 - Timestamps, inactive icons */
}