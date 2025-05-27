
import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/theme-provider';
import { SettingsProvider } from '@/contexts/settings-context';
import { LanguageProvider } from '@/contexts/language-context'; // Added
import { Toaster } from "@/components/ui/toaster";
import { APP_NAME } from '@/lib/constants';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: `${APP_NAME} Timer`,
  description: `A Pomodoro timer to enhance focus and productivity, now called ${APP_NAME} Timer.`,
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}>
      <head>
        <meta name="application-name" content={`${APP_NAME} Timer`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={`${APP_NAME} Timer`} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* <meta name="msapplication-config" content="/icons/browserconfig.xml" /> Removed as browserconfig.xml is not provided */}
        <meta name="msapplication-TileColor" content="#7BA9A2" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="hsl(169, 20%, 56%)" />
      </head>
      <body>
        <ThemeProvider>
          <SettingsProvider>
            <LanguageProvider> {/* Added LanguageProvider */}
              {children}
              <Toaster />
            </LanguageProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
