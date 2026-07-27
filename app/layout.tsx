import type { Metadata, Viewport } from "next";
import "./globals.css";
import ToastContainer from "@/components/ToastContainer";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const viewport: Viewport = {
  themeColor: "#DC2626",
};

export const metadata: Metadata = {
  title: "HelpMe - Identificación de Emergencia para Bikers",
  description: "Plataforma de identificación de emergencia para motociclistas. En caso de accidente, los paramedicos podrán acceder a tu información médica vital.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HelpMe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#DC2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HelpMe" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors" suppressHydrationWarning>
        {children}
        <ToastContainer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
