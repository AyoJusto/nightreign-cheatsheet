export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    // Dropped, not spaced: "Night's" has to match the "nights" players type.
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
