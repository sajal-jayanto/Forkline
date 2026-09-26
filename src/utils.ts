export const createSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
export const demoUrl = "https://media.istockphoto.com/id/2191357941/vector/grunge-red-demo-version-word-rubber-seal-stamp-on-white-background.jpg"
export const demoDescription="Fresh and delicious product made with high-quality ingredients for a satisfying taste. Perfect for everyday meals, snacks, or sharing with family and friends."
export const demoLocation = "Dhaka, Bangladesh"

export const toCents = (amount: string) => Math.round(Number(amount) * 100);
export const toAmount = (cents: number) => (cents / 100).toFixed(2);