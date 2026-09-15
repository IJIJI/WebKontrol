/** A copy of `array` with the element at `from` moved to `to`. Out-of-range moves return the array unchanged. */
export function arrayMove<T>(array: readonly T[], from: number, to: number): T[] {
  const copy = [...array];
  if (from < 0 || from >= copy.length || to < 0 || to >= copy.length) return copy;
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
