/** Static fallback for حراج السعادة logo. Never render the old cart icon. */
export function BrandLogo({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/site-logo.png"
      alt="حراج السعادة"
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      className="h-full w-full object-contain"
    />
  );
}
