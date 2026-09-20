import { events as studioEvents, calendarHosts, calendarEventTypes } from './data.mjs';

const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const hostFor = id => calendarHosts.find(host => host.id === id);
const roleNames = { admin: 'Studio admin', manager: 'Scheduler', host: 'Trainer', participant: 'Participant', guardian: 'Guardian' };
const roleDescriptions = {
  admin: 'Organisation schedule, event operations and availability.',
  manager: 'Events and people in your assigned scope.',
  host: 'Your events, availability and assigned groups.',
  participant: 'Your own schedule, event details and resources.',
  guardian: 'Schedules for the dependants you are authorised to manage.',
};
const zoneOptions = current => [...new Set([current, 'Asia/Ho_Chi_Minh', 'UTC', 'America/New_York', 'Europe/London'])];

function partsInZone(date, timezone) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(date).map(part => [part.type, part.value]));
}

function dateKeyInZone(value, timezone) {
  const p = partsInZone(new Date(value), timezone);
  return `${p.year}-${p.month}-${p.day}`;
}

function formatDay(key, options = {}) {
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, options).format(new Date(year, month - 1, day, 12));
}

function formatTime(value, timezone) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(new Date(value));
}

function formatEventRange(item, timezone) {
  const start = new Date(item.startsAt);
  const end = new Date(start.getTime() + item.duration * 60000);
  const date = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: timezone }).format(start);
  return `${date} · ${formatTime(start, timezone)}–${formatTime(end, timezone)}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function keyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

function mondayStart(date) {
  return addDays(date, -((date.getDay() + 6) % 7));
}

function monthHeading(key) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(dateFromKey(key));
}

function currentDateTimeInput(timezone) {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const p = partsInZone(date, timezone);
  return `${p.year}-${p.month}-${p.day}T10:00`;
}

function eventDateTimeInput(item) {
  const p = partsInZone(new Date(item.startsAt), item.timezone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

function localInputToIso(value, timezone) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error('Choose a valid date and time.');
  const [, y, mo, d, h, mi] = match.map(Number);
  const target = Date.UTC(y, mo - 1, d, h, mi);
  let guess = target;
  for (let index = 0; index < 4; index += 1) {
    const p = partsInZone(new Date(guess), timezone);
    const displayed = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
    guess += target - displayed;
  }
  const resolved = new Date(guess);
  const local = partsInZone(resolved, timezone);
  if (`${local.year}-${local.month}-${local.day}T${local.hour}:${local.minute}` !== value) {
    throw new Error('This local time is skipped by a daylight-saving change. Choose another time.');
  }
  return resolved.toISOString();
}

function addWeeksInZone(value, timezone, weeks) {
  const local = partsInZone(new Date(value), timezone);
  const date = new Date(Date.UTC(Number(local.year), Number(local.month) - 1, Number(local.day) + weeks * 7));
  const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  return localInputToIso(`${key}T${local.hour}:${local.minute}`, timezone);
}

function weekdayNumber(value, timezone) {
  const label = partsInZone(new Date(value), timezone).weekday;
  return ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 })[label];
}

function eventVisible(event, calendar) {
  if (calendar.role === 'host' && event.hostId !== 'host-nadia') return false;
  if (['participant', 'guardian'].includes(calendar.role) && !event.participants.some(person => person.id === 'participant-demo')) return false;
  if (calendar.filters.hostId !== 'all' && event.hostId !== calendar.filters.hostId) return false;
  if (calendar.filters.type !== 'all' && event.type !== calendar.filters.type) return false;
  if (calendar.filters.status !== 'all' && event.status !== calendar.filters.status) return false;
  const query = calendar.filters.search.trim().toLowerCase();
  if (query && ![event.title, event.type, event.hostName, event.group, ...event.participants.map(person => person.name)].join(' ').toLowerCase().includes(query)) return false;
  return true;
}

function visibleEvents(calendar) {
  return calendar.events.filter(item => eventVisible(item, calendar)).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

function eventsOnDay(calendar, key) {
  return visibleEvents(calendar).filter(item => dateKeyInZone(item.startsAt, calendar.timezone) === key);
}

function statusName(status) {
  return ({ confirmed: 'Confirmed', pending: 'Needs confirmation', held: 'Held', cancelled: 'Cancelled', completed: 'Completed' })[status] || status;
}

function statusClass(status) {
  return `status-${status.replace(/[^a-z]+/g, '-')}`;
}

function eventButton(item, calendar, compact = false) {
  const linked = item.source === 'publisher-studio';
  return `<button type="button" class="calendar-event-chip ${statusClass(item.status)} ${compact ? 'is-compact' : ''} ${linked ? 'is-studio-event' : ''}" data-action="calendar-select-event" data-id="${e(item.id)}" aria-label="${e(item.title)}, ${e(formatEventRange(item, calendar.timezone))}, ${e(statusName(item.status))}"><span class="calendar-event-time">${e(formatTime(item.startsAt, calendar.timezone))}</span><span class="calendar-event-title">${e(item.title)}</span><span class="calendar-event-status">${e(statusName(item.status))}</span></button>`;
}

function monthGrid(calendar) {
  const [year, month] = calendar.selectedDate.split('-').map(Number);
  const first = new Date(year, month - 1, 1, 12);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return `<div class="calendar-grid-wrap"><div class="calendar-weekdays">${weekdays.map(day => `<span>${day}</span>`).join('')}</div><div class="calendar-month-grid">${days.map(date => {
    const key = keyFromDate(date);
    const rows = eventsOnDay(calendar, key);
    const inMonth = date.getMonth() === month - 1;
    const selected = calendar.selectedDate === key;
    return `<section class="calendar-day ${inMonth ? '' : 'is-outside'} ${selected ? 'is-selected' : ''} ${key === dateKeyInZone(new Date(), calendar.timezone) ? 'is-today' : ''}" aria-label="${e(formatDay(key, { weekday: 'long', month: 'long', day: 'numeric' }))}"><button type="button" class="calendar-day-number" data-action="calendar-select-date" data-date="${key}" aria-pressed="${selected}">${date.getDate()}</button><div class="calendar-day-events">${rows.slice(0, 3).map(row => eventButton(row, calendar, true)).join('')}${rows.length > 3 ? `<button type="button" class="calendar-more-events" data-action="calendar-select-date" data-date="${key}">+${rows.length - 3} more</button>` : ''}</div>${rows.length ? `<span class="calendar-day-count">${rows.length} ${rows.length === 1 ? 'event' : 'events'}</span>` : ''}</section>`;
  }).join('')}</div></div>`;
}

function weekGrid(calendar) {
  const start = mondayStart(dateFromKey(calendar.selectedDate));
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return `<div class="calendar-week-grid-wrap"><div class="calendar-week-grid">${days.map(date => {
    const key = keyFromDate(date);
    const rows = eventsOnDay(calendar, key);
    const selected = calendar.selectedDate === key;
    return `<section class="calendar-week-day ${selected ? 'is-selected' : ''}"><button class="calendar-week-heading" type="button" data-action="calendar-select-date" data-date="${key}" aria-pressed="${selected}"><span>${e(formatDay(key, { weekday: 'short' }))}</span><strong>${date.getDate()}</strong></button><div class="calendar-week-events">${rows.length ? rows.map(row => eventButton(row, calendar)).join('') : '<span class="calendar-no-events">No events</span>'}</div></section>`;
  }).join('')}</div></div>`;
}

function dayAgenda(calendar) {
  const rows = eventsOnDay(calendar, calendar.selectedDate);
  const allDay = rows.filter(item => item.type === 'Hold');
  return `<section class="calendar-agenda"><div class="calendar-agenda-heading"><div><span class="eyebrow">Selected day</span><h2>${e(formatDay(calendar.selectedDate, { weekday: 'long', month: 'long', day: 'numeric' }))}</h2></div><span>${rows.length} ${rows.length === 1 ? 'event' : 'events'}</span></div>${allDay.map(item => eventButton(item, calendar)).join('')}${rows.filter(item => !allDay.includes(item)).length ? `<div class="calendar-agenda-list">${rows.filter(item => !allDay.includes(item)).map(item => `<div class="calendar-agenda-row"><time>${e(formatTime(item.startsAt, calendar.timezone))}</time><div class="calendar-agenda-track"><span class="calendar-agenda-dot ${statusClass(item.status)}"></span></div><div class="calendar-agenda-event">${eventButton(item, calendar)}<span class="calendar-agenda-meta">${e(item.hostName)} · ${e(item.group || 'No group')} · ${e(statusName(item.status))}</span></div></div>`).join('')}</div>` : ''}${rows.length ? '' : '<div class="calendar-empty-day"><strong>No events on this day</strong><span>Pick another date or create a new event.</span></div>'}</section>`;
}

function dateToolbar(calendar) {
  const label = calendar.view === 'month'
    ? monthHeading(calendar.selectedDate)
    : calendar.view === 'week'
      ? (() => { const start = mondayStart(dateFromKey(calendar.selectedDate)); const end = addDays(start, 6); return `${formatDay(keyFromDate(start), { month: 'short', day: 'numeric' })} – ${formatDay(keyFromDate(end), { month: 'short', day: 'numeric', year: 'numeric' })}`; })()
      : formatDay(calendar.selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return `<div class="calendar-date-controls"><div class="calendar-date-stepper"><button type="button" class="icon-button" data-action="calendar-shift" data-direction="-1" aria-label="Previous ${calendar.view}">‹</button><button type="button" class="calendar-date-label" data-action="calendar-today">${e(label)}</button><button type="button" class="icon-button" data-action="calendar-shift" data-direction="1" aria-label="Next ${calendar.view}">›</button></div><button class="button secondary" type="button" data-action="calendar-today">Today</button></div>`;
}

function calendarToolbar(calendar, canCreate) {
  const views = [['month', 'Month'], ['week', 'Week'], ['day', 'Day']];
  const count = visibleEvents(calendar).length;
  return `<div class="calendar-toolbar">${dateToolbar(calendar)}<div class="calendar-toolbar-actions"><div class="calendar-view-switch" aria-label="Calendar view">${views.map(([value, label]) => `<button type="button" data-action="calendar-view" data-value="${value}" aria-pressed="${calendar.view === value}">${label}</button>`).join('')}</div>${canCreate ? `<button class="button primary" type="button" data-action="calendar-open-event-form">＋ New event</button>` : ''}</div></div><div class="calendar-filter-row"><label>Search schedule<input type="search" data-calendar-setting="filter-search" value="${e(calendar.filters.search)}" placeholder="Event, trainer or group"></label><label>Trainer<select data-calendar-setting="filter-host"><option value="all" ${calendar.filters.hostId === 'all' ? 'selected' : ''}>All trainers</option>${calendarHosts.map(host => `<option value="${e(host.id)}" ${calendar.filters.hostId === host.id ? 'selected' : ''}>${e(host.name)}</option>`).join('')}</select></label><label>Event type<select data-calendar-setting="filter-type"><option value="all" ${calendar.filters.type === 'all' ? 'selected' : ''}>All types</option>${calendarEventTypes.map(type => `<option value="${e(type)}" ${calendar.filters.type === type ? 'selected' : ''}>${e(type)}</option>`).join('')}</select></label><label>Status<select data-calendar-setting="filter-status"><option value="all" ${calendar.filters.status === 'all' ? 'selected' : ''}>All statuses</option>${[['confirmed','Confirmed'],['pending','Needs confirmation'],['held','Held'],['cancelled','Cancelled'],['completed','Completed']].map(([value,label]) => `<option value="${value}" ${calendar.filters.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><span class="calendar-result-count">${count} scheduled ${count === 1 ? 'item' : 'items'}</span></div>`;
}

function statusBadge(status) {
  return `<span class="calendar-status-badge ${statusClass(status)}"><span aria-hidden="true"></span>${e(statusName(status))}</span>`;
}

function roleSelect(calendar) {
  return `<div class="calendar-header-controls"><label class="calendar-role-control"><span>Preview as</span><select data-calendar-setting="role" aria-label="Preview calendar as">${Object.entries(roleNames).map(([value, label]) => `<option value="${value}" ${calendar.role === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="calendar-role-control"><span>Times shown in</span><select data-calendar-setting="timezone" aria-label="Calendar display timezone">${zoneOptions(calendar.timezone).map(zone => `<option value="${e(zone)}" ${zone === calendar.timezone ? 'selected' : ''}>${e(zone)}</option>`).join('')}</select></label></div>`;
}

function sectionTabs(calendar) {
  const sections = ['admin', 'manager', 'host'].includes(calendar.role)
    ? [['calendar', 'Calendar'], ['availability', 'Availability'], ['operations', 'Operations']]
    : [['calendar', calendar.role === 'guardian' ? 'Family calendar' : 'My calendar']];
  const attentionCount = visibleEvents(calendar).filter(item => ['pending', 'held'].includes(item.status)).length;
  return `<nav class="calendar-section-tabs" aria-label="Calendar app sections">${sections.map(([value, label]) => `<button type="button" data-action="calendar-section" data-value="${value}" aria-current="${calendar.section === value ? 'page' : 'false'}">${label}${value === 'operations' && attentionCount ? `<span class="calendar-tab-count">${attentionCount}</span>` : ''}</button>`).join('')}</nav>`;
}

function availabilityContent(calendar) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekdayIds = [1, 2, 3, 4, 5, 6, 0];
  const hostIds = calendar.role === 'host' ? ['host-nadia'] : [...new Set(calendar.availabilityRules.map(rule => rule.hostId))];
  const selectedHost = calendar.filters.hostId === 'all' ? '' : calendar.filters.hostId;
  const rules = calendar.availabilityRules.filter(rule => (!selectedHost || rule.hostId === selectedHost) && hostIds.includes(rule.hostId));
  const exceptions = calendar.availabilityExceptions.filter(item => (!selectedHost || item.hostId === selectedHost) && hostIds.includes(item.hostId));
  return `<div class="availability-view"><div class="calendar-information"><strong>Availability is calculated from schedules, leave, bookings and connected calendars.</strong><span>External calendar entries appear as “Busy” by default, without exposing their private titles.</span></div><div class="availability-week-list">${days.map((day, index) => {
    const rows = rules.filter(rule => rule.weekday === weekdayIds[index]);
    return `<section class="availability-day"><h3>${day}</h3><div>${rows.length ? rows.map(rule => `<article class="availability-rule"><span class="availability-indicator" aria-hidden="true"></span><strong>${e(rule.start)}–${e(rule.end)}</strong><span>${e(hostFor(rule.hostId)?.name || 'Trainer')} · ${e(rule.label)}</span></article>`).join('') : '<p class="muted">No regular hours</p>'}</div></section>`;
  }).join('')}</div><section class="availability-exceptions"><div class="section-heading"><div><h2>Exceptions and busy time</h2><p class="muted">Date-specific leave, blocks and connected-calendar availability.</p></div>${['admin','manager','host'].includes(calendar.role) ? '<button class="button secondary" type="button" data-action="calendar-open-availability-form">＋ Add time</button>' : ''}</div>${exceptions.length ? exceptions.map(item => `<div class="availability-exception"><span>${e(formatDay(item.date, { weekday: 'short', month: 'short', day: 'numeric' }))}</span><strong>${e(item.start)}–${e(item.end)}</strong><span>${e(item.label)}</span><span class="availability-state">${item.status === 'external_busy' ? 'External busy' : item.status === 'blocked' ? 'Unavailable' : 'Available'}</span></div>`).join('') : '<p class="muted">No exceptions have been added.</p>'}</section></div>`;
}

function operationsContent(calendar) {
  const needsAttention = visibleEvents(calendar).filter(item => ['pending', 'held'].includes(item.status));
  const unlinked = visibleEvents(calendar).filter(item => item.type === 'Workshop' && item.location.mode === 'online' && !item.location.url && !['cancelled', 'completed'].includes(item.status));
  const recentActivity = ['admin', 'manager'].includes(calendar.role) && calendar.audit.length
    ? `<section class="calendar-operation-section"><div class="section-heading"><div><h2>Recent activity</h2><p class="muted">Schedule changes recorded in this preview.</p></div></div><ol class="calendar-audit-list">${calendar.audit.slice(0, 8).map(entry => `<li><span>${e(entry.action)}</span><strong>${e(entry.target)}</strong><time datetime="${e(entry.at)}">${e(new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.at)))}</time></li>`).join('')}</ol></section>`
    : '';
  return `<div class="calendar-operations"><div class="calendar-metric-row"><article><span>Scheduled items</span><strong>${visibleEvents(calendar).filter(item => !['cancelled', 'completed'].includes(item.status)).length}</strong></article><article><span>Needs confirmation</span><strong>${needsAttention.length}</strong></article><article><span>Meeting links to add</span><strong>${unlinked.length}</strong></article></div><section class="calendar-operation-section"><div class="section-heading"><div><h2>Needs attention</h2><p class="muted">Resolve these before participants need to join.</p></div></div>${needsAttention.length ? needsAttention.map(item => `<article class="operation-item"><div><span class="eyebrow">${e(item.type)} · ${e(formatEventRange(item, calendar.timezone))}</span><h3>${e(item.title)}</h3><p>${e(item.hostName)} · ${e(item.group || 'No group')}</p></div>${statusBadge(item.status)}<button class="button secondary" type="button" data-action="calendar-select-event" data-id="${e(item.id)}">Review</button></article>`).join('') : '<div class="calendar-empty-state"><strong>Nothing is waiting for confirmation.</strong><span>New holds and pending events will appear here.</span></div>'}</section><section class="calendar-operation-section"><div class="section-heading"><div><h2>Connected services</h2><p class="muted">The event stays in Wistudi as the canonical schedule record.</p></div><button type="button" class="button secondary" data-action="calendar-integration-info">Manage connections</button></div><div class="integration-status-grid">${[['Zoom','Meeting links','Not connected'],['Google Calendar','Calendar sync','Not connected'],['Microsoft Outlook','Free/busy sync','Not connected']].map(([name,detail,status]) => `<article><span class="integration-mark">${name === 'Zoom' ? 'Z' : name === 'Google Calendar' ? 'G' : 'O'}</span><div><strong>${name}</strong><span>${detail}</span></div><small>${status}</small></article>`).join('')}</div><p class="muted small">Connections are shown as setup states in this preview. No external accounts are accessed.</p></section>${recentActivity}</div>`;
}

function attendeeText(item, calendar) {
  if (['participant', 'guardian'].includes(calendar.role)) return 'Your registration is private to you.';
  return item.participants.length ? item.participants.map(person => person.name).join(', ') : 'No participants assigned';
}

function eventDetailsPanel(item, calendar) {
  const linked = item.studioEventId && studioEvents.find(event => event.id === item.studioEventId);
  const canManage = ['admin', 'manager'].includes(calendar.role) || (calendar.role === 'host' && item.hostId === 'host-nadia');
  const joinAction = item.location.url
    ? `<a class="button primary" href="${e(item.location.url)}" target="_blank" rel="noopener noreferrer">${item.location.mode === 'online' ? 'Join event' : 'Open location'}</a>`
    : `<span class="calendar-no-join">${item.location.mode === 'online' ? 'Meeting link not connected' : e(item.location.label)}</span>`;
  return `<div class="calendar-panel-heading"><div><span class="eyebrow">Event details</span><button class="icon-button" type="button" data-action="calendar-close-panel" aria-label="Close details">×</button></div><h2>${e(item.title)}</h2>${statusBadge(item.status)}</div><div class="calendar-detail-list"><div><span>When</span><strong>${e(formatEventRange(item, calendar.timezone))}</strong><small>Event timezone: ${e(item.timezone)} · shown in ${e(calendar.timezone)}</small></div><div><span>Trainer</span><strong>${e(item.hostName)}</strong></div><div><span>Group</span><strong>${e(item.group || 'No group assigned')}</strong></div><div><span>Attendees</span><strong>${e(attendeeText(item, calendar))}</strong></div><div><span>Location</span><strong>${e(item.location.label || 'To be confirmed')}</strong></div>${item.notes ? `<div><span>Event notes</span><p>${e(item.notes)}</p></div>` : ''}${item.resourceUrl ? `<div><span>Event resource</span><a href="${e(item.resourceUrl)}" target="_blank" rel="noopener noreferrer">Open attached resource</a></div>` : ''}</div><div class="calendar-detail-actions">${joinAction}${canManage ? `<button type="button" class="button secondary" data-action="calendar-edit-event" data-id="${e(item.id)}">Edit event</button>` : ''}${linked ? `<a class="button secondary" href="/publisher-studio/events/${e(linked.slug)}/">Open Studio event</a>` : ''}${canManage && item.status === 'pending' ? `<button type="button" class="button secondary" data-action="calendar-set-status" data-id="${e(item.id)}" data-value="confirmed">Confirm event</button>` : ''}${canManage && !['completed', 'cancelled'].includes(item.status) ? `<button type="button" class="text-button" data-action="calendar-set-status" data-id="${e(item.id)}" data-value="completed">Mark completed</button><button type="button" class="text-button is-danger" data-action="calendar-set-status" data-id="${e(item.id)}" data-value="cancelled">Cancel this occurrence</button>` : ''}</div>${item.source === 'publisher-studio' ? '<p class="calendar-data-note">This schedule item is linked to its Publisher Studio event. Event registration and discussion stay with that event.</p>' : ''}${item.seriesId ? `<p class="calendar-data-note">Occurrence ${Number(item.occurrence || 1)} of a weekly series. Editing or cancelling can apply to this occurrence, future occurrences or the full series.</p>` : ''}`;
}

function defaultPanel(calendar) {
  const upcoming = visibleEvents(calendar).filter(item => Date.parse(item.startsAt) >= Date.now() && !['cancelled', 'completed'].includes(item.status)).slice(0, 3);
  const attention = visibleEvents(calendar).filter(item => ['pending', 'held'].includes(item.status));
  return `<div class="calendar-panel-heading"><div><span class="eyebrow">Your calendar</span><h2>${e(formatDay(calendar.selectedDate, { weekday: 'long', month: 'short', day: 'numeric' }))}</h2></div></div><p class="calendar-role-description">${e(roleDescriptions[calendar.role])}</p><div class="calendar-next-up"><span class="eyebrow">Next up</span>${upcoming.length ? upcoming.map(item => `<button class="calendar-next-item" type="button" data-action="calendar-select-event" data-id="${e(item.id)}"><span>${e(formatEventRange(item, calendar.timezone))}</span><strong>${e(item.title)}</strong><small>${e(item.hostName)} · ${e(statusName(item.status))}</small></button>`).join('') : '<p class="muted">No upcoming events in this view.</p>'}</div><div class="calendar-panel-stat"><span>Needs attention</span><strong>${attention.length}</strong></div><div class="calendar-connection-note"><strong>Connected services</strong><span>Zoom and calendar sync are not connected in this preview.</span></div>`;
}

function eventCreatePanel(calendar) {
  const editing = calendar.events.find(item => item.id === calendar.editingEventId);
  const value = (key, fallback = '') => e(editing ? fallback || editing[key] || '' : fallback);
  const option = (key, candidate, fallback = '') => {
    const current = editing ? key.split('.').reduce((value, part) => value?.[part], editing) : fallback;
    return current === candidate ? 'selected' : '';
  };
  const hosts = calendarHosts.map(host => `<option value="${e(host.id)}" ${editing ? (editing.hostId === host.id ? 'selected' : '') : (calendar.role === 'host' && host.id === 'host-nadia' ? 'selected' : '')}>${e(host.name)}</option>`).join('');
  const canAssignHost = calendar.role !== 'host';
  const formTimezone = editing?.timezone || calendar.timezone;
  const timezones = zoneOptions(formTimezone).map(zone => `<option value="${e(zone)}" ${zone === formTimezone ? 'selected' : ''}>${e(zone)}</option>`).join('');
  const statuses = (editing ? [['confirmed','Confirmed'],['pending','Needs confirmation'],['held','Temporary hold'],['completed','Completed'],['cancelled','Cancelled']] : [['confirmed','Confirmed'],['pending','Needs confirmation'],['held','Temporary hold']])
    .map(([key, label]) => `<option value="${key}" ${option('status', key, 'confirmed')}>${label}</option>`).join('');
  const editScope = editing?.seriesId
    ? '<label>Apply changes to<select name="editScope"><option value="single">This occurrence only</option><option value="future">This and future occurrences</option><option value="series">The whole series</option></select></label>'
    : editing ? '<input type="hidden" name="editScope" value="single">' : '';
  const studioId = editing?.studioEventId || '';
  const startValue = editing ? eventDateTimeInput(editing) : currentDateTimeInput(calendar.timezone);
  return `<div class="calendar-panel-heading"><div><span class="eyebrow">${editing ? 'Edit event' : 'New event'}</span><button class="icon-button" type="button" data-action="calendar-close-panel" aria-label="Close event form">×</button></div><h2>${editing ? 'Update schedule details' : 'Schedule an event'}</h2><p>One event connects its people, time, place and resources.</p></div><form id="calendar-event-form" class="calendar-form"><label>Event title<input name="title" maxlength="120" required placeholder="What is this event?" value="${value('title')}" autofocus></label><div class="calendar-form-grid"><label>Event type<select name="type">${calendarEventTypes.map(type => `<option value="${e(type)}" ${option('type', type, 'Workshop')}>${e(type)}</option>`).join('')}</select></label><label>Status<select name="status">${statuses}</select></label></div><label>Trainer<select name="hostId" ${canAssignHost ? 'required' : 'disabled'}>${canAssignHost ? '<option value="">Choose a trainer</option>' : ''}${hosts}</select></label><label>Group or cohort<input name="group" maxlength="100" placeholder="Optional group name" value="${value('group')}"></label><label>Participants <span class="muted">(optional, comma-separated)</span><input name="participants" maxlength="500" placeholder="e.g. Mina Tran, Ari Le" value="${editing ? e(editing.participants.map(person => person.name).join(', ')) : ''}"></label><div class="calendar-form-grid"><label>Starts at<input name="startsAt" type="datetime-local" value="${e(startValue)}" required></label><label>Duration<select name="duration">${[30,45,60,75,90,120].map(minutes => `<option value="${minutes}" ${Number(editing?.duration || 60) === minutes ? 'selected' : ''}>${minutes === 120 ? '2 hours' : `${minutes} minutes`}</option>`).join('')}</select></label></div><label>Event timezone<select name="timezone">${timezones}</select></label><div class="calendar-form-grid"><label>Location<select name="locationMode"><option value="online" ${option('location.mode','online',editing?.location.mode || 'online')}>Online meeting</option><option value="physical" ${option('location.mode','physical',editing?.location.mode || 'online')}>In person</option><option value="hybrid" ${option('location.mode','hybrid',editing?.location.mode || 'online')}>Hybrid</option><option value="custom" ${option('location.mode','custom',editing?.location.mode || 'online')}>Custom link</option><option value="tbd" ${option('location.mode','tbd',editing?.location.mode || 'online')}>To be confirmed</option></select></label>${editing ? editScope : '<label>Repeat<select name="recurrence"><option value="once">One time</option><option value="weekly">Weekly for 4 occurrences</option></select></label>'}</div><label>Room or location name <span class="muted">(optional)</span><input name="locationLabel" maxlength="120" placeholder="Zoom, room, venue or branch" value="${editing ? e(editing.location.label) : ''}"></label><label>Meeting or location link <span class="muted">(optional)</span><input name="locationUrl" type="url" inputmode="url" placeholder="https://..." autocomplete="url" value="${editing ? e(editing.location.url) : ''}"></label><div class="calendar-form-grid"><label>Visibility<select name="visibility"><option value="private" ${option('visibility','private','private')}>Invitees only</option><option value="public" ${option('visibility','public','private')}>Public event</option><option value="internal" ${option('visibility','internal','private')}>Team only</option></select></label><label>Link a Studio event<select name="studioEventId"><option value="" ${studioId ? '' : 'selected'}>No linked Studio event</option>${studioEvents.map(item => `<option value="${e(item.id)}" ${studioId === item.id ? 'selected' : ''}>${e(item.title)}</option>`).join('')}</select></label></div><label>Resource link <span class="muted">(optional)</span><input name="resourceUrl" type="url" inputmode="url" placeholder="Flow, Drive file, video or event resource" value="${value('resourceUrl')}"></label><label>Notes <span class="muted">(optional)</span><textarea name="notes" rows="3" maxlength="1000" placeholder="Preparation, accessibility or delivery notes">${value('notes')}</textarea></label>${['admin', 'manager'].includes(calendar.role) ? '<label class="calendar-override"><input type="checkbox" name="overrideConflict"><span>Allow this event when a schedule conflict is found. The override is recorded in the activity history.</span></label>' : ''}<p class="calendar-form-note">Participants see the event time in their own timezone. Private events do not reveal attendee details to other participants.</p><div class="calendar-form-actions"><button type="button" class="button secondary" data-action="calendar-close-panel">Cancel</button><button type="submit" class="button primary">${editing ? 'Update event' : 'Save event'}</button></div></form>`;
}

function availabilityForm(calendar) {
  const hosts = calendarHosts.map(host => `<option value="${e(host.id)}" ${calendar.role === 'host' && host.id === 'host-nadia' ? 'selected' : ''}>${e(host.name)}</option>`).join('');
  return `<div class="calendar-panel-heading"><div><span class="eyebrow">Availability</span><button class="icon-button" type="button" data-action="calendar-close-panel" aria-label="Close availability form">×</button></div><h2>Add time</h2><p>Set regular hours or add a one-date exception.</p></div><form id="calendar-availability-form" class="calendar-form"><label>Trainer<select name="hostId" ${calendar.role === 'host' ? 'disabled' : 'required'}>${calendar.role === 'host' ? '' : '<option value="">Choose a trainer</option>'}${hosts}</select></label><label>Entry type<select name="kind"><option value="available">Available time</option><option value="blocked">Unavailable or leave</option></select></label><label>Apply to<select name="scope"><option value="weekly">Weekly schedule</option><option value="date">One date only</option></select></label><div class="calendar-form-grid"><label>Day of week<select name="weekday">${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day,index) => `<option value="${index}" ${index === 1 ? 'selected' : ''}>${day}</option>`).join('')}</select></label><label>Date<input name="date" type="date" value="${e(calendar.selectedDate)}"></label></div><div class="calendar-form-grid"><label>Starts<input name="start" type="time" value="09:00" required></label><label>Ends<input name="end" type="time" value="12:00" required></label></div><label>Label<input name="label" maxlength="80" placeholder="e.g. Teaching hours or annual leave"></label><p class="calendar-form-note">Availability times use the trainer’s timezone. External busy blocks stay private; weekly hours, bookings and time off are layered together.</p><div class="calendar-form-actions"><button type="button" class="button secondary" data-action="calendar-close-panel">Cancel</button><button type="submit" class="button primary">Save availability</button></div></form>`;
}

function sidePanel(calendar) {
  if (calendar.panel === 'event') return `<aside class="calendar-context-panel is-form-panel">${eventCreatePanel(calendar)}</aside>`;
  if (calendar.panel === 'availability') return `<aside class="calendar-context-panel is-form-panel">${availabilityForm(calendar)}</aside>`;
  const selected = calendar.events.find(item => item.id === calendar.selectedEventId && eventVisible(item, calendar));
  if (selected) return `<aside class="calendar-context-panel">${eventDetailsPanel(selected, calendar)}</aside>`;
  if (calendar.section === 'calendar') {
    const rows = eventsOnDay(calendar, calendar.selectedDate);
    return `<aside class="calendar-context-panel"><div class="calendar-panel-heading"><div><span class="eyebrow">Selected day</span><h2>${e(formatDay(calendar.selectedDate, { weekday: 'long', month: 'short', day: 'numeric' }))}</h2></div></div>${rows.length ? `<div class="calendar-selected-day-events">${rows.map(item => `<button class="calendar-selected-event" type="button" data-action="calendar-select-event" data-id="${e(item.id)}"><span>${e(formatTime(item.startsAt, calendar.timezone))} · ${e(item.type)}</span><strong>${e(item.title)}</strong><small>${e(item.hostName)} · ${e(statusName(item.status))}</small></button>`).join('')}</div>` : '<div class="calendar-empty-day"><strong>No events on this day</strong><span>Pick an event on the calendar or add one here.</span></div>'}${['admin', 'manager', 'host'].includes(calendar.role) ? '<button class="button primary calendar-panel-add" type="button" data-action="calendar-open-event-form">＋ New event</button>' : ''}<div class="calendar-connection-note"><strong>Connected services</strong><span>Zoom, Google Calendar and Outlook are not connected in this preview.</span></div></aside>`;
  }
  return `<aside class="calendar-context-panel">${defaultPanel(calendar)}</aside>`;
}

function calendarBody(calendar) {
  if (calendar.section === 'availability') return availabilityContent(calendar);
  if (calendar.section === 'operations') return operationsContent(calendar);
  if (calendar.view === 'week') return weekGrid(calendar);
  if (calendar.view === 'day') return dayAgenda(calendar);
  return monthGrid(calendar);
}

export function renderCalendarApp(calendar) {
  const canCreate = ['admin', 'manager', 'host'].includes(calendar.role);
  const mainControls = calendar.section === 'calendar' ? calendarToolbar(calendar, canCreate) : '';
  const contents = `<div class="calendar-app"><div class="calendar-app-heading"><div><span class="eyebrow">Studio app / Scheduling</span><h1>Calendar</h1><p>Schedule events, manage availability and follow up on operations in one place.</p></div>${roleSelect(calendar)}</div>${sectionTabs(calendar)}<div class="calendar-workbench"><main class="calendar-main-panel">${mainControls}${calendarBody(calendar)}</main>${sidePanel(calendar)}</div><p class="calendar-prototype-note">Preview records live in this browser tab. The role switch is a UI preview; permissions, shared storage, Zoom and calendar sync need server integrations.</p></div>`;
  return contents;
}

function overlaps(startA, durationA, startB, durationB) {
  const a0 = Date.parse(startA); const a1 = a0 + durationA * 60000;
  const b0 = Date.parse(startB); const b1 = b0 + durationB * 60000;
  return a0 < b1 && b0 < a1;
}

function formatClockMinutes(date, timezone) {
  const parts = partsInZone(new Date(date), timezone);
  return Number(parts.hour) * 60 + Number(parts.minute);
}

function occurrenceConflicts(candidate, calendar, ignoredIds = new Set()) {
  const issues = [];
  for (const existing of calendar.events) {
    if (ignoredIds.has(existing.id) || ['cancelled', 'completed'].includes(existing.status)) continue;
    if (candidate.hostId === existing.hostId && overlaps(candidate.startsAt, candidate.duration, existing.startsAt, existing.duration)) {
      issues.push(`${existing.hostName} already has “${existing.title}” at this time`);
    }
    if (candidate.location.mode === 'physical' && existing.location.mode === 'physical'
      && candidate.location.label.toLowerCase() === existing.location.label.toLowerCase()
      && overlaps(candidate.startsAt, candidate.duration, existing.startsAt, existing.duration)) {
      issues.push(`${candidate.location.label} is already assigned to “${existing.title}”`);
    }
    const candidateNames = new Set(candidate.participants.map(person => person.name.toLowerCase()));
    if (existing.participants.some(person => candidateNames.has(person.name.toLowerCase()))
      && overlaps(candidate.startsAt, candidate.duration, existing.startsAt, existing.duration)) {
      issues.push('A selected participant is already booked at this time');
    }
  }
  const hostTimezone = hostFor(candidate.hostId)?.timezone || candidate.timezone;
  const eventDate = dateKeyInZone(candidate.startsAt, hostTimezone);
  const startMinutes = formatClockMinutes(candidate.startsAt, hostTimezone);
  const exceptions = calendar.availabilityExceptions.filter(item => item.hostId === candidate.hostId && item.date === eventDate && item.status !== 'available');
  for (const item of exceptions) {
    const [startHour, startMinute] = item.start.split(':').map(Number);
    const [endHour, endMinute] = item.end.split(':').map(Number);
    const busyStart = startHour * 60 + startMinute;
    const busyEnd = endHour * 60 + endMinute;
    if (startMinutes < busyEnd && startMinutes + candidate.duration > busyStart) issues.push(`${candidate.hostName} is unavailable (${item.label})`);
  }
  const weekday = weekdayNumber(candidate.startsAt, hostTimezone);
  const hostRules = calendar.availabilityRules.filter(rule => rule.hostId === candidate.hostId && rule.weekday === weekday);
  const dateAvailability = calendar.availabilityExceptions.filter(item => item.hostId === candidate.hostId && item.date === eventDate && item.status === 'available');
  if (hostRules.length) {
    const insideHours = hostRules.some(rule => {
      const [startHour, startMinute] = rule.start.split(':').map(Number);
      const [endHour, endMinute] = rule.end.split(':').map(Number);
      return startMinutes >= startHour * 60 + startMinute && startMinutes + candidate.duration <= endHour * 60 + endMinute;
    });
    const insideDateAvailability = dateAvailability.some(rule => {
      const [startHour, startMinute] = rule.start.split(':').map(Number);
      const [endHour, endMinute] = rule.end.split(':').map(Number);
      return startMinutes >= startHour * 60 + startMinute && startMinutes + candidate.duration <= endHour * 60 + endMinute;
    });
    if (!insideHours && !insideDateAvailability) issues.push(`${candidate.hostName} is outside their regular availability`);
  }
  return [...new Set(issues)];
}

function appendAudit(calendar, action, target) {
  calendar.audit.unshift({ action, target, at: new Date().toISOString() });
  calendar.audit = calendar.audit.slice(0, 100);
}

function randomId() {
  return globalThis.crypto?.randomUUID?.() || `cal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function handleCalendarClick(target, calendar) {
  const { action, value, id, date, direction } = target.dataset;
  if (!action?.startsWith('calendar-')) return null;
  if (action === 'calendar-view') calendar.view = value;
  else if (action === 'calendar-section') { calendar.section = value; calendar.panel = ''; calendar.selectedEventId = ''; calendar.editingEventId = ''; }
  else if (action === 'calendar-today') { calendar.selectedDate = dateKeyInZone(new Date(), calendar.timezone); calendar.selectedEventId = ''; calendar.panel = ''; calendar.editingEventId = ''; }
  else if (action === 'calendar-shift') {
    const selected = dateFromKey(calendar.selectedDate);
    if (calendar.view === 'month') selected.setMonth(selected.getMonth() + Number(direction), 1);
    else selected.setDate(selected.getDate() + Number(direction) * (calendar.view === 'week' ? 7 : 1));
    calendar.selectedDate = keyFromDate(selected); calendar.selectedEventId = ''; calendar.panel = ''; calendar.editingEventId = '';
  } else if (action === 'calendar-select-date') { calendar.selectedDate = date; calendar.selectedEventId = ''; calendar.panel = ''; calendar.editingEventId = ''; }
  else if (action === 'calendar-select-event') { calendar.selectedEventId = id; calendar.panel = ''; calendar.section = 'calendar'; calendar.editingEventId = ''; }
  else if (action === 'calendar-open-event-form') { calendar.selectedEventId = ''; calendar.editingEventId = ''; calendar.panel = 'event'; }
  else if (action === 'calendar-edit-event') { calendar.selectedEventId = ''; calendar.editingEventId = id; calendar.panel = 'event'; }
  else if (action === 'calendar-open-availability-form') { calendar.selectedEventId = ''; calendar.editingEventId = ''; calendar.panel = 'availability'; }
  else if (action === 'calendar-close-panel') { calendar.panel = ''; calendar.selectedEventId = ''; calendar.editingEventId = ''; }
  else if (action === 'calendar-set-status') {
    const item = calendar.events.find(event => event.id === id);
    if (!item || !['confirmed', 'completed', 'cancelled'].includes(value)) return { message: 'This schedule item could not be updated.' };
    if (!(['admin', 'manager'].includes(calendar.role) || (calendar.role === 'host' && item.hostId === 'host-nadia'))) return { message: 'Your current role cannot update this event.' };
    item.status = value; appendAudit(calendar, `event ${value}`, item.title);
    return { message: `${item.title} marked ${statusName(value).toLowerCase()}.` };
  } else if (action === 'calendar-integration-info') return { message: 'Service connections will be configured in the Wistudi Integration Centre.' };
  else return null;
  return { message: '' };
}

export function handleCalendarChange(target, calendar) {
  const setting = target.dataset.calendarSetting;
  if (!setting) return false;
  if (setting === 'role') { calendar.role = target.value; calendar.selectedEventId = ''; calendar.editingEventId = ''; calendar.panel = ''; if (!['admin', 'manager', 'host'].includes(calendar.role)) calendar.section = 'calendar'; }
  else if (setting === 'filter-host') calendar.filters.hostId = target.value;
  else if (setting === 'filter-type') calendar.filters.type = target.value;
  else if (setting === 'filter-status') calendar.filters.status = target.value;
  else if (setting === 'filter-search') calendar.filters.search = target.value;
  else if (setting === 'timezone') calendar.timezone = target.value;
  else return false;
  return true;
}

function named(form, key) {
  return String(form.elements.namedItem(key)?.value || '').trim();
}

function parseParticipants(value) {
  return [...new Set(value.split(',').map(name => name.trim()).filter(Boolean))].map(name => ({
    id: `guest-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    name: name.slice(0, 80),
  }));
}

export function handleCalendarSubmit(form, calendar) {
  if (form.id === 'calendar-event-form') {
    try {
      const editing = calendar.events.find(item => item.id === calendar.editingEventId);
      if (calendar.editingEventId && !editing) throw new Error('This event is no longer available to edit.');
      if (editing && !(['admin', 'manager'].includes(calendar.role) || (calendar.role === 'host' && editing.hostId === 'host-nadia'))) {
        throw new Error('Your current role cannot edit this event.');
      }
      const title = named(form, 'title');
      const hostId = calendar.role === 'host' ? 'host-nadia' : named(form, 'hostId');
      const host = hostFor(hostId);
      if (!title || !host) throw new Error('Add an event title and choose a trainer.');
      const timezone = named(form, 'timezone') || calendar.timezone;
      const startsAt = localInputToIso(named(form, 'startsAt'), timezone);
      const duration = Number(named(form, 'duration'));
      if (!Number.isInteger(duration) || duration < 5 || duration > 1440) throw new Error('Choose a valid event duration.');
      const locationMode = named(form, 'locationMode');
      if (!['online', 'physical', 'hybrid', 'custom', 'tbd'].includes(locationMode)) throw new Error('Choose a valid event location.');
      const locationUrl = named(form, 'locationUrl');
      if (locationUrl) {
        let parsed;
        try { parsed = new URL(locationUrl); } catch { throw new Error('Enter a complete https:// meeting or location link.'); }
        if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Use a secure https:// link without embedded credentials.');
      }
      const resourceUrl = named(form, 'resourceUrl');
      if (resourceUrl) {
        let parsed;
        try { parsed = new URL(resourceUrl); } catch { throw new Error('Enter a complete https:// resource link.'); }
        if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Use a secure https:// resource link.');
      }
      const selectedStudioId = named(form, 'studioEventId');
      const studioEvent = studioEvents.find(item => item.id === selectedStudioId);
      if (selectedStudioId && !studioEvent) throw new Error('Choose a valid Publisher Studio event.');
      const locationLabels = { online: 'Online meeting', physical: 'In person', hybrid: 'Hybrid event', custom: 'Custom link', tbd: 'To be confirmed' };
      const locationLabel = named(form, 'locationLabel') || (locationMode === 'physical' ? 'In-person location' : locationUrl && locationMode === 'online' ? 'Online meeting' : locationLabels[locationMode]);
      const participants = parseParticipants(named(form, 'participants'));
      const fields = {
        title, type: named(form, 'type') || 'Workshop', duration, timezone,
        hostId, hostName: host.name, group: named(form, 'group') || (studioEvent ? 'Publisher Studio' : ''),
        participants, status: named(form, 'status') || 'confirmed', visibility: named(form, 'visibility') || 'private',
        source: studioEvent ? 'publisher-studio' : 'calendar', studioEventId: studioEvent?.id || '',
        location: { mode: locationMode, label: locationLabel, url: locationUrl },
        resourceUrl, notes: named(form, 'notes'),
      };
      const override = ['admin', 'manager'].includes(calendar.role) && form.elements.namedItem('overrideConflict')?.checked;
      if (editing) {
        const scope = editing.seriesId ? named(form, 'editScope') : 'single';
        const targets = calendar.events.filter(item => item.id === editing.id || (editing.seriesId && item.seriesId === editing.seriesId && (
          scope === 'series' || (scope === 'future' && Number(item.occurrence || 0) >= Number(editing.occurrence || 0))
        )));
        if (!targets.length) throw new Error('No matching event occurrences were found.');
        const ignoredIds = new Set(targets.map(item => item.id));
        const delta = Date.parse(startsAt) - Date.parse(editing.startsAt);
        const replacements = targets.map(item => ({
          ...item, ...fields,
          startsAt: item.id === editing.id ? startsAt : editing.seriesId
            ? addWeeksInZone(startsAt, timezone, Number(item.occurrence || 0) - Number(editing.occurrence || 0))
            : new Date(Date.parse(item.startsAt) + delta).toISOString(),
        }));
        for (const candidate of replacements) {
          const conflicts = occurrenceConflicts(candidate, calendar, ignoredIds);
          if (conflicts.length && !override) throw new Error(`Schedule conflict: ${conflicts.slice(0, 2).join('; ')}. Adjust the time or use an authorised override.`);
          if (conflicts.length) appendAudit(calendar, 'availability conflict overridden', `${candidate.title}: ${conflicts.join('; ')}`);
        }
        for (const replacement of replacements) {
          const index = calendar.events.findIndex(item => item.id === replacement.id);
          calendar.events[index] = replacement;
        }
        calendar.selectedEventId = editing.id;
        calendar.selectedDate = dateKeyInZone(startsAt, calendar.timezone);
        calendar.panel = ''; calendar.editingEventId = ''; calendar.section = 'calendar';
        appendAudit(calendar, 'event updated', `${title} (${scope === 'single' ? 'this occurrence' : scope === 'future' ? 'this and future' : 'series'})`);
        return { message: targets.length > 1 ? `Updated ${targets.length} event occurrences.` : 'Event updated in this browser tab.' };
      }
      const recurrence = named(form, 'recurrence');
      const seriesId = recurrence === 'weekly' ? randomId() : '';
      const occurrences = recurrence === 'weekly' ? 4 : 1;
      const created = [];
      for (let occurrence = 0; occurrence < occurrences; occurrence += 1) {
        const occurrenceStart = addWeeksInZone(startsAt, timezone, occurrence);
        const candidate = {
          id: randomId(), ...fields, startsAt: occurrenceStart,
          ...(seriesId ? { seriesId, occurrence: occurrence + 1 } : {}),
        };
        const conflicts = occurrenceConflicts(candidate, calendar);
        if (conflicts.length && !override) throw new Error(`Schedule conflict: ${conflicts.slice(0, 2).join('; ')}. Adjust the time or use an authorised override.`);
        if (conflicts.length) appendAudit(calendar, 'availability conflict overridden', `${candidate.title}: ${conflicts.join('; ')}`);
        created.push(candidate);
      }
      calendar.events.unshift(...created);
      calendar.selectedEventId = created[0].id; calendar.panel = ''; calendar.editingEventId = ''; calendar.section = 'calendar';
      calendar.selectedDate = dateKeyInZone(created[0].startsAt, calendar.timezone);
      appendAudit(calendar, recurrence === 'weekly' ? 'recurring event series created' : 'event created', title);
      return { message: recurrence === 'weekly' ? `Added ${created.length} weekly occurrences.` : 'Event saved to this browser tab.' };
    } catch (error) { return { error: error.message || 'The event could not be saved.' }; }
  }
  if (form.id === 'calendar-availability-form') {
    const hostId = calendar.role === 'host' ? 'host-nadia' : named(form, 'hostId');
    const host = hostFor(hostId);
    const start = named(form, 'start');
    const end = named(form, 'end');
    const label = named(form, 'label') || (named(form, 'kind') === 'available' ? 'Available time' : 'Unavailable');
    if (!host || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || start >= end) return { error: 'Choose a trainer and a valid time range.' };
    const kind = named(form, 'kind');
    const scope = named(form, 'scope');
    if (scope === 'weekly' && kind === 'blocked') return { error: 'Unavailable time must be attached to a specific date.' };
    if (scope === 'weekly' && kind === 'available') {
      calendar.availabilityRules.push({ id: randomId(), hostId, weekday: Number(named(form, 'weekday')), start, end, label });
    } else {
      const status = kind === 'available' ? 'available' : 'blocked';
      calendar.availabilityExceptions.push({ id: randomId(), hostId, date: named(form, 'date') || calendar.selectedDate, start, end, status, label });
    }
    calendar.panel = ''; calendar.section = 'availability';
    appendAudit(calendar, 'availability updated', `${host.name}: ${label}`);
    return { message: 'Availability saved in this browser tab.' };
  }
  return null;
}
