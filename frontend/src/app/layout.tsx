import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bengaluru AQI | ML-Powered Air Quality Intelligence",
  description: "Real-time AI-driven air quality prediction, explanation, and simulation dashboard for Bengaluru. Monitor PM2.5, NO2, and other pollutants.",
  keywords: ["Bengaluru", "AQI", "Air Quality", "Machine Learning", "Pollution", "PM2.5", "Predictive Modeling"],
  openGraph: {
    title: "Bengaluru AQI Intelligence",
    description: "Real-time ML-powered air quality monitoring and simulation.",
    url: "https://bengaluru-aqi.com",
    siteName: "Bengaluru AQI",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bengaluru AQI Intelligence",
    description: "Real-time ML-powered air quality monitoring and simulation.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export const viewport: Viewport = {
  themeColor: "#111216",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${jetbrainsMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('theme');
                const theme = stored || 'system';
                let resolved = theme;
                if (theme === 'system') {
                  resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(resolved);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-obsidian dark:bg-obsidian light:bg-white text-steel dark:text-steel light:text-[#6e6e73] font-sans selection:bg-emerald-500/30">
        <ThemeProvider>
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pb-20 sm:pb-0">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
