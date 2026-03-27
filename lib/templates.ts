import { marked } from "marked";

/** Trim a template string; return undefined if empty. */
export function normalizeTemplate(
  input: string | undefined,
): string | undefined {
  const trimmed = input?.trim();
  return trimmed ? trimmed : undefined;
}

/** Mustache-style `{{var}}` substitution. Unknown keys become empty strings. */
export function renderTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return variables[key] ?? "";
  });
}

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false, breaks: true }) as string;
}

/** Strip markdown syntax to produce readable plain text. */
export function markdownToText(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~>#-]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
