/**
 * JSON replacer function that converts complex data types to JSON-serializable equivalents.
 *
 * Wire into Express globally via `app.set('json replacer', jsonReplacer)` to apply
 * to all `res.json()` calls, or pass directly to `JSON.stringify` for manual use.
 *
 * @param key - The key of the current value being serialized (empty string for the root object)
 * @param value - The value being serialized
 * @returns A JSON-serializable representation of the value
 *
 * @example
 * // Express global usage
 * app.set('json replacer', jsonReplacer);
 *
 * @example
 * // Manual usage
 * JSON.stringify(data, jsonReplacer);
 */
export function jsonReplacer(key: string, value: unknown): unknown {
  if (value instanceof Map) return Object.fromEntries(value);
  if (value instanceof Set) return [...value];
  if (value instanceof Error)
    return { name: value.name, message: value.message, stack: value.stack };

  return value;
}
