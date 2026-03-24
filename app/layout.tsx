import type { Metadata } from "next";
import "./globals.css";
import ToastContainer from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "HelpMe - Ficha Médica de Emergencia",
  description: "Crea tu ficha médica de emergencia para motociclistas. En caso de accidente, los servicios de emergencia podrán acceder a tu información vital.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
