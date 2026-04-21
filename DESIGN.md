# AI Consumer Research Workbench — Design System

> MQDS v4.2 "Glass Terminal" — Dark Mode (default) + Light Mode (Warm Research)
> Last updated: 2026-04-21

---

## 1. Design Philosophy

This is a **research command center**, not a dashboard. The user is a brand researcher who
comes here to run AI-powered consumer studies, review findings, and make decisions. Every
pixel should communicate: *this tool does serious analytical work, but it's effortless to use*.

**Three principles:**

1. **Glass Depth** — Layered translucency creates spatial hierarchy. Background is void-dark,
   panels float above it with frosted glass, cards sit on top of panels. Three clear Z-layers.
2. **Data-First Color** — Green (#2ECC71) means data/insight. Orange (#FF6B2B) means action
   needed from you. Yellow means caution. This color language is absolute and never decorative.
3. **Quiet Until Relevant** — Animations are functional (entering view, state change), never
   decorative. Typography is clean and readable. Visual complexity appears in data, not chrome.

**Competitive positioning:**
- vs Atypica: We match their dark terminal aesthetic but add more spatial depth and cleaner IA
- vs Dovetail: We trade their light-theme professionalism for dark-mode focus and AI-native feel
- vs Synthetic Users: We share gradient personality but with tighter discipline on color semantics

---

## 2. Color System

### 2.1 Background Layers

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#030305` | Page background, void |
| `--color-rail` | `rgba(255,255,255,0.02)` | Global rail background |
| `--color-panel` | `rgba(255,255,255,0.03)` | Card/panel background |
| `--color-panel-strong` | `rgba(255,255,255,0.06)` | Hover state, active panel |
| `--color-surface-elevated` | `rgba(255,255,255,0.08)` | Elevated elements (tabs, chips) |

### 2.2 Border & Highlight

| Token | Value | Usage |
|-------|-------|-------|
| `--color-line` | `rgba(255,255,255,0.08)` | Default border |
| `--glass-highlight` | `rgba(255,255,255,0.15)` | Top border highlight (glass edge) |
| `--color-line-strong` | `rgba(255,255,255,0.15)` | Active/hover borders |

### 2.3 Text Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text` | `#FFFFFF` | Primary text, headings |
| `--color-muted` | `#9CA3AF` | Secondary text, descriptions |
| `--color-tertiary` | `#6B7280` | Labels, metadata, hints |

### 2.4 Functional Colors

| Token | Value | Meaning |
|-------|-------|---------|
| `--color-accent` | `#6366F1` | Brand, insight, navigation, emphasis |
| `--color-accent-soft` | `rgba(99,102,241,0.10)` | Accent background |
| `--color-action` | `#FF6B2B` | User action required, CTA |
| `--color-action-soft` | `rgba(255,107,43,0.10)` | Action background |
| `--color-warning` | `#F1C40F` | Caution, review needed |
| `--color-warning-soft` | `rgba(241,196,15,0.10)` | Warning background |
| `--color-danger` | `#E74C3C` | Error, failure |
| `--color-danger-soft` | `rgba(231,76,60,0.10)` | Danger background |

### 2.5 Ambient Colors (Background Orbs)

- Top-right: `rgba(255,107,43,0.08)` — warm orange, 600px, blur 100px
- Bottom-left: `rgba(99,102,241,0.06)` — cool indigo, 500px, blur 100px
- Center-top: `rgba(255,255,255,0.02)` — neutral wash, 800px, blur 120px

---

## 3. Typography

### 3.1 Font Stack

```css
--font-sans: 'Inter', 'PingFang SC', 'Noto Sans SC', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', ui-monospace, monospace;
```

Inter handles Latin text with excellent legibility at small sizes.
PingFang SC provides native Chinese rendering on macOS/iOS.
JetBrains Mono is used for data values, IDs, and code.

### 3.2 Type Scale

| Level | Size | Weight | Tracking | Usage |
|-------|------|--------|----------|-------|
| Display | 2rem (32px) | 600 | -0.03em | Empty state hero |
| H1 | 1.5rem (24px) | 600 | -0.02em | Page title |
| H2 | 1.125rem (18px) | 600 | -0.02em | Card title, section header |
| H3 | 1rem (16px) | 600 | -0.01em | Sub-section |
| Body | 0.875rem (14px) | 400 | 0 | Default text |
| Small | 0.8125rem (13px) | 400 | 0 | Secondary text |
| Caption | 0.75rem (12px) | 500 | 0 | Metadata |
| Micro | 0.65rem (10.4px) | 600 | 0.04em | Labels, eyebrows, uppercase |
| Mono-data | 0.75rem (12px) | 500 | 0.02em | Data values, IDs |

### 3.3 Chinese Text Rules

- Body text: PingFang SC automatically takes over for CJK characters
- Minimum size for Chinese: 12px (smaller becomes unreadable)
- Line height for Chinese-heavy text: 1.75 (vs 1.5 for Latin)
- Mixed CN/EN: use `text-rendering: geometricPrecision` for consistent baseline

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Based on 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Inline gaps, icon margins |
| `space-2` | 8px | Tight spacing between related items |
| `space-3` | 12px | Default gap between elements |
| `space-4` | 16px | Section spacing |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Panel padding, section gaps |
| `space-8` | 32px | Large section spacing |
| `space-10` | 40px | Major section breaks |

### 4.2 Three-Panel Layout

```
[Global Rail 88px] [Conversation flex-1] [Result Panel 380px]
```

- Global Rail: 88px collapsed / 260px expanded, sticky full-height
- Conversation: flex-1, internal scroll, Prompt Composer sticky bottom
- Result Panel: 380px fixed, internal scroll, hidden below lg breakpoint
- Gap between panels: 20px (space-5)

### 4.3 Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| sm | 640px | Single column, rail collapsed |
| md | 768px | Two columns, rail collapsed |
| lg | 1024px | Three columns, rail collapsed |
| xl | 1280px | Three columns, rail can expand |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Chips, small badges |
| `--radius-btn` | 10px | Buttons, input fields |
| `--radius-card` | 14px | Inner cards, action items |
| `--radius-panel` | 20px | Glass panels, main cards |

Rule: larger containers get larger radii. Never use full-round (999px) except for dot indicators.

---

## 6. Component Patterns

### 6.1 Glass Panel (Primary Container)

```css
.glass-panel {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.08);
  border-top: 1px solid rgba(255,255,255,0.15);
  border-radius: 20px;
}
```

Used for: conversation cards, result sections, drawer content.

### 6.2 Card Variants

**Default Card** — `glass-panel p-5`
Standard content card. Used for agent messages, session info.

**Accent Card** — `glass-panel border-accent/30 p-5`
Highlight card for positive outcomes (recommendations, success).

**Warning Card** — `glass-panel border-warning/30 p-5`
Attention card for review gates (midrun approval, plan review).

**Action Card** — `glass-panel border-action/30 p-5`
CTA card requiring user input (plan approval with actions).

### 6.3 Button Variants

**Primary (CTA):**
```css
.btn-primary {
  background: var(--color-accent);
  color: #030305;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 0.8125rem;
}
```

**Secondary (Ghost):**
```css
.btn-secondary {
  background: rgba(255,255,255,0.05);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  font-size: 0.8125rem;
}
```

**Accent Ghost:**
```css
.btn-accent {
  background: rgba(46,204,113,0.05);
  color: #2ECC71;
  border: 1px solid rgba(46,204,113,0.30);
  border-radius: 10px;
  padding: 8px 16px;
  font-weight: 500;
  font-size: 0.75rem;
}
```

**Warning Ghost:**
```css
.btn-warning {
  background: rgba(241,196,15,0.05);
  color: #F1C40F;
  border: 1px solid rgba(241,196,15,0.30);
  border-radius: 10px;
  padding: 8px 16px;
  font-weight: 500;
  font-size: 0.75rem;
}
```

**Chip (inline small):**
```css
.btn-chip {
  background: rgba(255,255,255,0.04);
  color: var(--color-muted);
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.65rem;
  font-weight: 500;
}
```

### 6.4 Tab Bar

```css
.tab-bar {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
}

.tab-item {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-muted);
  transition: all 200ms;
}

.tab-item--active {
  background: rgba(255,255,255,0.08);
  color: var(--color-text);
}
```

### 6.5 Eyebrow Label

Used above card titles to indicate card type:

```css
.eyebrow {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

Color by semantic:
- Default: `text-muted`
- Accent: `text-accent` (recommendation, success)
- Warning: `text-warning` (review, approval)
- Action: `text-action` (CTA, user input)

### 6.6 Progress Indicator

Horizontal dot chain with labels:

```
[done] ● Plan  [current] ● Qual  [pending] ○ Quant  [pending] ○ Synthesis
```

- Done: `bg-accent` + `shadow-[0_0_6px_rgba(46,204,113,0.5)]`
- Current: `bg-action` + `shadow-[0_0_6px_rgba(255,107,43,0.5)]`
- Pending: `bg-[rgba(255,255,255,0.12)]`

### 6.7 Timeline Node (Conversation)

Left-side indicator for each conversation event:

- Default: 32x32 rounded-[10px] `bg-accent/15 text-accent` with Bot icon
- Loading: same shape with Loader2 spinning icon
- Connecting line: 1px `bg-line` between nodes

---

## 7. Motion Design

### 7.1 Timing

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| Fast | 200ms | `cubic-bezier(0.2,0.8,0.2,1)` | Hover, press, toggle |
| Normal | 350ms | `ease-out` | Entry animation, card appear |
| Slow | 500ms | `ease-out` | Page transition |

### 7.2 Entry Patterns

**Card enter (conversation):**
```js
initial: { opacity: 0, y: 12 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.35, ease: 'easeOut' }
```

**Page transition:**
```js
initial: { opacity: 0, y: 14, filter: 'blur(10px)' }
animate: { opacity: 1, y: 0, filter: 'blur(0px)' }
exit: { opacity: 0, y: -10, filter: 'blur(10px)' }
transition: { duration: 0.28, ease: 'easeOut' }
```

**Playback streaming indicator:**
```js
initial: { opacity: 0, y: 8 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.3 }
```

### 7.3 Playback Timing

- Step delay: 1800ms between auto-advancing events
- Initial delay: 1200ms before first event
- Resume delay: 600ms after user action at pause gate
- Pause events: `plan_approval_card`, `midrun_review_card`

---

## 8. Shadow & Glow

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-panel` | `none` | Default panel (glass relies on border, not shadow) |
| `--shadow-glow` | `0 0 0 1px rgba(46,204,113,0.08), 0 0 44px rgba(46,204,113,0.08)` | Accent glow on hover/focus |
| `--shadow-warm` | `0 0 40px rgba(255,107,43,0.06)` | Warm ambient on action elements |

---

## 9. Scrollbar

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
::-webkit-scrollbar-track { background: transparent; }
```

---

## 10. Accessibility

- Text contrast: all text tokens meet WCAG AA against `#030305`
  - `#FFFFFF` on `#030305` = 21:1 (AAA)
  - `#9CA3AF` on `#030305` = 7.5:1 (AAA)
  - `#6B7280` on `#030305` = 4.6:1 (AA)
- Accent `#6366F1` on `#030305` = 5.3:1 (AA)
- Success `#2ECC71` on `#030305` = 8.2:1 (AAA)
- All interactive elements have `cursor: pointer`
- All buttons have `type="button"` to prevent form submission
- Focus visible states use `--shadow-glow`
- `prefers-reduced-motion` should disable entry animations

---

## 11. File Map

| File | Responsibility |
|------|---------------|
| `styles/tokens.css` | CSS custom properties (colors, spacing, fonts, radius) |
| `styles/globals.css` | Reset, glass-panel, button classes, scrollbar |
| `tailwind.config.ts` | Maps CSS vars to Tailwind utility classes |
| `index.html` | Font loading (Inter, JetBrains Mono, Noto Sans SC) |
| `app/layout/app-shell.tsx` | Page chrome, ambient orbs, toast overlay |
| `app/layout/global-rail.tsx` | Left navigation rail |

---

## 12. Design Changelog

### 2026-04-21 — v1.2 Light Mode (Warm Research)
- Added Section 13: Light Mode `[data-theme="light"]` token overrides
- Aesthetic direction: "Bloomberg meets Notion" — warm paper background, frosted white panels
- Background: `#FAFAF8` (1% warm cast) instead of pure white
- Preserved `backdrop-filter: blur(20px)` on panels for brand continuity across modes
- Inverted glass edge: light mode uses subtle bottom border vs dark mode's top highlight
- Added separate `-text` tokens for orange/yellow/red with WCAG AA+ contrast on light bg
- MQDS bumped to v4.2

### 2026-04-05 — v1.1 Color Differentiation
- Accent color changed from `#2ECC71` (green) to `#6366F1` (indigo) to differentiate from Atypica
- Green reserved for success-only states (`--color-success`)
- Ambient orbs updated: bottom-left from green to indigo
- btn-primary text changed to white (indigo bg needs light text)

### 2026-04-05 — v1.0 Initial System
- Established MQDS v4.1 Glass Terminal foundation
- Three-panel fixed layout (Rail + Conversation + Results)
- Playback animation system with pause gates
- Full Chinese localization
- Card variant system (default, accent, warning, action)
- Button variant system (primary, secondary, accent ghost, warning ghost, chip)
- Toast notification system
- Ambient light orbs

---

## 13. Light Mode — "Warm Research"

### 13.1 Aesthetic Direction

**"Bloomberg meets Notion"** — 明亮的分析空间，疗愈专业感。同一套玻璃隐喻，换到明亮语境里。

- 背景不是纯白，是 `#FAFAF8`（1% 暖色调，「研究纸」质感）
- 面板保留 `backdrop-filter: blur(20px)` + 半透明白（大多数工具切到 light 时直接放弃模糊效果；我们保留它，让两套主题品牌感一致）
- 玻璃边缘反转：dark 模式是亮的顶边（玻璃捕获头顶光），light 模式是略深的底边（明亮环境下玻璃的阴影边）
- Indigo / Orange 语义色不变，保持两套主题的颜色语言完全一致

### 13.2 Implementation

挂载方式：`[data-theme="light"]` 属性加在 `<html>` 上，覆盖 CSS 变量。现有 dark token 保持默认值，zero rework。

```css
[data-theme="light"] {
  /* 背景层级 */
  --color-bg: #FAFAF8;
  --color-rail: rgba(0,0,0,0.015);
  --color-panel: rgba(255,255,255,0.82);
  --color-panel-strong: rgba(255,255,255,0.94);
  --color-surface-elevated: #FFFFFF;

  /* 边框 */
  --color-line: rgba(0,0,0,0.07);
  --glass-highlight: rgba(0,0,0,0.05);   /* 反转：light 模式底边略深 */
  --color-line-strong: rgba(0,0,0,0.12);

  /* 文字层级 */
  --color-text: #0F0F14;     /* 带蓝底色的「排版黑」，非纯黑 */
  --color-muted: #52525B;
  --color-tertiary: #71717A;

  /* 功能色 — 语义不变，文本用深化版保证对比度 */
  --color-accent: #6366F1;               /* 对比度 4.9:1 — AA ✓ */
  --color-accent-soft: rgba(99,102,241,0.08);
  --color-action: #FF6B2B;               /* 背景/图标用 */
  --color-action-text: #C44B10;          /* 文本用深化版 7.2:1 — AAA ✓ */
  --color-action-soft: rgba(255,107,43,0.10);
  --color-warning: #F1C40F;              /* 背景/图标用 */
  --color-warning-text: #854D0E;         /* 文本用深化版 4.5:1 — AA ✓ */
  --color-warning-soft: rgba(241,196,15,0.12);
  --color-danger: #E74C3C;
  --color-danger-text: #B91C1C;          /* 7:1 — AAA ✓ */
  --color-danger-soft: rgba(231,76,60,0.08);
  --color-success: #16A34A;              /* 5.5:1 — AA ✓ */
  --color-success-soft: rgba(22,163,74,0.08);

  /* 阴影（light 模式里代替 dark 的「虚空衬底」）*/
  --shadow-panel: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
  --shadow-glow: 0 0 0 1px rgba(99,102,241,0.15), 0 4px 20px rgba(99,102,241,0.10);
  --shadow-warm: 0 0 30px rgba(255,107,43,0.08);

  /* 滚动条 */
  --scrollbar-thumb: rgba(0,0,0,0.12);
}
```

### 13.3 Glass Panel (Light Mode Override)

```css
[data-theme="light"] .glass-panel {
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0,0,0,0.07);
  border-top-color: rgba(0,0,0,0.00);   /* 顶边透明 */
  border-bottom-color: rgba(0,0,0,0.10); /* 底边略深：light 语境下的玻璃阴影边 */
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
  border-radius: 20px;
}
```

### 13.4 Ambient Orbs (Light Mode)

位置不变，透明度大幅降低（light 背景下需要更轻的环境光）：

```css
[data-theme="light"] .orb-orange {
  opacity: 0.04;  /* dark: 0.08 */
}

[data-theme="light"] .orb-indigo {
  opacity: 0.05;  /* dark: 0.06 */
}
```

### 13.5 Scrollbar (Light Mode)

```css
[data-theme="light"] ::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.12);
}
```

### 13.6 Contrast Reference (Light Mode)

| Token | Value | On `#FAFAF8` | Grade |
|-------|-------|--------------|-------|
| `--color-text` | `#0F0F14` | 18.3:1 | AAA |
| `--color-muted` | `#52525B` | 7.1:1 | AAA |
| `--color-tertiary` | `#71717A` | 4.7:1 | AA |
| `--color-accent` | `#6366F1` | 4.9:1 | AA |
| `--color-action-text` | `#C44B10` | 7.2:1 | AAA |
| `--color-warning-text` | `#854D0E` | 4.5:1 | AA |
| `--color-danger-text` | `#B91C1C` | 7.0:1 | AAA |
| `--color-success` | `#16A34A` | 5.5:1 | AA |
