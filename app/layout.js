import './globals.css';

export const metadata = {
  title: 'Confirmation de présence — Synelia',
  icons: {
    icon: '/synelia-logo.png',
    shortcut: '/synelia-logo.png',
    apple: '/synelia-logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
