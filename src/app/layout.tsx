import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenForge - AI App Generator",
  description: "Generate full-stack apps with AI. You own the code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased bg-slate-950 text-slate-100`}
      >
        <div className="min-h-screen">
          <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">
                  OF
                </div>
                <h1 className="text-xl font-semibold">OpenForge</h1>
              </div>
              <div className="text-sm text-slate-400">
                AI-generated code you own
              </div>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
