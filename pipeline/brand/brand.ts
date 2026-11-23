// Brand constants. navy and gold are taken verbatim from the official master logo SVG
// (assets/brand/logo/master.svg, supplied by the owner 24 Nov 2026). cream and charcoal
// are supporting UI colours, not logo colours.
export const PALETTE = {
  navy: '#0B3B7A',
  gold: '#F5AE0B',
  white: '#FFFFFF',
  cream: '#FFF8E8',
  charcoal: '#243443',
} as const;

export const PALETTE_STATUS = 'from-master-logo' as const; // navy/gold extracted from the supplied logo

// V1.1 brand voice (supersedes v1.0 "Solar, klaro!" lines)
export const BRAND_LINES = {
  tagline: 'Life is SoLight with Solar.', // LOCKED. Never edited by generators.
  greetings: {
    'greet-default': 'Hello, SoSmart viewers! Kuya SoLight \'to!',
  },
  catchphrases: {
    'close-signature': 'Dahil ang gusto ni Kuya SoLight… naka-solar ka na, SoSmart ka pa!',
    'close-educational': 'Dahil ang gusto ni Kuya SoLight… kapag nag-solar ka, SoSmart ka pa!',
  },
  community: ['SoSmart viewers', 'mga SoSmart'],
} as const;

export type GreetingId = keyof typeof BRAND_LINES.greetings;
export type CatchphraseId = keyof typeof BRAND_LINES.catchphrases;

// Master logo: supplied by the owner via Brand Settings → saved to assets/brand/logo/master.(svg|png).
// Until then the renderer draws a clearly-marked placeholder and QA blocks publication.
import { existsSync } from 'node:fs';
export const LOGO_DIR = 'assets/brand/logo';
export function masterLogoPath(): string | null {
  for (const ext of ['svg', 'png']) { const p = `${LOGO_DIR}/master.${ext}`; if (existsSync(p)) return p; }
  return null;
}

// Reels-safe layout (1080x1920). Conservative: keep text/captions out of the top 250px,
// the bottom 520px (caption/username/CTA overlay) and the right 140px (action buttons).
export const CANVAS = { w: 1080, h: 1920, fps: 30 } as const;
export const SAFE = { top: 250, bottom: 1400, left: 70, right: 940 } as const;

/** Official reversed (light-on-dark) logo, used unchanged on navy backgrounds. */
export function masterLogoReversedPath(): string | null {
  for (const ext of ['svg', 'png']) { const p = `${LOGO_DIR}/master-reversed.${ext}`; if (existsSync(p)) return p; }
  return null;
}
