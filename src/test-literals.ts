import { parseSync } from "rolldown/experimental";

type Node = { type: string; [key: string]: unknown };

const HAS_LETTER = /\p{L}/u;
const SEVERAL_WORDS = /^[^()\d{}$=;<>]*\p{L}{2,}\s+\p{L}{2,}/u;
const ACCENTED = /[À-ÿ]/;
const TEXT_ATTRIBUTES = new Set([
  "label",
  "placeholder",
  "title",
  "description",
  "aria-label",
  "alt",
  "message",
  "error",
]);
const TEXT_PROPERTIES = new Set([
  "label",
  "placeholder",
  "title",
  "description",
  "message",
  "error",
  "text",
]);
const SKIPPED_NODES = new Set([
  "ImportDeclaration",
  "ExportAllDeclaration",
  "TSLiteralType",
  "TSEnumMember",
  "TSModuleDeclaration",
]);

export type TextLiteral = { line: number; text: string };

function isNode(value: unknown): value is Node {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Node).type === "string"
  );
}

function looksLikeText(value: string): boolean {
  return SEVERAL_WORDS.test(value) || ACCENTED.test(value);
}

function stringOf(node: unknown): string | null {
  if (!isNode(node)) return null;
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (node.type === "TemplateLiteral") {
    const quasis = node.quasis as { value: { cooked: string } }[];
    return quasis.map((quasi) => quasi.value.cooked).join(" ");
  }
  return null;
}

function keyName(node: unknown): string | null {
  if (!isNode(node)) return null;
  if (node.type === "Identifier") return node.name as string;
  if (node.type === "Literal") return String(node.value);
  return null;
}

export function findTextLiterals(path: string, code: string): TextLiteral[] {
  const lang = path.endsWith(".tsx") ? "tsx" : "ts";
  const { program } = parseSync(path, code, { lang });
  const lineStarts = [0];
  for (let index = 0; index < code.length; index += 1) {
    if (code[index] === "\n") lineStarts.push(index + 1);
  }
  const lineOf = (offset: number) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (lineStarts[middle] <= offset) low = middle;
      else high = middle - 1;
    }
    return low + 1;
  };

  const found: TextLiteral[] = [];
  const report = (node: Node, text: string) =>
    found.push({ line: lineOf(node.start as number), text: text.trim() });

  function visit(node: Node, quiet: boolean) {
    if (SKIPPED_NODES.has(node.type)) return;
    if (
      node.type === "NewExpression" &&
      isNode(node.callee) &&
      node.callee.name === "Error"
    )
      return;

    if (node.type === "JSXText") {
      const text = node.value as string;
      if (HAS_LETTER.test(text)) report(node, text);
    }

    if (node.type === "JSXAttribute") {
      const name = isNode(node.name) ? (node.name.name as string) : "";
      const value = node.value;
      const direct = stringOf(value);
      if (
        direct !== null &&
        TEXT_ATTRIBUTES.has(name) &&
        HAS_LETTER.test(direct)
      )
        report(node, direct);
    }

    if (node.type === "Property" && !quiet) {
      const name = keyName(node.key);
      const value = stringOf(node.value);
      if (
        name &&
        value !== null &&
        TEXT_PROPERTIES.has(name) &&
        HAS_LETTER.test(value)
      )
        report(node, value);
    }

    if (
      node.type === "Literal" &&
      typeof node.value === "string" &&
      looksLikeText(node.value)
    ) {
      report(node, node.value);
    }

    if (node.type === "TemplateLiteral") {
      const text = stringOf(node);
      if (text !== null && looksLikeText(text)) report(node, text);
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "parent") continue;
      if (Array.isArray(value)) {
        for (const child of value) if (isNode(child)) visit(child, false);
      } else if (isNode(value)) {
        visit(value, key === "key");
      }
    }
  }

  visit(program as unknown as Node, false);
  const seen = new Set<string>();
  return found.filter((item) => {
    const id = `${item.line}:${item.text}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
