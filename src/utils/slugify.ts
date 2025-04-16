/**
 * Convert a string to a URL-friendly slug
 * @param text - The text to convert to a slug
 * @returns The slug
 */
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Normalize to decomposed form for handling accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s-]/g, '') // Remove non-word characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores and hyphens with a single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
    .trim(); // Trim any whitespace
};

export default slugify; 