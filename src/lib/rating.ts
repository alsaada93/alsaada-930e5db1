/**
 * تقييم عشوائي ثابت لكل إعلان بين 3.0 و 4.5 نجوم.
 * يعتمد على معرّف الإعلان حتى لا يتغيّر التقييم عند كل إعادة رسم.
 */
export function listingRating(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  // 16 خطوة بين 3.0 و 4.5 بمقدار 0.1
  const steps = h % 16; // 0..15
  return Math.round((3 + steps * 0.1) * 10) / 10;
}
