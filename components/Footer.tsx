import { RSVP_DEADLINE } from "@/lib/deadline";
import { SiteContent } from "@/lib/content";

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className="text-[15.5px] leading-relaxed text-inkBody mt-3 first:mt-0">
            {para}
          </p>
        ))}
    </>
  );
}

export default function Footer({ content }: { content: SiteContent }) {
  return (
    <div className="max-w-[1160px] mx-auto px-[22px] mt-16 pb-14">
      <div className="grid gap-9 md:gap-[clamp(24px,4vw,48px)]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
        <div>
          <div className="font-display text-[21px] text-maroon mb-2.5">
            {content.getting_there.title}
          </div>
          <Paragraphs text={content.getting_there.body} />
        </div>
        <div>
          <div className="font-display text-[21px] text-maroon mb-2.5">
            {content.where_to_stay.title}
          </div>
          <Paragraphs text={content.where_to_stay.body} />
        </div>
        <div>
          <div className="font-display text-[21px] text-maroon mb-2.5">
            {content.our_story.title}
          </div>
          <Paragraphs text={content.our_story.body} />
        </div>
      </div>

      <div className="grid gap-6 md:gap-[clamp(24px,4vw,48px)] mt-11 pt-7 border-t border-border items-start" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        <div>
          <div className="text-sm tracking-[.2em] uppercase text-inkMuted mb-2">
            Family helpline
          </div>
          <div className="text-[17px] text-ink">{content.family_helpline.title}</div>
          <a
            href={`tel:${content.family_helpline.body.replace(/[^+\d]/g, "")}`}
            className="text-[15.5px] text-inkSoft border-none hover:text-maroon"
          >
            {content.family_helpline.body}
          </a>
        </div>
        <div>
          <div className="text-sm tracking-[.2em] uppercase text-inkMuted mb-2">RSVP by</div>
          <div className="text-[17px] text-ink">{RSVP_DEADLINE}</div>
          <div className="mt-1 text-[14.5px] text-inkMuted">
            You can come back and change your answers any time before then.
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.png" alt="Neha and Jay" className="h-[52px] w-auto" />
          <div className="mt-2 text-sm tracking-[.2em] uppercase text-inkMuted">
            12 December 2026
          </div>
        </div>
      </div>
    </div>
  );
}
