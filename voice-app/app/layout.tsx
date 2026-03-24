import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TowerMind — Frontier Tower Voice Agent",
  description:
    "AI concierge voice agent for Frontier Tower, 995 Market St, San Francisco",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#030303",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "VoiceApplication",
  name: "TowerMind",
  description: "AI concierge voice agent for Frontier Tower",
  url: "https://towermind.thexperiment.dev",
  location: {
    "@type": "Place",
    name: "Frontier Tower",
    address: "995 Market St, San Francisco, CA",
  },
  availableLanguage: "en",
  applicationCategory: "Voice Agent",
  provider: { "@type": "Organization", name: "The Experiment" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Instrument+Serif:ital@0;1&family=Outfit:wght@200;300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <meta name="agent:type" content="voice-concierge" />
        <meta name="agent:capabilities" content="floor-navigation,event-query,people-lookup,real-time-status" />
        <meta name="agent:protocol" content="voice-first" />
        <meta name="agent:stack" content="elevenlabs,claude-sonnet" />
        <meta name="agent:version" content="2030.1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
