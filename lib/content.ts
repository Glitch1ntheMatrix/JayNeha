import "server-only";
import { supabaseAdmin } from "./supabase";

export type ContentKey = "getting_there" | "where_to_stay" | "our_story" | "family_helpline";

export interface ContentBlock {
  title: string;
  body: string;
}

export type SiteContent = Record<ContentKey, ContentBlock>;

// Always-available fallback copy. A row in the `site_content` table (see
// supabase/migrations/0002_site_content.sql) overrides the matching key here,
// so the page keeps working even before that migration has been run.
export const DEFAULT_CONTENT: SiteContent = {
  getting_there: {
    title: "Getting there",
    body:
      "The Mumbai events sit within the city: Iskon Temple at Chowpatty, Soho Club in Juhu, and Karl Residency in Andheri. Allow extra time for evening traffic.\n\nIkshana Resort, Lonavala is about two and a half hours from Mumbai by road. Tell us in the form above if you would like help with travel.",
  },
  where_to_stay: {
    title: "Where to stay",
    body:
      "Rooms for the 11th and 12th are held for guests travelling to Lonavala. If a room is reserved for you, the details appear on this page once you sign in.\n\nCheck in from the afternoon of 11 December, check out on the 13th.",
  },
  our_story: {
    title: "Our story",
    body:
      "It started in Mumbai in January 2019. We spent four years in different time zones and learned that the distance never really changed how we felt.\n\nThe years since have been spent together, and they have been the happiest ones. This December we take the next step and marry, with the blessings of everyone we hold dear.",
  },
  family_helpline: {
    title: "Amit Chandak",
    body: "+91 90225 22149",
  },
};

export async function fetchSiteContent(): Promise<SiteContent> {
  const merged: SiteContent = {
    getting_there: { ...DEFAULT_CONTENT.getting_there },
    where_to_stay: { ...DEFAULT_CONTENT.where_to_stay },
    our_story: { ...DEFAULT_CONTENT.our_story },
    family_helpline: { ...DEFAULT_CONTENT.family_helpline },
  };

  try {
    const { data, error } = await supabaseAdmin.from("site_content").select("key, title, body");
    if (!error && data) {
      for (const row of data as { key: string; title: string; body: string }[]) {
        if (row.key in merged) {
          merged[row.key as ContentKey] = {
            title: row.title || merged[row.key as ContentKey].title,
            body: row.body || merged[row.key as ContentKey].body,
          };
        }
      }
    }
  } catch {
    // site_content table doesn't exist yet (migration not run) — defaults stand.
  }

  return merged;
}
