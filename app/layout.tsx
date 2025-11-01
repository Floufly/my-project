import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  title: 'Numérologie intuitive — Consultations en ligne',
  description:
    'Réservez une séance de numérologie professionnelle avec un accompagnement humain, des paiements flexibles et une planification automatique.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={manrope.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
