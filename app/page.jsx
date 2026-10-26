"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, FileImage, ImagePlus, LockKeyhole, RefreshCw, Scaling, ShieldCheck, Sparkles, X, Zap } from "lucide-react";

const tools = [
  { id: "compress", title: "Kompres gambar", desc: "Kurangi ukuran file tanpa ribet.", icon: Zap },
  { id: "convert", title: "Konversi format", desc: "Ubah JPG, PNG, atau WebP.", icon: RefreshCw },
  { id: "resize", title: "Resize gambar", desc: "Atur lebar dan tinggi sesuai kebutuhan.", icon: Scaling },
];

async function makeIcoBlob(pngBlob) {
  const png = new Uint8Array(await pngBlob.arrayBuffer());
  const header = new ArrayBuffer(22);
  const view = new DataView(header);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  view.setUint8(6, 0); view.setUint8(7, 0);
  view.setUint8(8, 0); view.setUint8(9, 0);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, png.byteLength, true);
  view.setUint32(18, 22, true);
  return new Blob([header, png], { type: "image/x-icon" });
}

function prettyBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function Home() {
  const [mode, setMode] = useState("compress");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [quality, setQuality] = useState(78);
  const [format, setFormat] = useState("image/webp");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const imageRef = useRef(null);

  const loadFile = useCallback((selected) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) { setError("Pilih file gambar yang valid."); return; }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"].includes(selected.type)) {
      setError("Format ini belum didukung. Gunakan JPG, PNG, WebP, GIF, atau BMP."); return;
    }
    if (selected.size > 25 * 1024 * 1024) { setError("Ukuran maksimum file adalah 25 MB."); return; }
    setError(""); setResult(null); setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
    const img = new Image();
    img.onload = () => { setWidth(String(img.naturalWidth)); setHeight(String(img.naturalHeight)); };
    img.src = url;
  }, []);

  function updateWidth(value) {
    setWidth(value);
    if (keepRatio && imageRef.current && value) setHeight(String(Math.max(1, Math.round(Number(value) * imageRef.current.naturalHeight / imageRef.current.naturalWidth))));
  }
  function updateHeight(value) {
    setHeight(value);
    if (keepRatio && imageRef.current && value) setWidth(String(Math.max(1, Math.round(Number(value) * imageRef.current.naturalWidth / imageRef.current.naturalHeight))));
  }

  async function processImage() {
    if (!file || !preview) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const img = new Image();
      img.src = preview;
      await img.decode();
      let w = img.naturalWidth, h = img.naturalHeight;
      if (mode === "resize") {
        w = Math.max(1, Math.min(10000, Number(width) || w));
        h = Math.max(1, Math.min(10000, Number(height) || h));
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d", { alpha: format !== "image/jpeg" });
      if (format === "image/jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(img, 0, 0, w, h);
      let blob;
      let outputType = format;
      if (format === "application/pdf") {
        const { jsPDF } = await import("jspdf");
        const pdfCanvas = document.createElement("canvas");
        pdfCanvas.width = w; pdfCanvas.height = h;
        const pdfCtx = pdfCanvas.getContext("2d");
        pdfCtx.fillStyle = "#ffffff"; pdfCtx.fillRect(0, 0, w, h);
        pdfCtx.drawImage(img, 0, 0, w, h);
        const jpegData = pdfCanvas.toDataURL("image/jpeg", quality / 100);
        const pdf = new jsPDF({ orientation: w >= h ? "landscape" : "portrait", unit: "pt", format: [w, h], compress: true });
        pdf.addImage(jpegData, "JPEG", 0, 0, w, h);
        blob = pdf.output("blob");
      } else if (format === "image/x-icon") {
        const icoCanvas = document.createElement("canvas");
        const scale = Math.min(1, 256 / Math.max(w, h));
        icoCanvas.width = Math.max(1, Math.round(w * scale));
        icoCanvas.height = Math.max(1, Math.round(h * scale));
        const icoCtx = icoCanvas.getContext("2d");
        icoCtx.clearRect(0, 0, icoCanvas.width, icoCanvas.height);
        icoCtx.drawImage(img, 0, 0, icoCanvas.width, icoCanvas.height);
        const pngBlob = await new Promise((resolve, reject) => icoCanvas.toBlob(b => b ? resolve(b) : reject(new Error("Gagal membuat ikon ICO.")), "image/png"));
        blob = await makeIcoBlob(pngBlob);
      } else {
        blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Browser tidak bisa membuat gambar dengan format ini.")), format, quality / 100));
        if (blob.type !== format) throw new Error("Browser ini tidak mendukung format hasil tersebut. Pilih JPG, PNG, WebP, ICO, atau PDF.");
      }
      outputType = format;
      const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/x-icon": "ico", "application/pdf": "pdf" })[outputType] || "img";
      const base = file.name.replace(/\.[^.]+$/, "");
      setResult({ blob, url: URL.createObjectURL(blob), name: base + "-filekecil." + ext, originalSize: file.size, size: blob.size, width: w, height: h, type: outputType });
    } catch (e) {
      setError(e?.message || "Gagal memproses gambar. Coba format file lain.");
    } finally { setBusy(false); }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null); setPreview(""); setResult(null); setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const saved = result ? Math.max(0, Math.round((1 - result.size / result.originalSize) * 100)) : 0;

  return (
    <main>
      <header className="topbar">
        <a href="/" className="brand" aria-label="FileKecil beranda"><span className="brand-mark"><FileImage size={21}/></span><span>filekecil<span className="brand-dot">.</span></span></a>
        <nav><a href="#alat">Alat gambar</a><a href="#cara-kerja">Cara kerja</a><a href="/privasi">Privasi</a></nav>
        <a className="top-cta" href="#alat">Mulai gratis <ArrowRight size={15}/></a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14}/> TOOLKIT GAMBAR ONLINE</div>
          <h1>Gambar lebih ringan.<br/><span>Urusan lebih mudah.</span></h1>
          <p>Kompres, konversi, dan ubah ukuran gambar dalam beberapa klik. Gratis, tanpa instal aplikasi, tanpa perlu mengunggah file ke server.</p>
          <div className="hero-actions"><a href="#alat" className="primary-btn">Coba alat gratis <ArrowRight size={17}/></a><div className="privacy-note"><LockKeyhole size={15}/> File tetap di perangkatmu</div></div>
          <div className="hero-stats"><div><strong>100%</strong><span>Gratis digunakan</span></div><div><strong>0 upload</strong><span>Diproses di browser</span></div><div><strong>Instan</strong><span>Tanpa instalasi</span></div></div>
        </div>
        <div className="hero-art" aria-label="Ilustrasi file gambar">
          <div className="art-glow"></div><div className="floating-chip chip-one"><Zap size={15}/> Ukuran lebih kecil</div>
          <div className="image-card"><div className="image-card-top"><span></span><span></span><span></span><small>image-final.webp</small></div><div className="image-landscape"><div className="sun"></div><div className="mountain mountain-back"></div><div className="mountain mountain-front"></div><div className="field"></div></div><div className="image-card-bottom"><div><small>Ukuran file</small><strong>2.4 MB <span>→</span> 480 KB</strong></div><span className="saved-pill">−80%</span></div></div>
          <div className="floating-chip chip-two"><Check size={15}/> Siap diunduh</div>
        </div>
      </section>

      <section className="tool-section" id="alat">
        <div className="section-heading"><div><div className="eyebrow">PILIH ALAT</div><h2>Semua yang kamu butuhkan.</h2><p>Alat praktis untuk kebutuhan gambar sehari-hari.</p></div><span className="free-label"><Check size={14}/> Gratis, tanpa akun</span></div>
        <div className="tool-grid">{tools.map(t => { const Icon = t.icon; return <button key={t.id} className={"tool-card " + (mode === t.id ? "active" : "")} onClick={() => { setMode(t.id); setResult(null); setError(""); }}><span className="tool-icon"><Icon size={22}/></span><span className="tool-title">{t.title}</span><span className="tool-desc">{t.desc}</span><span className="tool-arrow"><ArrowRight size={17}/></span></button>; })}</div>

        <div className="workspace">
          <div className="workspace-heading"><div><span className="step-number">01</span><div><h3>{tools.find(t => t.id === mode).title}</h3><p>Tambahkan gambar untuk mulai mengolah.</p></div></div>{file && <button className="text-button" onClick={reset}><X size={15}/> Hapus file</button>}</div>
          {!file ? <button className="dropzone" onClick={() => inputRef.current?.click()} onDragOver={e => {e.preventDefault(); e.currentTarget.classList.add("dragging");}} onDragLeave={e => e.currentTarget.classList.remove("dragging")} onDrop={e => {e.preventDefault();e.currentTarget.classList.remove("dragging");loadFile(e.dataTransfer.files?.[0]);}}><span className="upload-icon"><ImagePlus size={25}/></span><strong>Klik untuk pilih gambar</strong><span>atau seret dan lepaskan file di sini</span><small>JPG, PNG, WebP, GIF, BMP · Maks. 25 MB</small></button> : <div className="editor">
            <div className="file-preview"><img ref={imageRef} src={preview} alt="Pratinjau gambar yang dipilih"/><div className="file-meta"><strong>{file.name}</strong><span>{prettyBytes(file.size)} · {imageRef.current?.naturalWidth || width} × {imageRef.current?.naturalHeight || height} px</span></div></div>
            <div className="settings">
              {mode === "resize" && <><label>Lebar (px)<input type="number" min="1" max="10000" value={width} onChange={e => updateWidth(e.target.value)}/></label><label>Tinggi (px)<input type="number" min="1" max="10000" value={height} onChange={e => updateHeight(e.target.value)}/></label><label className="check-label"><input type="checkbox" checked={keepRatio} onChange={e => setKeepRatio(e.target.checked)}/> Pertahankan rasio gambar</label></>}
              <label>Format hasil<select value={format} onChange={e => setFormat(e.target.value)}><option value="image/webp">WebP — ukuran kecil</option><option value="image/jpeg">JPG — kompatibel luas</option><option value="image/png">PNG — dukung transparansi</option><option value="image/x-icon">ICO — ikon / favicon</option><option value="application/pdf">PDF — dokumen</option></select></label>
              <label className="quality-label"><span>Kualitas <b>{quality}%</b></span><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))}/><span className="range-labels"><small>File lebih kecil</small><small>Detail lebih tinggi</small></span></label>
              <button className="primary-btn process-btn" onClick={processImage} disabled={busy}>{busy ? "Memproses gambar..." : "Proses gambar"} <ArrowRight size={17}/></button>
            </div>
          </div>}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp" hidden onChange={e => loadFile(e.target.files?.[0])}/>
          {error && <p className="error-message" role="alert">{error}</p>}
          {result && <div className="result-box"><div className="result-head"><span className="success-icon"><Check size={18}/></span><div><strong>Gambar berhasil diproses!</strong><p>{result.width} × {result.height} px · {result.type.replace("image/","").toUpperCase()}</p></div></div><div className="result-stats"><div><small>Ukuran awal</small><strong>{prettyBytes(result.originalSize)}</strong></div><ArrowRight size={17}/><div><small>Ukuran hasil</small><strong>{prettyBytes(result.size)}</strong></div><span className="saved-pill">{result.size <= result.originalSize ? "-" + saved + "%" : "+" + Math.round((result.size/result.originalSize-1)*100) + "%"}</span></div><a className="primary-btn download-btn" href={result.url} download={result.name}><ArrowDownToLine size={17}/> Unduh gambar</a></div>}
          <div className="workspace-foot"><ShieldCheck size={16}/> Gambar diproses di perangkatmu dan tidak dikirim ke server.</div>
        </div>
      </section>

      <section className="how-section" id="cara-kerja"><div className="eyebrow">MUDAH BANGET</div><h2>Tiga langkah. Selesai.</h2><div className="steps"><div><span>01</span><h3>Pilih gambar</h3><p>Ambil file dari perangkatmu. Tidak perlu membuat akun.</p></div><div><span>02</span><h3>Atur hasilnya</h3><p>Pilih format, kualitas, atau ukuran sesuai kebutuhan.</p></div><div><span>03</span><h3>Unduh hasil</h3><p>Simpan hasil olahan langsung ke perangkatmu.</p></div></div></section>

      <section className="faq-section"><div className="eyebrow">FAQ</div><h2>Pertanyaan umum</h2><details><summary>Apakah FileKecil gratis?</summary><p>Ya. Semua alat yang tersedia saat ini dapat digunakan gratis tanpa akun.</p></details><details><summary>Apakah gambar saya diunggah ke server?</summary><p>Tidak. Pemrosesan gambar dilakukan secara lokal di browser. File asli tidak dikirim ke server oleh alat ini.</p></details><details><summary>Format apa yang didukung?</summary><p>File masukan yang didukung adalah JPG, PNG, WebP, GIF, dan BMP. Hasil dapat disimpan sebagai WebP, JPG, PNG, ICO, atau PDF. GIF yang diproses menjadi gambar statis akan menggunakan frame yang ditampilkan browser.</p></details><details><summary>Kenapa ukuran hasil kadang lebih besar?</summary><p>Hasil bergantung pada format, kualitas, dan isi gambar. Coba WebP atau turunkan pengaturan kualitas untuk ukuran yang lebih kecil.</p></details></section>

      <footer><a href="/" className="brand"><span className="brand-mark"><FileImage size={19}/></span><span>filekecil<span className="brand-dot">.</span></span></a><span>Alat gambar praktis. File tetap milikmu.</span><div><a href="/privasi">Kebijakan privasi</a><a href="mailto:halo@filekecil.id">Kontak</a></div></footer>
    </main>
  );
}
