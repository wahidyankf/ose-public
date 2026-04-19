export function filterItems<T>(items: T[], searchTerm: string, keys: (keyof T)[]): T[] {
  if (!searchTerm) return items;

  const lowercasedTerm = searchTerm.toLowerCase();

  return items.filter((item) =>
    keys.some((key) => {
      const value = item[key];
      if (typeof value === "string") {
        return value.toLowerCase().includes(lowercasedTerm);
      }
      if (Array.isArray(value)) {
        return value.some((v) => (typeof v === "string" ? v.toLowerCase().includes(lowercasedTerm) : false));
      }
      return false;
    }),
  );
}
