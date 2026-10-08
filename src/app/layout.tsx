import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LowDataProvider } from "@/components/providers/low-data-provider";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aptitude Arena | Real-time Collegiate Aptitude Competition",
  description:
    "Practice aptitude. Compete live. Get placement-ready. Real-time multiplayer aptitude and logical reasoning competitions for college students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#080c14] text-slate-100 antialiased`}>
        <AuthProvider>
          <LowDataProvider>
            <Navbar />
            <div className="flex-1 flex flex-col">{children}</div>
          </LowDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
