import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mirdo Movie Madness",
  description: "Random movie picker from the Letterboxd Top 500",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
