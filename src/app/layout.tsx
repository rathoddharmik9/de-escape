import type { Metadata } from "next";
import { Fredoka, Poppins, Nunito } from "next/font/google";
import { SceneProvider } from "@/components/motion/SceneProvider";
import SceneCanvas from "@/components/motion/SceneCanvas";
import CustomCursor from "@/components/motion/CustomCursor";
import SmoothScroll from "@/components/motion/SmoothScroll";
import PageLoaderWrapper from "@/components/layout/PageLoaderWrapper";
import "./globals.css";

const fredoka = Fredoka({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const nunito = Nunito({
  weight: ["900"],
  subsets: ["latin"],
  variable: "--font-logo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "De-escape — Escape the ordinary. Experience the world differently.",
  description:
    "Curated in-real-life events — sound baths, suppers, runs, book circles. Discover what's around you.",
  openGraph: {
    title: "De-escape",
    description: "Escape the ordinary. Experience the world differently.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${poppins.variable} ${nunito.variable}`}
      style={{ colorScheme: "light" }}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('de_escape_loaded') === 'true') {
                  document.documentElement.classList.add('loader-skipped');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <div className="grain" aria-hidden="true" />
        <SceneProvider>
          <PageLoaderWrapper />
          <SceneCanvas />
          <CustomCursor />
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </SceneProvider>
      </body>
    </html>
  );
}
