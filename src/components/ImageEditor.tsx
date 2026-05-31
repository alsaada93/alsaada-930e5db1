import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Loader2, RotateCcw, RotateCw, Scissors, Sparkles, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface ImageEditorProps {
  /** The file currently being edited, or null when the dialog is closed. */
  file: File | null;
  open: boolean;
  onClose: () => void;
  /** Called with the edited file when the user applies their changes. */
  onApply: (file: File) => void;
}

/** Render a cropped + rotated region of an image to a new File. */
async function getCroppedFile(
  src: string,
  crop: Area,
  rotation: number,
  fileName: string,
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const rad = (rotation * Math.PI) / 180;
  // Bounding box of the rotated image
  const bBoxW = Math.abs(Math.cos(rad) * image.width) + Math.abs(Math.sin(rad) * image.height);
  const bBoxH = Math.abs(Math.sin(rad) * image.width) + Math.abs(Math.cos(rad) * image.height);

  const tmp = document.createElement("canvas");
  tmp.width = bBoxW;
  tmp.height = bBoxH;
  const tctx = tmp.getContext("2d")!;
  tctx.translate(bBoxW / 2, bBoxH / 2);
  tctx.rotate(rad);
  tctx.drawImage(image, -image.width / 2, -image.height / 2);

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(tmp, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  const isPng = fileName.toLowerCase().endsWith(".png");
  const type = isPng ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), type, 0.92),
  );
  const newName = fileName.replace(/\.[^.]+$/, "") + (isPng ? ".png" : ".jpg");
  return new File([blob], newName, { type });
}

export default function ImageEditor({ file, open, onClose, onApply }: ImageEditorProps) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [src, setSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);

  // Build an object URL for the source file.
  useEffect(() => {
    if (!file) {
      setSrc("");
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  const handleRemoveBg = async () => {
    if (!file) return;
    setRemovingBg(true);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      // Apply current crop/rotation first so removal acts on the visible image.
      let input: Blob = file;
      if (areaPixels && (rotation !== 0 || zoom !== 1)) {
        input = await getCroppedFile(src, areaPixels, rotation, file.name);
      }
      const blob = await removeBackground(input);
      const url = URL.createObjectURL(blob);
      setSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    } catch (e) {
      console.error("background removal failed", e);
    } finally {
      setRemovingBg(false);
    }
  };

  const handleApply = async () => {
    if (!file || !areaPixels) return;
    setWorking(true);
    try {
      // PNG keeps transparency from background removal.
      const name = src.startsWith("blob:") && removingBg ? file.name.replace(/\.[^.]+$/, ".png") : file.name;
      const result = await getCroppedFile(src, areaPixels, rotation, name);
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

        <div className="relative h-80 w-full overflow-hidden rounded-lg bg-muted">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              restrictPosition={false}
            />
          )}
          {(removingBg || working) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              {ar ? "تكبير" : "Zoom"}
            </label>
            <Slider value={[zoom]} min={1} max={3} step={0.01} onValueChange={(v) => setZoom(v[0])} />
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
          </div>
          {removingBg && (
            <p className="text-xs text-muted-foreground">
              {ar ? "قد تستغرق إزالة الخلفية بضع ثوانٍ..." : "Background removal may take a few seconds..."}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={working || removingBg}>
            <X className="h-4 w-4" /> {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="button" onClick={handleApply} disabled={working || removingBg || !areaPixels}>
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {ar ? "حفظ التعديل" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
