
import type { Metadata } from "next";
import { PT_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { ThemeInit } from "@/components/theme-init";

const pt_sans = PT_Sans({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  variable: "--font-body",
});

const playfair_display = Playfair_Display({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"],
  variable: "--font-headline",
});


export const metadata: Metadata = {
  title: "BarberCut Bot",
  description: "A solução completa para gerenciar sua barbearia com o poder da IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${pt_sans.variable} ${playfair_display.variable} font-body antialiased`}>
        <ThemeInit />
        <FirebaseClientProvider>
          {children}
          <Toaster />
          <CookieConsent />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
