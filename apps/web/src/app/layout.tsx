import type { Metadata, Viewport } from 'next';
import { Chivo, Space_Mono } from 'next/font/google';
import './globals.css';

/*
 * Chivo carries prose and headings; Space Mono carries every figure a user might
 * read aloud — part numbers, VINs, Naira ranges, estimate references. Both are
 * loaded with `display: swap` because the audience is on mobile data and a
 * blocked render is worse than a flash of fallback.
 */
const chivo = Chivo({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-chivo',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MIMS — what car parts actually cost',
    template: '%s · MIMS',
  },
  description:
    'Identify your car, mark the damage, and get the parts you need with estimated Naira prices. Parts only, sourced from Lagos dealers and traders.',
};

export const viewport: Viewport = {
  themeColor: '#0D1512',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${chivo.variable} ${spaceMono.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
