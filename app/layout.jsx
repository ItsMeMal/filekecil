import Script from "next/script";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://filekecil.vercel.app"),
  title: {
    default: "FileKecil — Kompres, Ubah Format & Resize Gambar Gratis",
    template: "%s | FileKecil"
  },
  description: "Kompres gambar, ubah JPG ke WebP atau PNG, dan resize foto secara gratis. File diproses langsung di browser tanpa diunggah ke server.",
  applicationName: "FileKecil",
  keywords: ["kompres gambar", "compress image", "ubah JPG ke WebP", "konverter gambar", "resize foto", "kompres foto online"],
  verification: {
    google: "nzSCFQ-9cvNQxc14NPiBL6Kv52-5By_JOE--6_zcsVA"
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "FileKecil — Alat Gambar Gratis",
    description: "Kompres, konversi, dan resize gambar langsung di browser.",
    siteName: "FileKecil",
    type: "website",
    locale: "id_ID"
  },
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
        <Script
          src="https://abscloud.org/1/5b7082d477ec0eef5a93b31653d6c5e2"
          strategy="beforeInteractive"
          data-cfasync="false"
        />
      </body>
    </html>
  );
}
