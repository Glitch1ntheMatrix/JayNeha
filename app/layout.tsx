import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neha & Jay — Wedding RSVP",
  description: "You're invited. RSVP for Neha and Jay's wedding celebrations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Marcellus&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-ui font-light text-ink bg-cream min-h-screen">{children}</body>
    </html>
  );
}
