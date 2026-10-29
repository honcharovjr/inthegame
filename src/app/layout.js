import { Bricolage_Grotesque, Uncial_Antiqua } from "next/font/google";
import TipLayer from "@/components/TipLayer/TipLayer";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

// The fantasy font: the kind of a character, perks and achievement names
const uncial = Uncial_Antiqua({
  variable: "--font-fancy",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "in the game",
  description: "log your board and card game sessions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${uncial.variable}`}>
      {/* Browser extensions add attributes to body before React loads */}
      <body suppressHydrationWarning>
        {children}
        <TipLayer />
      </body>
    </html>
  );
}
