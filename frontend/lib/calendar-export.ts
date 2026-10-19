/**
 * Calendar Export Utility (.ics format & Google Calendar link)
 */

export interface CalendarEventData {
  title: string;
  description: string;
  startTime: string | Date;
  endTime?: string | Date;
  venueName?: string;
  venueCity?: string;
  venueAddress?: string;
  eventUrl?: string;
}

export function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function generateIcsContent(event: CalendarEventData): string {
  const startDate = new Date(event.startTime);
  const endDate = event.endTime
    ? new Date(event.endTime)
    : new Date(startDate.getTime() + 3 * 3600 * 1000); // default 3 hours

  const location = [event.venueName, event.venueAddress, event.venueCity]
    .filter(Boolean)
    .join(", ") || "Arena Stadium";

  const cleanDescription = (event.description || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

  const cleanTitle = (event.title || "AuraTickets Event")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AuraTickets//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:auratickets-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@auratickets.io`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}${event.eventUrl ? " - Pass URL: " + event.eventUrl : ""}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder for " + cleanTitle,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsFile(event: CalendarEventData): void {
  const ics = generateIcsContent(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  const safeFilename = (event.title || "event")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 32);
  anchor.download = `${safeFilename}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getGoogleCalendarUrl(event: CalendarEventData): string {
  const startDate = new Date(event.startTime);
  const endDate = event.endTime
    ? new Date(event.endTime)
    : new Date(startDate.getTime() + 3 * 3600 * 1000);

  const startIso = formatIcsDate(startDate);
  const endIso = formatIcsDate(endDate);

  const location = [event.venueName, event.venueAddress, event.venueCity]
    .filter(Boolean)
    .join(", ");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "AuraTickets Event",
    dates: `${startIso}/${endIso}`,
    details: `${event.description || ""}\n\nBooked via AuraTickets: ${event.eventUrl || ""}`,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
