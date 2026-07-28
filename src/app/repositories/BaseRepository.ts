/**
 * Generic Base Repository providing typesafe Snake <-> Camel conversions
 * eliminates untyped 'any' in database transformation layers.
 */

function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeToCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function toCamelGeneric<T>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamelGeneric<unknown>(v)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
      const camelKey = snakeToCamelCase(key);
      (acc as Record<string, unknown>)[camelKey] = toCamelGeneric((obj as Record<string, unknown>)[key]);
      return acc;
    }, {} as Record<string, unknown>) as T;
  }
  return obj as T;
}

export function toSnakeGeneric<T>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => toSnakeGeneric<unknown>(v)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
      const snakeKey = camelToSnakeCase(key);
      (acc as Record<string, unknown>)[snakeKey] = toSnakeGeneric((obj as Record<string, unknown>)[key]);
      return acc;
    }, {} as Record<string, unknown>) as T;
  }
  return obj as T;
}
