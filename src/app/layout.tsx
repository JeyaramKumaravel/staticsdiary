
import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/app-context';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'StaticsDiary - Income & Expense Tracker',
  description: 'Track your daily income and expenses with StaticsDiary.',
  manifest: '/manifest.json',
  icons: {
    icon: "/icons/icon-192x192.png", // Default icon
    apple: "/icons/apple-touch-icon-180x180.png", // Apple touch icon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#5C6BC0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StaticsDiary" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" data-ai-hint="finance logo" />
        <link rel="icon" href="/icons/icon-512x512.png" type="image/png" sizes="512x512" data-ai-hint="finance app" />
      </head>
      <body className="font-body antialiased">
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
