export const POST_CATEGORIES = [
  "Electronics",
  "Accessories",
  "Documents",
  "Books & Notebooks",
  "Bags",
  "Wallets & Cards",
  "Keys",
  "Clothing",
  "Eyewear",
  "School Supplies",
  "Sports Equipment",
  "Water Bottles",
  "Umbrellas",
  "Medical Items",
  "Other",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export function isValidPostCategory(value: string): value is PostCategory {
  return POST_CATEGORIES.includes(value as PostCategory);
}
