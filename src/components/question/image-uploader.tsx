"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Image as ImageIcon, Upload, Trash2, AlertCircle } from "lucide-react";

export interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = React.useState(value || "");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setUrlInput(value || "");
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB limit. Please upload an image under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image.");
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    } else {
      onChange(null);
    }
  };

  return (
    <div className="space-y-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
          Question Diagram / Geometry / Visual Reasoning
        </span>
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-2 py-0.5 rounded ${
              mode === "file" ? "bg-violet-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded ${
              mode === "url" ? "bg-violet-600 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            Image Link
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value ? (
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Attached diagram"
            className="w-16 h-16 object-contain rounded-lg border border-slate-700 bg-black/40"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-emerald-400 truncate font-semibold">Image Attached</p>
            <p className="text-[11px] text-slate-400 truncate">{value}</p>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onChange(null)}
            className="text-xs h-7 px-2"
            title="Remove Image"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : mode === "file" ? (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-xs border-dashed border-slate-700 py-4 h-auto gap-2 text-slate-300 hover:border-violet-500 hover:text-white"
          >
            <Upload className="w-4 h-4 text-violet-400" />
            Upload Diagram (PNG, JPG, SVG, WebP up to 5MB)
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/geometry-diagram.png"
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500"
          />
          <Button type="button" size="sm" variant="secondary" onClick={handleUrlSubmit} className="text-xs h-8">
            Attach Link
          </Button>
        </div>
      )}
    </div>
  );
}
