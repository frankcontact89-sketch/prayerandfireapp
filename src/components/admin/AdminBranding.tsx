import React, { useEffect, useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { brandLogoChanged, useBrandLogo } from "@/hooks/useBrandLogo";
import { Button } from "@/components/ui/button";

export function AdminBranding() {
  const currentLogo = useBrandLogo();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const save = async () => {
    if (!file || busy) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage("Choose a PNG, JPG or WebP file under 5 MB.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      // Reject corrupt images and non-square artwork before storing the official logo.
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
          const result = { width: image.naturalWidth, height: image.naturalHeight };
          URL.revokeObjectURL(objectUrl);
          resolve(result);
        };
        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("This image cannot be opened. Choose a valid PNG, JPG or WebP."));
        };
        image.src = objectUrl;
      });
      if (dimensions.width !== dimensions.height || dimensions.width < 512) {
        throw new Error("The official logo must be square and at least 512 × 512 pixels.");
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sign in as administrator.");
      const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
      const path = `logos/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("pf-branding").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: writeError } = await supabase.from("app_branding").upsert({ id: "global", logo_path: path, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (writeError) {
        // Do not leave an unused upload behind when the database update fails.
        const { error: cleanupError } = await supabase.storage.from("pf-branding").remove([path]);
        if (cleanupError) console.warn("Could not clean up unused branding upload:", cleanupError.message);
        throw writeError;
      }
      const { data: verified, error: verifyError } = await supabase
        .from("app_branding").select("logo_path").eq("id", "global").single();
      if (verifyError || verified?.logo_path !== path) {
        throw new Error("Logo uploaded, but the saved setting could not be verified. Please refresh and check the current logo.");
      }
      window.dispatchEvent(new Event(brandLogoChanged));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("Logo saved and verified. The app will use it without another build.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update logo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-[#E5BB70]/25 bg-[#180D14] p-4 text-white">
      <div className="flex items-center gap-2 text-[#E5BB70]"><ImageIcon className="h-5 w-5" /><h2 className="text-lg font-semibold">Official Logo</h2></div>
      <p className="text-sm text-zinc-300">Upload a new logo for the app's home screen and Community. This changes the image in the app without publishing another build.</p>
      <div className="flex gap-4 items-center">
        <img src={preview || currentLogo} alt="Current Prayer & Fire logo" className="h-28 w-28 rounded-2xl border border-[#E5BB70]/40 object-cover" />
        <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-[#E5BB70]/45 p-4 text-sm text-[#E5BB70]">
          <UploadCloud className="mb-2 h-6 w-6" /> Choose photo
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event => setFile(event.target.files?.[0] || null)} />
        </label>
      </div>
      {file && <p className="text-xs text-zinc-300">{file.name}</p>}
      <Button type="button" disabled={!file || busy} onClick={() => void save()} className="w-full bg-[#5C061F] text-white hover:bg-[#761233]">{busy ? "Saving…" : "Save official logo"}</Button>
      {message && <p role="status" className="text-sm text-[#E5BB70]">{message}</p>}
      <p className="text-xs text-zinc-400">Note: the iPhone Home Screen app icon is built into iOS and still requires a new TestFlight build to change.</p>
    </section>
  );
}
