// The site's public URL, included in guest-facing messages (e.g. WhatsApp/email
// reminders) that need a link back in. Optional - reminders still work without
// it, just without a clickable link.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
