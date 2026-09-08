import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchSiteContent, ContentKey } from "@/lib/content";

const KEYS: ContentKey[] = ["getting_there", "where_to_stay", "our_story", "family_helpline"];

export async function GET() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const content = await fetchSiteContent();
  return NextResponse.json({ content });
}

/**
 * Body shape: { key: "getting_there" | "where_to_stay" | "our_story" | "family_helpline",
 *                title: string, body: string }
 */
export async function PATCH(req: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || !KEYS.includes(body.key) || typeof body.title !== "string" || typeof body.body !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("site_content")
    .upsert({ key: body.key, title: body.title, body: body.body, updated_at: new Date().toISOString() });
  if (error) {
    return NextResponse.json(
      {
        error:
          "Could not save. Has the supabase/migrations/0002_site_content.sql migration been run yet?",
      },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
