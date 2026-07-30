export interface BlockLike {
  type: string;
  [key: string]: unknown;
}

// Block type keys are namespaced `<namespace>::block::<name>`. Split one into its parts; an
// unrecognised shape has no namespace and keeps the whole string as its name.
const DEFAULT_NAMESPACE = "webkontrol";
export interface BlockTypeParts {
  namespace: string | null;
  name: string;
}
export function blockTypeParts(type: string): BlockTypeParts {
  const match = /^(.+)::block::(.+)$/.exec(type);
  if (!match) return { namespace: null, name: type };
  return { namespace: match[1], name: match[2] };
}

// A block's friendly label: drop the `::block::` segment, and the namespace too when it's the
// default one, so `webkontrol::block::grid` shows as `grid`, while a foreign `acme::block::grid`
// keeps its namespace as `acme::grid`.
export function blockLabel(type: string): string {
  const { namespace, name } = blockTypeParts(type);
  if (namespace === null) return type;
  return namespace === DEFAULT_NAMESPACE ? name : `${namespace}::${name}`;
}

// Duck-typed: any object with a string `type` is treated as a (child) block.
export function isBlock(v: unknown): v is BlockLike {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    typeof (v as { type?: unknown }).type === "string"
  );
}

// Collect the blocks reachable from a value *without descending through a block*: a block is
// returned as-is (its own children are walked later by the tree), while plain objects and arrays
// are searched for blocks nested inside them. This finds blocks tucked into wrapper objects, e.g.
// freeform's `items[].block`. Scalars are skipped — this is a blocks-only view.
// TODO: replace with a schema-driven walk over BLOCK_SLOT_META once the block registry lands (#8).
function collectBlocks(
  value: unknown,
  key: string,
  out: { key: string; block: BlockLike }[],
): void {
  if (isBlock(value)) {
    out.push({ key, block: value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectBlocks(item, `${key}[${i}]`, out));
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const [k, v] of Object.entries(value)) collectBlocks(v, `${key}.${k}`, out);
  }
}

// A block's child blocks, wherever they're nested within its config.
export function childBlocks(block: BlockLike): { key: string; block: BlockLike }[] {
  const out: { key: string; block: BlockLike }[] = [];
  for (const [key, value] of Object.entries(block)) {
    if (key === "type") continue;
    collectBlocks(value, key, out);
  }
  return out;
}

// The block whose children include `target`, searched from `root`. Null when `target` is the root
// itself or isn't found. Matches by reference, so `target` must come from `root`'s own tree.
export function findParent(root: BlockLike, target: BlockLike): BlockLike | null {
  for (const { block } of childBlocks(root)) {
    if (block === target) return root;
    const found = findParent(block, target);
    if (found !== null) return found;
  }
  return null;
}
