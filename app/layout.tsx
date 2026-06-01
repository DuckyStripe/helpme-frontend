import type { Metadata } from "next";
import "./globals.css";
import ToastContainer from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "HelpMe - Identificación de Emergencia para Bikers",
  description: "Plataforma de identificación de emergencia para motociclistas. En caso de accidente, los paramedicos podrán acceder a tu información médica vital.",
  manifest: "/manifest.json",
  themeColor: "#DC2626",
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
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#DC2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HelpMe" />
      </head>
      <body className="antialiased">
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
