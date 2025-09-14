import React, { useRef, useState } from "react";

/**
 * Lê QR a partir de uma foto (ficheiro local).

 */
export default function QRCodeFromPhoto({ onDecoded, buttonLabel = "Ler QR da foto", accept = "image/*" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);

    try {
      // Import dinâmico para contornar o cache de deps do Vite
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();

      const url = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(url);
      URL.revokeObjectURL(url);

      const text = result?.getText ? result.getText() : result?.text;
      if (typeof text === "string" && text.trim()) {
        onDecoded?.(text.trim());
      } else {
        setError("Não consegui ler QR nesta imagem.");
      }
    } catch (err) {
      setError("Não consegui ler o QR. Tenta outra foto (nítida, sem reflexos).");
    } finally {
      setBusy(false);
      // permite re-escolher o mesmo ficheiro
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} hidden />
      <button
        type="button"
        onClick={handlePick}
        className="inline-flex items-center justify-center rounded-md px-4 h-10 border border-gray-300 hover:bg-gray-50"
        disabled={busy}
      >
        {busy ? "A ler…" : buttonLabel}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
