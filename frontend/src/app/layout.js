import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "PostureAI — AI-Powered Posture Correction & Physiotherapy",
  description:
    "Real-time AI posture analysis using computer vision. Correct your posture in real-time with instant feedback — like having a physiotherapist in your pocket.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
