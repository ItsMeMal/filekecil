export default function sitemap() {
  const base = "https://filekecil.vercel.app";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: base + "/privasi", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
