import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata = {
  title: "In the Game",
  description: "Log your board and card game sessions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={bricolage.variable}>
      {/* Browser extensions add attributes to body before React loads */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
