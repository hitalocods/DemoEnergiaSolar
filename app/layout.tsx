import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "EBS Energia Solar · Painel de atendimento",
    template: "%s · EBS Energia Solar",
  },
  description:
    "Painel de atendimento e conversão de leads da EBS Energia Solar: acompanhe a IA, assuma conversas e feche mais vendas de energia solar.",
  icons: {
    icon: "/ebs-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} h-full antialiased overflow-x-hidden`}>
      <body className="min-h-full font-sans overflow-x-hidden max-w-[100vw]">{children}</body>
    </html>
  );
}
