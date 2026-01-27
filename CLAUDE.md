# CLAUDE.md - AI Assistant Guide

This document provides context for AI assistants working with this codebase.

## Project Overview

This is a **Week 1 Homework project** for **KIEI925: Startup Programming & Management** at Northwestern University's Kellogg School. The project teaches web fundamentals through progressive exercises focusing on HTML, CSS, and semantic markup.

## Repository Structure

```
week_1_homework/
├── part_5/                          # Semantic HTML Exercise
│   ├── syllabus.html               # Basic semantic HTML structure
│   └── semantic_syllabus.png       # Reference screenshot
│
├── part_6/                          # CSS Styling Exercise
│   ├── syllabus.html               # Styled syllabus with custom fonts
│   ├── styles.css                  # CSS with @font-face declarations
│   └── fonts/                       # Computer Modern font files
│       ├── cmunrm.* (regular)
│       ├── cmunbx.* (bold)
│       ├── cmunti.* (italic)
│       └── cmunci.* (bold italic)
│
├── part_7/                          # Landing Page Project
│   ├── handwritten_landing.html    # Main working file
│   ├── styles.css                  # Landing page styles
│   ├── screenshot_1.png            # Product screenshot
│   ├── screenshot_2.png            # Product screenshot
│   ├── handwritten_goal.png        # Design reference image
│   └── handwritten_solution/       # Reference solution
│       ├── handwritten_landing_solution.html
│       └── styles.css
│
└── CLAUDE.md                        # This file
```

## Technology Stack

- **HTML5** - Semantic markup with proper structure
- **CSS3** - Styling, layouts, and custom fonts
- **No build system** - Static files served directly
- **Git** - Version control

### Key CSS Techniques Used

- Float-based grid layouts (pre-flexbox/grid era patterns)
- Custom web fonts via `@font-face`
- Percentage-based responsive widths
- CSS transforms for rotated table headers

## Development Workflow

### Running the Project

No build step required. Open HTML files directly in a browser:
```bash
# From repository root
open part_5/syllabus.html
open part_6/syllabus.html
open part_7/handwritten_landing.html
```

### Making Changes

1. Edit HTML files for structure changes
2. Edit corresponding `styles.css` for styling changes
3. Test in browser by refreshing the page
4. Commit changes with descriptive messages

### Debugging CSS

The codebase uses a debug pattern - add this to see element boundaries:
```css
* { border: thin red solid; }
```

## Code Conventions

### HTML Patterns

- Use semantic elements: `<header>`, `<section>`, `<footer>`, `<nav>`
- Descriptive class names for layout: `.one-third`, `.two-third`, `.one-fourth`
- IDs for unique styling needs: `#small_italic`, `#rotate`
- Keep structure clean with proper indentation

### CSS Patterns

**Grid Layout Classes:**
```css
.one-third { float: left; width: 33%; }
.two-third { float: left; width: 66%; }
.one-fourth { float: left; width: 25%; }
```

**Clearfix for Floats:**
```css
.clearfix { clear: both; }
.row { clear: both; }
```

**Font Declaration Pattern:**
```css
@font-face {
  font-family: 'Computer Modern Serif';
  src: url('fonts/cmunrm.eot');
  src: url('fonts/cmunrm.eot?#iefix') format('embedded-opentype'),
       url('fonts/cmunrm.woff') format('woff'),
       url('fonts/cmunrm.ttf') format('truetype'),
       url('fonts/cmunrm.svg#cmunrm') format('svg');
}
```

### Git Commit Messages

Follow the existing pattern of concise, action-oriented messages:
- `fixed button size`
- `added buttons, fixed width of menu items`
- `testimonial section spaced`
- `screenshot one positioned`

## File Purposes

| File | Purpose |
|------|---------|
| `part_5/syllabus.html` | Demonstrates proper semantic HTML structure |
| `part_6/syllabus.html` | Shows advanced CSS styling with custom fonts |
| `part_6/styles.css` | Contains @font-face declarations and table styling |
| `part_7/handwritten_landing.html` | Main landing page exercise (work in progress) |
| `part_7/styles.css` | Landing page layout and component styles |
| `part_7/handwritten_solution/` | Reference solution for comparison |

## Common Tasks

### Adding a New Section
1. Add semantic HTML structure in the appropriate HTML file
2. Create corresponding CSS classes in `styles.css`
3. Use existing grid classes (`.one-third`, etc.) for layout

### Styling Changes
1. Locate the element's class or ID in the HTML
2. Add/modify styles in the corresponding `styles.css`
3. Use browser dev tools to test before committing

### Comparing with Solution
The `part_7/handwritten_solution/` directory contains reference implementations. Compare your work against these files for guidance.

## Important Notes

- This is an educational project - maintain simplicity over optimization
- Float-based layouts are intentional (teaching fundamentals before modern CSS)
- The `fonts/` directory contains multiple formats for cross-browser compatibility
- Screenshots (`.png` files) serve as visual references - do not modify them

## Educational Context

The project progression teaches:
1. **Part 5**: Semantic HTML structure fundamentals
2. **Part 6**: CSS styling with custom typography
3. **Part 7**: Building complete page layouts

Each part builds on previous concepts, demonstrating iterative web development.
