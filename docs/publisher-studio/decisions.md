# Publisher Studio Decisions

This file records product, UX and technical decisions for Publisher Studio so future edits build on prior choices.

## First Development Milestone / 2026-09-19

### Preserve Existing Integrations

Source inspection confirmed static HTML and Cloudflare Pages Functions, with the
event API using Google Apps Script / Sheets and Resend. Keep those files unchanged.
Add isolated native JavaScript modules and CSS; do not introduce a second framework.

### Explicit Demo Boundary

Use fixtures and versioned browser-tab storage for the prototype. Display a persistent
preview label, label sample dates and trainer answers, and never call production APIs.
Do not collect persistent email addresses or imply that a booking or login occurred.

### Membership Consent

Provide a visible, unchecked Studio-profile opt-in in the registration preview.
Declining it still allows read-only-style demo exploration. Live participation will
require verified identity; demo participation is not an authentication implementation.

### Default-Off Release Gate

Add a scoped Cloudflare middleware switch, disabled unless explicitly enabled in a
preview environment. No navigation, sitemap, hosting settings or production branch
changes. Noindex is indexing guidance, not a privacy boundary.

### Durable Identity Boundary

Use immutable IDs for people and content, with verified email as a private attribute.
Account linking needs proof from both identities. Never merge accounts solely because
unverified email strings match. Avatar seeds must not expose email addresses.

### Repeatable Review

Add separate Studio model tests and responsive workflow QA with screenshot artifacts.
Keep scope, integration findings and remaining work in `development.md`. Continue
iterating on the same feature branch without rewriting its shared history.

## 2026-09-19

### Build Location

Decision: Publisher Studio should be built inside the existing Wistudi global website repository, not a separate repository.

Reason:

- The global website already contains relevant routing, forms, APIs, environment variables, styling, deployment and integrations.
- A separate repo would duplicate setup work and increase merge risk later.
- Publisher Studio is intended to become part of the Wistudi website and later connect to the Wistudi platform.

### Branch Strategy

Decision: Use a long-running feature branch named:

```text
feature/publisher-studio-mvp
```

Reason:

- The feature will require many iterative edits before launch.
- Main should remain stable.
- A draft PR can track changes, screenshots, review comments and unresolved questions.

### Trainer Naming

Decision: Do not hard-code "Ask Nadia" into the product.

Use:

- Ask the Trainer
- Studio Trainer
- Trainer Answer
- Trainer Pick

Reason:

- Nadia may host the first workshops, but future sessions may use another Wistudi trainer.
- The product should support multiple trainers without renaming core UI.

### Identity Model

Decision: Use lightweight Studio identity before full Wistudi account connection.

Reason:

- Full account creation creates too much friction for early workshop participation.
- Anonymous posting creates moderation and migration problems.
- Email-based Studio identity can later connect to a Wistudi account.

### Avatar Model

Decision: Use generated initials or abstract avatars, not AI-generated faces.

Reason:

- Wistudi editorial standards discourage invented people and fake visual identity.
- Abstract generated avatars are lower-risk, consistent and easier to regenerate.

### Discussion Model

Decision: Publisher Studio discussion should be contextual, not a generic public feed.

Reason:

- The Studio is about learning, building, adapting and publishing.
- Threads should belong to workshops, templates, worksheets, tools, resources, challenges or submissions.
- This structure can later become part of the Wistudi platform knowledge layer.

### Mobile Experience

Decision: The Studio participation area should feel like a focused app or chat workspace on mobile.

Reason:

- Participants should not feel like they are interacting with a landing page.
- Mobile should prioritize current context, discussion, questions, resources and submission actions.
