const MINOR_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'el', 'a', 'en', 'san', 'santa']);

export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, index) => {
      if (index > 0 && MINOR_WORDS.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
