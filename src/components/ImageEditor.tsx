import { useEffect, useState } from "react";
import { Loader2, RotateCcw, RotateCw, Sparkles, Check, X, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface ImageEditorProps {
  /** The file currently being edited, or null when the dialog is closed. */
  file: File | null;
  open: boolean;
  onClose: () => void;
  /** Called with the edited file when the user applies their changes. */
  onApply: (file: File) => void;
  /** When provided, shows a "make cover" action. */
  onMakeCover?: () => void;
  /** Whether the current image is already the cover. */
  isCover?: boolean;
}

/** Render a rotated copy of the full image to a new File (no cropping). */
async function getRotatedFile(src: string, rotation: number, fileName: string): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const rad = (rotation * Math.PI) / 180;
  const bBoxW = Math.abs(Math.cos(rad) * image.width) + Math.abs(Math.sin(rad) * image.height);
  const bBoxH = Math.abs(Math.sin(rad) * image.width) + Math.abs(Math.cos(rad) * image.height);

  const canvas = document.createElement("canvas");
  canvas.width = bBoxW;
  canvas.height = bBoxH;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(bBoxW / 2, bBoxH / 2);
  ctx.rotate(rad);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  const isPng = fileName.toLowerCase().endsWith(".png");
  const type = isPng ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), type, 0.92));
  const newName = fileName.replace(/\.[^.]+$/, "") + (isPng ? ".png" : ".jpg");
  return new File([blob], newName, { type });
}

export default function ImageEditor({ file, open, onClose, onApply, onMakeCover, isCover }: ImageEditorProps) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [src, setSrc] = useState<string>("");
  const [rotation, setRotation] = useState(0);
  const [working, setWorking] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);

  useEffect(() => {
    if (!file) {
      setSrc("");
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setRotation(0);
    setBgRemoved(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleRemoveBg = async () => {
    if (!file) return;
    setRemovingBg(true);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      // Apply current rotation first so removal acts on the visible image.
      let input: Blob = file;
      if (rotation !== 0) {
        input = await getRotatedFile(src, rotation, file.name);
      }
      const blob = await removeBackground(input);
      const url = URL.createObjectURL(blob);
      setSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setRotation(0);
      setBgRemoved(true);
    } catch (e) {
      console.error("background removal failed", e);
    } finally {
      setRemovingBg(false);
    }
  };

  const handleApply = async () => {
    if (!file) return;
    setWorking(true);
    try {
      const name = bgRemoved ? file.name.replace(/\.[^.]+$/, ".png") : file.name;
      const result = await getRotatedFile(src, rotation, name);
      onApply(result);
      onClose();
    } catch (e) {
      console.error("apply edit failed", e);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ar ? "تعديل الصورة" : "Edit image"}</DialogTitle>
        </DialogHeader>

        <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
          {src && (
            <img
              src={src}
              alt=""
              className="max-h-full max-w-full object-contain transition-transform"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
          {(removingBg || working) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setRotation((r) => r - 90)}>
            <RotateCcw className="h-4 w-4" /> {ar ? "تدوير" : "Rotate"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setRotation((r) => r + 90)}>
            <RotateCw className="h-4 w-4" /> {ar ? "تدوير" : "Rotate"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRemoveBg}
            disabled={removingBg || working}
          >
            {removingBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {ar ? "إزالة الخلفية بالذكاء الاصطناعي" : "Remove background (AI)"}
          </Button>
          {onMakeCover && (
            <Button
              type="button"
              variant={isCover ? "default" : "outline"}
              size="sm"
              onClick={onMakeCover}
              disabled={isCover}
            >
              <Star className="h-4 w-4" />
              {isCover ? (ar ? "صورة الغلاف" : "Cover image") : ar ? "اجعلها صورة الغلاف" : "Make cover"}
            </Button>
          )}
        </div>
        {removingBg && (
          <p className="text-xs text-muted-foreground">
            {ar ? "قد تستغرق إزالة الخلفية بضع ثوانٍ..." : "Background removal may take a few seconds..."}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={working || removingBg}>
            <X className="h-4 w-4" /> {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="button" onClick={handleApply} disabled={working || removingBg}>
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {ar ? "حفظ التعديل" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
