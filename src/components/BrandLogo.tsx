import { ShoppingCart, Smile } from "lucide-react";

/** حراج السعادة logo: a smile inside a shopping cart. */
export function BrandLogo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <ShoppingCart className="text-primary" style={{ width: size, height: size }} strokeWidth={2} />
      <Smile
        className="absolute text-accent"
        style={{ width: size * 0.42, height: size * 0.42, top: size * 0.18, left: size * 0.22 }}
        strokeWidth={2.5}
      />
    </span>
  );
}
