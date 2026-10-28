import { Bricolage_Grotesque, Cinzel } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

// The fantasy display font of character names
const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "900"],
});

export const metadata = {
  title: "in the game",
  description: "log your board and card game sessions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${cinzel.variable}`}>
      {/* Browser extensions add attributes to body before React loads */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
