/**
 * The message from a caught value. `catch` binds `unknown`, and a thrown value
 * is not guaranteed to be an Error, so anything else falls back to its string form.
 *
 * @param error - The caught value
 * @param fallback - Used when the value carries no usable message
 * @returns A message safe to log or show to the user
 *
 * @example
 * catch (error) {
 *   res.status(500).json({ error: errorMessage(error, "Failed to update view") });
 * }
 */
// TODO: Move to common/helpers
export function errorMessage(error: unknown, fallback = "Unknown error"): string {
  if (error instanceof Error) return error.message || fallback;
  return String(error) || fallback;
}
