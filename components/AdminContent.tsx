"use client";

import { useEffect, useState } from "react";
import AdminGate from "./AdminGate";

interface ContentBlock {
  title: string;
  body: string;
}

const CONTENT_KEYS = ["getting_there", "where_to_stay", "our_story", "family_helpline"] as const;
type ContentKey = (typeof CONTENT_KEYS)[number];
const CONTENT_LABELS: Record<ContentKey, string> = {
  getting_there: "Getting there",
  where_to_stay: "Where to stay",
  our_story: "Our story",
  family_helpline: "Family helpline (title = name, body = phone)",
};

export default function AdminContent() {
  const [content, setContent] = useState<Record<ContentKey, ContentBlock> | null>(null);
  const [saving, setSaving] = useState<ContentKey | null>(null);
  const [saved, setSaved] = useState<ContentKey | null>(null);

  async function loadContent() {
    const res = await fetch("/api/admin/content");
    if (res.ok) {
      const data = await res.json();
      setContent(data.content || null);
    }
  }

  useEffect(() => {
    loadContent();
  }, []);

  function editContent(key: ContentKey, field: "title" | "body", value: string) {
    setContent((c) => (c ? { ...c, [key]: { ...c[key], [field]: value } } : c));
  }

  async function saveContent(key: ContentKey) {
    if (!content) return;
    setSaving(key);
    setSaved(null);
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, title: content[key].title, body: content[key].body }),
    });
    setSaving(null);
    if (res.ok) {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
  }

  return (
    <AdminGate active="content">
      <div className="max-w-[900px]">
        <div className="text-[15.5px] text-inkMuted mb-6">
          This is the copy shown in the footer at the bottom of every guest&apos;s page — Getting
          there, Where to stay, Our story, and the family helpline contact. Edit and save each
          block below.
        </div>
        {content && (
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
            {CONTENT_KEYS.map((key) => (
              <div key={key} className="bg-creamCard border border-border rounded-sm p-5">
                <label className="block text-sm tracking-[.14em] uppercase text-inkMuted mb-1.5">
                  {CONTENT_LABELS[key]}
                </label>
                <input
                  value={content[key].title}
                  onChange={(e) => editContent(key, "title", e.target.value)}
                  placeholder="Title"
                  className="w-full p-2.5 mb-1.5 border border-borderInput rounded-[2px] bg-white text-ink text-[14.5px]"
                />
                <textarea
                  value={content[key].body}
                  onChange={(e) => editContent(key, "body", e.target.value)}
                  rows={key === "family_helpline" ? 1 : 5}
                  placeholder="Body"
                  className="w-full p-2.5 border border-borderInput rounded-[2px] bg-white text-ink text-[14.5px]"
                />
                <div className="mt-1.5 flex items-center gap-3">
                  <button
                    onClick={() => saveContent(key)}
                    disabled={saving === key}
                    className="px-3 py-1.5 bg-maroon text-cream border-none rounded-[2px] text-[12.5px] tracking-[.12em] uppercase cursor-pointer disabled:opacity-60"
                  >
                    {saving === key ? "Saving…" : "Save"}
                  </button>
                  {saved === key && <span className="text-[13px] text-[#4E7A3A]">Saved.</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminGate>
  );
}
