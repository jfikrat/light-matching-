"use client";

import { useEffect, useMemo, useState } from "react";

const TEMPLATES = [
  { label: "Studio lighting", value: "studio lighting" },
  { label: "Street photography", value: "street photography" },
  { label: "Cut-out (white bg)", value: "cut-out" },
  { label: "Outdoor fashion", value: "outdoor fashion" },
  { label: "Lifestyle flat lay", value: "lifestyle flat lay" },
];

const ENGINES = [
  { label: "Gemini", value: "gemini" },
  { label: "Seedream Edit", value: "seedream" },
];

export default function Home() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [template, setTemplate] = useState(TEMPLATES[0].value);
  const [count, setCount] = useState(4);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [images, setImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(null); // null = closed
  const [dragOver, setDragOver] = useState(false);
  const [engine, setEngine] = useState(ENGINES[1].value);

  const isGenerateDisabled = useMemo(() => {
    return !imageFile || !template || loading;
  }, [imageFile, template, loading]);

  const MAX_MB = 8;
  const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

  function validateAndSetFile(f) {
    if (!f) {
      setImageFile(null);
      setImagePreview(null);
      return true;
    }
    if (!ALLOWED_TYPES.has(f.type)) {
      setError(`Unsupported file type: ${f.type || 'unknown'}`);
      return false;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large: ${(f.size / (1024 * 1024)).toFixed(2)}MB (max ${MAX_MB}MB)`);
      return false;
    }
    setError("");
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    return true;
  }

  function onFileChange(e) {
    const f = e.target.files?.[0] || null;
    validateAndSetFile(f);
  }

  function clampCount(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return 1;
    return Math.max(1, Math.min(8, Math.trunc(x)));
  }

  function deriveSrc(item) {
    if (!item) return null;
    if (typeof item === "string") {
      if (item.startsWith("http://") || item.startsWith("https://") || item.startsWith("data:")) {
        return item;
      }
      // Assume base64 payload
      return `data:image/png;base64,${item}`;
    }
    if (typeof item === "object") {
      if (typeof item.url === "string") return item.url;
      const b64 = item.b64 || item.base64 || item.image_base64 || item.data;
      if (typeof b64 === "string") return `data:image/png;base64,${b64}`;
      if (typeof item.image === "string") return item.image;
      if (item.image && typeof item.image.url === "string") return item.image.url;
    }
    return null;
  }

  async function readBlobFromSrc(src) {
    // Handles both data URLs and remote URLs
    const res = await fetch(src);
    return await res.blob();
  }

  async function copyImage(src) {
    try {
      if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
        const blob = await readBlobFromSrc(src);
        await navigator.clipboard.write([
          new window.ClipboardItem({ [blob.type || 'image/png']: blob }),
        ]);
        return;
      }
      // Fallback: copy the URL text
      await navigator.clipboard?.writeText?.(src);
    } catch (e) {
      // Last resort: open image in new tab if copy fails
      try { window.open(src, "_blank", "noreferrer"); } catch {}
    }
  }

  async function downloadImage(src, name = `image-${Date.now()}.png`) {
    try {
      const blob = await readBlobFromSrc(src);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback: try opening in a new tab
      try { window.open(src, "_blank", "noreferrer"); } catch {}
    }
  }

  function closeViewer() {
    setViewerIndex(null);
  }

  useEffect(() => {
    if (viewerIndex === null) return;
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeViewer();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setViewerIndex((i) => (i === null ? null : Math.min(images.length - 1, i + 1)));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setViewerIndex((i) => (i === null ? null : Math.max(0, i - 1)));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerIndex, images.length]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setPrompts([]);
    setImages([]);

    if (!imageFile) {
      setError("Please choose a product image.");
      return;
    }

    const fd = new FormData();
    fd.append("template", template);
    fd.append("count", String(clampCount(count)));
    fd.append("engine", engine);
    if (description) fd.append("productDescription", description);
    fd.append("image", imageFile);

    try {
      setLoading(true);
      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      setPrompts(Array.isArray(data?.prompts) ? data.prompts : []);
      setImages(Array.isArray(data?.images) ? data.images : []);
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    validateAndSetFile(f);
    setDragOver(false);
  }

  function onDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDragEnter(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    setDragOver(false);
  }

  return (
    <main className="container">
      <h1 className="title">Light Matching</h1>
      <p className="subtitle">Upload a product photo, pick a template, and generate AI‑stylized images.</p>

      <form onSubmit={onSubmit} className="card translucent" style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label className="label" htmlFor="image">Product image</label>
          <div
            className={`drop-zone${dragOver ? ' dragover' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
          >
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={onFileChange}
            />
            <div className="actions" style={{ marginTop: 12 }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="thumb" />
              ) : (
                <div className="thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>
                  No image
                </div>
              )}
              <div className="hint">
                Drag & drop an image here, or use the file picker.
                <div>Allowed: PNG, JPG, WEBP. Max {MAX_MB}MB. Max 8 outputs per run.</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div className="field">
            <label className="label" htmlFor="template">Template</label>
            <select
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="engine">Engine</label>
            <select id="engine" value={engine} onChange={(e)=>setEngine(e.target.value)}>
              {ENGINES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label htmlFor="count">Count (1–8)</label>
            <input
              id="count"
              type="number"
              min={1}
              max={8}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              style={{ width: 100 }}
            />
          </div>

          <div style={{ flex: 1, display: "grid", gap: 6 }}>
            <label htmlFor="desc">Product description (optional)</label>
            <input
              id="desc"
              type="text"
              placeholder="e.g., black leather boots with chunky sole"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="submit" disabled={isGenerateDisabled}>
            {loading ? "Generating…" : "Generate"}
          </button>
          {error ? (
            <span style={{ color: "#b00020" }}>{error}</span>
          ) : null}
        </div>
      </form>

      {prompts.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Prompts</h2>
          <ul style={{ paddingLeft: 16 }}>
            {prompts.map((p, i) => (
              <li key={i} style={{ marginBottom: 4, color: "#333" }}>
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {images.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 className="section-title">Results</h2>
          <div className="results-grid">
            {images.map((img, i) => {
              const src = deriveSrc(img);
              if (!src) return (
                <div key={i} style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 12,
                  color: "#666",
                  wordBreak: "break-all",
                }}>
                  Unsupported image format
                </div>
              );
              return (
                <figure key={i} className="image-card">
                  <img src={src} alt={`Generated ${i + 1}`} onClick={() => setViewerIndex(i)} />
                  <figcaption className="caption">
                    <div className="actions">
                      <button className="btn" type="button" onClick={() => setViewerIndex(i)} title="View full screen">Fullscreen</button>
                      <button className="btn" type="button" onClick={() => copyImage(src)} title="Copy image">Copy</button>
                      <button className="btn" type="button" onClick={() => downloadImage(src, `image-${i + 1}.png`)} title="Download">Download</button>
                    </div>
                    <a href={src} target="_blank" rel="noreferrer" className="muted">Open</a>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      )}
      {viewerIndex !== null && images[viewerIndex] && (
        <div className="viewer" onClick={closeViewer}>
          <img
            src={deriveSrc(images[viewerIndex])}
            alt={`Full ${viewerIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="viewer-actions" onClick={(e) => e.stopPropagation()}>
            <button className="btn" type="button" onClick={() => copyImage(deriveSrc(images[viewerIndex]))}>Copy</button>
            <button className="btn" type="button" onClick={() => downloadImage(deriveSrc(images[viewerIndex]), `image-${viewerIndex + 1}.png`)}>Download</button>
            <button className="btn btn-primary" type="button" onClick={closeViewer}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
