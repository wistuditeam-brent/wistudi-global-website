# Publisher Studio Interaction, Roles and Sharing Model

Status: prototype interaction contract; live authentication and shared storage are not connected  
Updated: 2026-09-20

## Product shape

Home, Discover events, My events, public event overviews, event rooms and the Event
Builder all live inside one Publisher Studio application shell. The desktop left
panel stays present as people move between these areas. It always contains the
global destinations and **Build an event**; when an event is selected, its own
sections appear below them. This is the navigation hierarchy shown in the corrected
reference screens.

On phones, the global destinations and Create action remain fixed at the bottom;
the selected event's sections remain reachable in a compact horizontal row under
the event bar. This keeps navigation visible without forcing a desktop-width panel
into the content area. Event discovery, details, discussion and creation should not
send people to a separate Studio microsite. Public sharing intentionally opens the
same event overview URL from outside the Studio.

Event room sections are not unmoderated chat channels. Each section is scoped to a
specific event and its learning objects. A participant's My events view should list
only events associated with their booking or valid event membership; a future server
must enforce this. Topic filters (Speaking, Worksheets, Video, etc.) can be added as
views over contextual conversations without creating a second, unscoped chat system.

## Participant path

Keep the visible path short and consistent:

1. **Choose an event** from the catalogue.
2. **Register** on that event's page; Studio membership remains a separate,
   optional choice.
3. **Enter the event room** after the applicable identity and access checks.
4. **Learn and build** with the event resources and challenge.
5. **Share in the room** for feedback; any external/public sharing is a separate,
   explicit action.
6. **Publish in Wistudi** only when the creator is ready and the account is linked.

The progress indicator may show Discover → Learn → Build → Share → Publish, but it
must not block navigation or imply that a participant has to publish publicly.

## Inline conversation

Use one chat timeline per event room. A message has a stable ID, author ID, room ID,
context ID, timestamp, body, zero or more attachments, mention IDs, related-context
IDs, moderation state and reaction records. A reply is a message with a
`reply_to_message_id`; it remains inside its parent discussion. Show the first two
replies by default and expose the rest through an inline “Read more replies” action.
The composer and reply box stay in the page; discussion does not open in a dialog.

The main composer supports four contribution intents: idea, help request, offer to
help, or completed work. These are useful filters and moderation context, not four
separate posting systems. The composer also supports:

- Text and emoji. The current prototype uses `emoji-picker-element` 1.29.1 as an
  optional, pinned web-component import, with a small local quick-emoji fallback.
- Drag/drop or browse for image, video, PDF, Office and audio files. Preview files
  locally before sending. The prototype does not upload or share them.
- Allow-listed YouTube/Vimeo embeds and ordinary safe HTTPS link cards.
- Wistudi Flow cards with a safe domain label and generic preview fallback.
- `@trainer` selection based on the trainers assigned to this event. A real mention
  stores trainer IDs and creates a notification; a typed display name alone does
  not notify anyone.
- A one-heart-per-member reaction. Keep the count secondary to the conversation.
- An inline, optional contextual suggestion while typing. It can point to a related
  event/resource, existing discussion, question or submitted creation; the writer
  must accept it before a relation is saved. In the prototype, this is transparent
  title/body word matching and opens the specific item when available.

Context matching should begin with stable topic/subject/level tags and text overlap,
not an opaque AI decision. For a result in another room, say which room it belongs
to, link to that room and let the recipient's normal membership check decide access.
Do not copy private message text across rooms or imply access by attaching a link.

## Link previews and the test Flow

The supplied test URL is:

`https://wistudi.tgndigital.vn/share/flow/4tcj7WscphXpR-mthJ8ThA`

Direct page inspection on 2026-09-20 returned generic page metadata: title `Wistudi`,
the platform-wide Wistudi description and `https://wistudi.tgndigital.vn/images/og-share.jpg`.
It did not expose this Flow's individual title or description in the page's Open
Graph tags. The prototype labels the link as a Wistudi Flow and shows that general
image/metadata limitation; it must not invent a Flow title.

To render the actual Flow's title, description, preview image, creator and access
state, Wistudi must provide per-Flow metadata in server-rendered HTML or an approved
metadata endpoint. The Studio should resolve only approved Wistudi URLs/content IDs
on the server, cache the result, allowlist the host, reject unsafe redirects and
render escaped metadata. This avoids browser CORS limitations and arbitrary-URL
server-side request forgery. YouTube/Vimeo embeds are limited to known hosts and
validated IDs. Social sites that block unfurling fall back to a host/title card.

