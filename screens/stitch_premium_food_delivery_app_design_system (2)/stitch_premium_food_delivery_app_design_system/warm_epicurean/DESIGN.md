---
name: Warm Epicurean
colors:
  surface: '#fff8f5'
  surface-dim: '#e1d8d3'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2ec'
  surface-container: '#f6ece7'
  surface-container-high: '#f0e6e1'
  surface-container-highest: '#eae1db'
  on-surface: '#1f1b18'
  on-surface-variant: '#5b403a'
  inverse-surface: '#342f2c'
  inverse-on-surface: '#f8efea'
  outline: '#8f7068'
  outline-variant: '#e4beb5'
  surface-tint: '#b32a00'
  primary: '#af2900'
  on-primary: '#ffffff'
  primary-container: '#d63c0f'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a1'
  secondary: '#645d58'
  on-secondary: '#ffffff'
  secondary-container: '#ebe1da'
  on-secondary-container: '#6a635e'
  tertiary: '#615b54'
  on-tertiary: '#ffffff'
  tertiary-container: '#7a746c'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd2'
  primary-fixed-dim: '#ffb4a1'
  on-primary-fixed: '#3c0800'
  on-primary-fixed-variant: '#891e00'
  secondary-fixed: '#ebe1da'
  secondary-fixed-dim: '#cec5bf'
  on-secondary-fixed: '#1f1b17'
  on-secondary-fixed-variant: '#4c4641'
  tertiary-fixed: '#eae1d8'
  tertiary-fixed-dim: '#cdc5bd'
  on-tertiary-fixed: '#1f1b16'
  on-tertiary-fixed-variant: '#4b4640'
  background: '#fff8f5'
  on-background: '#1f1b18'
  surface-variant: '#eae1db'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: '0'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: '0'
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: '0'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: '0'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1.25rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses the warmth, craftsmanship, and quiet luxury of Michelin-level culinary experiences translated to an effortless mobile environment. It merges editorial elegance with modern digital utility, evoking the sensory delight of pristine table linens, artisanal plating, and personalized hospitality.

The visual style is **Contemporary Epicurean Warmth**—a refined synthesis of warm minimalism and editorial typography. Tactile warmth supersedes cold corporate tech conventions. Interfaces prioritize breathable, generous negative space, intentional rhythm, and smooth micro-interactions that mirror the unhurried grace of high-end dining services.

## Colors

The palette establishes an appetizing, sun-drenched hospitality ambiance grounded in rich charcoal foundations:

- **Primary (`#E8481C`)**: Blood orange vermilion. Applied selectively for high-intent conversion points, critical statuses, and luminous accents to maintain an upscale presence rather than overwhelming the interface.
- **Secondary (`#6E6762`)**: Muted warm gray-brown. Provides balanced contrast for supporting metadata, subheadings, and secondary interaction states without competing with key culinary imagery.
- **Tertiary (`#EFE6DD`)**: Warm stone divider tint. Utilized for featherweight hairline strokes, separator borders, and subtle structural frames.
- **Neutral (`#1F1B18`)**: Deep roasted charcoal. Used for primary typography and high-emphasis icons, avoiding harsh artificial blacks in favor of an organic espresso tone.
- **Surface Canvas (`#FFF8F1`)**: Warm whipped cream base tone providing a gentle, paper-like substrate across all viewports.

## Typography

Typography pairs the sculptural grace of **Playfair Display** with the clean geometric legibility of **Plus Jakarta Sans**.

- **Editorial Headings**: Playfair Display introduces culinary sophistication across restaurant names, curated menu categories, and marketing statements. Tight letter spacing preserves rhythm and presence.
- **Interface & Mechanics**: Plus Jakarta Sans handles transactional information, ingredient specs, pricing, and system notifications. Its humanist curves complement the warm display serif while preserving scanning speed across handheld touchpoints.
- **Numbers & Prices**: Tabular figures in Plus Jakarta Sans Semi-Bold are used for currency and item counts to prevent horizontal jump during real-time cart recalculations.

## Layout & Spacing

The layout is built around an airy 4-column fluid mobile grid scaling to an 8-column tablet grid and a centered 12-column desktop experience capped at 1280px.

