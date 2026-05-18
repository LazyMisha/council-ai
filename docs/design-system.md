# Design System

CouncilAI should feel calm, minimal, and decision-focused. Use Claude/ChatGPT-style simplicity as layout inspiration, with an Anthropic-inspired neutral palette and typography. CouncilAI remains its own product: do not use Anthropic logos, names, or affiliation claims.

## Principles

- Chat room first.
- Minimal text.
- Lots of empty space.
- Few components.
- Anthropic-inspired warm neutral surfaces.
- Clear AI instance labels.
- Synthesis should feel useful, not loud.

## Layout

- Left sidebar: CouncilAI, `+ New chat room`, chat rooms.
- Main area: messages and input.
- AI instances area: compact top bar or small right panel.
- User messages align right.
- AI instance messages align left and show role name.
- Input stays near the bottom with placeholder `Start a topic or reply...`.

Avoid dashboards, roadmap sections, long landing pages, large marketing blocks, and excessive cards.

## Color Tokens

- `background`: `#faf9f5`, warm light base.
- `surface`: near-white for panels and message bubbles.
- `surface-muted`: `#e8e6dc`, subtle warm gray.
- `text-primary`: `#141413`, warm near-black.
- `text-secondary`: muted warm gray for supporting text.
- `text-tertiary`: lower-emphasis warm gray.
- `border-subtle`: `#e8e6dc`, light warm gray.
- `border-strong`: `#b0aea5`, medium warm gray.
- `accent`: `#d97757`, warm orange for primary actions.
- `accent-muted`: pale orange tint for summaries or highlights.
- `info`: `#6a9bcc`, restrained blue for secondary accents.
- `success`: `#788c5d`, restrained green for positive states.

Avoid saturated gradients, neon colors, heavy purple-blue palettes, and decorative blobs.

## Typography

- Use Poppins for compact headings, controls, and UI chrome.
- Use Lora for body and chat text.
- Keep body text short.
- Avoid all-caps labels except tiny metadata.
- Do not use negative letter spacing.
- Do not make chat messages feel like documents.

## Spacing

- Use simple spacing steps: `4`, `8`, `12`, `16`, `24`, `32`.
- Keep the sidebar narrow.
- Keep the message column readable.
- Leave quiet space around the empty/new-chat-room prompt.

## Radius, Borders, Shadows

- Default radius: `6px` or `8px`.
- Prefer borders over shadows.
- Use soft shadows only if a popover/modal needs depth.
- Avoid glow, glassmorphism, and heavy card stacks.

## Components

- Primary button: `+ New chat room` or `Send`.
- Secondary button: `+ Add AI`.
- Message bubbles should be simple and readable.
- Role chips should be compact.
- Final synthesis should be a calm block near the conversation, not a large report.

## Accessibility

- Maintain WCAG AA contrast.
- Do not rely on color alone.
- Ensure keyboard focus states.
- Use semantic HTML.
- Keep button labels specific.
- Respect reduced motion.

## Good Decisions

- One screen with sidebar, chat room, AI instances, and input.
- Three role chips instead of a role management dashboard.
- Short message examples.
- Empty state: `Create a chat room to start a discussion`

## Bad Decisions

- A large marketing landing page.
- A dashboard as the primary MVP screen.
- Roadmap or feature sections inside the app.
- Long role explanations on the main screen.
- Treating the product as a generic single-assistant chatbot.

## AI Instance Accent Colors

Each AI instance has a subtle accent color to help identify its role without dominating the interface.

### Principles

- Colors are calm, muted, and warm.
- They serve as quiet identifiers, not decoration.
- Message bubbles stay neutral; only chips, dots, and role labels carry the accent.
- Do not rely on color alone—role names are always visible.

### Predefined Role Accents

- Software Architect: muted blue-gray
- Business Analyst: sage green
- Skeptic: warm charcoal
- Optimist: soft ochre
- Product Expert: clay / terracotta
- Critic: soft rose

### Custom AI Instances

Custom roles receive a deterministic color from a rotating muted palette based on their name, so the same role always gets the same color across sessions.

### Usage

- Role chips: subtle border and background tint
- Message role label: small colored dot + tinted text
- Role picker: small colored dot next to each predefined role