## Sharing and privacy

Keep four different sharing actions clear:

| Share target | Default behavior | Access boundary |
| --- | --- | --- |
| Event | Share the canonical public event page via native share, copy, email or social channel | Public details only; recipient registers independently |
| Room | Share an invitation to the event page/room entry | A URL never grants membership or meeting access |
| Message or activity inside the community | Share its room context to another member or copy an internal link | Recipient must have room access |
| Participant creation outside Wistudi | Creator explicitly requests a public preview; a Studio Admin or designated showcase reviewer approves before a public permalink/OG page exists | Never expose an unapproved submission or private room content |

The current message Share action uses the public event page as an invitation. It
does not export the private message body. A future public-creation page needs the
creator's consent, appropriate content rights, approval state, revocation and
public metadata before it can share that work externally.

Do not expose a Zoom join/host link, registration token, email, private avatar seed,
unapproved work or room-only file in a share card, social preview, notification or
public API. Signed media URLs are credentials and must expire. Preview images and
uploads must use approved storage and permission checks.

## Room lifecycle

Model room access separately from event schedule:

- **Scheduled stage:** upcoming, live or ended is derived from the event's UTC start,
  end/duration and display timezone.
- **Room access state:** open or closed is explicitly controlled by authorized
  event staff. The event ending does not close the room.
- **Open:** eligible members can read and contribute.
- **Closed:** eligible members can read history; members cannot create messages,
  replies or submissions. The page explains who to contact.
- **Reopened:** an authorized owner/trainer/admin explicitly resumes contribution;
  the transition is audited and may notify watchers.
- **Archived:** optional later administrative state for retention and discovery;
  it is separate from event end and from a closed room.

The Event Lead, Studio Admin or Platform Super Admin may close/reopen a room within
their scope. Closing never deletes content. Event Moderators can hide/restore
specific contributions in their assigned area but cannot close the whole room by
default. The full assignment and capability rules are in
[`roles-and-permissions.md`](roles-and-permissions.md).

## Roles and delegated invitations

Authorization is based on an active assignment and capability for a specific scope,
not a single global role flag. Use the role catalogue, permission boundaries and
invitation lifecycle in [`roles-and-permissions.md`](roles-and-permissions.md) as
the normative design. In brief: Studio Admins appoint Event Leads; Event Leads can
invite event-scoped Moderators; Platform Super Admins appoint Studio Admins. The
current prototype's displayed roles and notifications are sample data only.

## Notifications

The in-product notification center is scoped to the current user's assignments and
subscriptions. Trainers can receive new registration, question, mention, challenge
submission, moderation report and room-state notices. Moderators receive only items
inside their moderation scope. Participants can follow a question/thread/resource
and choose mention/reply notifications. Do not send an email for every message;
use immediate notices for direct mentions/security/role changes and configurable
digest or per-event preferences for routine activity. Notification items link to the
context, not just to an unfiltered global feed. In email/push previews, avoid
including private message text by default.

## Event media and builder controls

The builder supports drag/drop and browse for event banner, event-card image,
optional mobile card crop, promotion video, and zero or more event resources.
Each resource is independently typed and may include a description, steps, link or
file, availability stage and public-preview choice. No Event resources section is
rendered when the event has none.

The initial image layout contract remains: wide 16:9 event-page banner, horizontal
event card, narrow portrait 2:3 mobile card crop. Short YouTube/Vimeo promotion
videos can embed from a validated host. Uploaded event and participant media require
direct-to-managed-storage upload, short-lived authorization, type/size validation,
malware scanning, asset ownership, removal and retention rules. Browser object URLs
are preview-only and must never be presented as uploaded/shared files.

## Prototype boundary and build sequence

Implemented as local interaction previews: inline event chat, first-two-reply
collapse/expand, emoji library/fallback, local attachment selection and preview,
safe link/video cards, hearts, context suggestions, trainer mention affordance,
room list/status, theme toggle and a trainer-notification sample. Event art/resource
builder inputs support drag/drop previews.

Still requires backend/services: shared accounts, registration handoff, database,
room access enforcement, persistent uploads, fetched per-Flow metadata, true
moderation, invitations and RBAC, real notifications, live event builder, Zoom
connection and public content permalink approval. The prototype uses session-local
records; changing browser/device does not synchronize its data.