- **Generous Canvas Margins**: Mobile viewports utilize an unconfined `1.25rem` (20px) outer margin, allowing imagery and culinary showcases to breathe without feeling boxed in.
- **Vertical Cadence**: Spacing relies on a foundational 4px/8px modular rhythm. Complex food cards reserve `1.5rem` between sections to ensure clear visual hierarchy.
- **Fluid Horizontal Shelves**: Menu sections, chef spotlights, and category pills utilize edge-to-edge overflow carousel strips that align with the starting margin on initial load.

## Elevation & Depth

Visual hierarchy uses soft ambient diffusion tinted with warm vermilion undertones rather than cold synthetic black shadows.

- **Tonal Substrates**: Depth is established by layering. The base canvas (`#FFF8F1`) supports elevated cards rendered in pure `#FFFFFF` with warm hairline borders (`#EFE6DD`).
- **Warm Glow Diffusion**: Key interactive elements, such as checkout floating actions and elevated badges, feature a signature primary glow: `0 8px 24px -4px rgba(232, 72, 28, 0.22)`.
- **Floating Modals & Sheets**: Bottom checkout sheets and sticky ordering bars utilize a gentle, high-radius ambient shadow: `0 -12px 32px -8px rgba(31, 27, 24, 0.06)`, framed with a top hairline stroke in `#EFE6DD`.

## Shapes

The geometric identity combines soft architectural rectangles for content frames with fluid pill silhouettes for action mechanisms:

- **Input Fields & Display Cards**: Feature a soft `1rem` (16px) corner radius, conveying tailored balance without harsh corners.
- **Interactive Pills**: Action buttons, search badges, status indicators, and category triggers employ full pill silhouettes (`28px` to `9999px` border radius).
- **Culinary Media**: Menu item hero photography adopts matching `1rem` corner rounding, maintaining a unified visual frame across the app.

## Components

### Buttons
- **Primary Action (Pill)**: Height of 52px, border-radius of 28px (or 9999px). Solid fill of `#E8481C`, label in `#FFF8F1` (Plus Jakarta Sans, Semi-Bold 15px). Enhanced with ambient warm glow shadow `0 8px 20px -4px rgba(232, 72, 28, 0.28)`.
- **Secondary Action**: Height of 52px, border-radius of 28px. Transparent fill with a 1px border in `#EFE6DD`, text in `#1F1B18`. Active state shifts background to `#FFF8F1`.
- **Ghost Action**: Unbordered pill button with `#1F1B18` or `#E8481C` typography, padding: `0.5rem 1rem`.

### Input Fields
- Built with a uniform 52px height, 16px corner radius (`rounded-lg`), and crisp `#FFF8F1` or pure `#FFFFFF` background.
- Border stroke is 1px solid `#EFE6DD`. On focus, the stroke transitions to `#E8481C` with an outer warm halo `0 0 0 3px rgba(232, 72, 28, 0.12)`.
- Placeholder text in `#6E6762`, input text in `#1F1B18`. Left-aligned icons maintain an optical alignment of 16px padding.

### Chips & Filter Pills
- Compact 36px height with fully rounded pill radii (18px+).
- Unselected: Surface `#FFFFFF`, border 1px `#EFE6DD`, label `#6E6762`.
- Selected: Surface `#1F1B18`, border 1px `#1F1B18`, label `#FFF8F1`, accompanied by subtle category counts or check icons.

### Cards (Culinary & Vendor)
- Constructed with `#FFFFFF` background surfaces, 16px corner radius, and subtle 1px `#EFE6DD` perimeter borders.
- Padding inside cards defaults to `1rem` (16px).
- Photography spans the full top card width with internal aspect ratio `16:10`, nested flush with the top-left-right 16px curve.
- Price tags utilize tabular numerals set against micro pill backdrops (`#FFF8F1`).

### Lists & Selection Controls
- **Lists**: Clean horizontal dividers using 1px `#EFE6DD` borders, eliminating side bleeds to keep content aligned with text baselines.
- **Checkboxes & Radios**: 20px circular controls. Unchecked has a 1.5px border in `#6E6762`. Checked transitions to `#E8481C` fill with a pure white glyph and subtle warm diffusion.

### Elevated Food Experience Modules
- **Chef's Note Callouts**: Subtle `#FFF8F1` containers with a left-accent 3px pill border in `#E8481C` and Playfair Display italic commentary.
- **Dietary & Allergen Badges**: Minimalist 24px micro-pills with `#FFF8F1` background, 1px `#EFE6DD` border, and `#6E6762` typography at 11px uppercase.