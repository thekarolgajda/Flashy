import { Anybody, Archivo } from "next/font/google";
import "./edition.css";

/*
 * The game gets its own typefaces, loaded only on this route. Anybody is a
 * variable grotesque with a width axis, which is what lets the headline run
 * wide enough to fill the lid; Archivo carries the reading. Neither is used
 * anywhere else in Flashy, which is the point: this page is a different
 * object from the app.
 */
const anybody = Anybody({
  variable: "--font-edition-display",
  subsets: ["latin"],
  axes: ["wdth"],
});

const archivo = Archivo({
  variable: "--font-edition-body",
  subsets: ["latin"],
});

export default function EditionLayout({
  children,
}: LayoutProps<"/enough-about-the-weather">) {
  return (
    <div className={`eatw grow ${anybody.variable} ${archivo.variable}`}>{children}</div>
  );
}
