import { marked } from "marked";

/** Trim a template string; return undefined if empty. */
export function normalizeTemplate(
  input: string | undefined,
): string | undefined {
  const trimmed = input?.trim();
  return trimmed || undefined;
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
  // URLs are parked behind placeholders first: marker removal below would
  // otherwise eat the hyphens out of UUID slugs and base64url unsubscribe tokens.
  const urls: string[] = [];
  const stash = (url: string) => `@@U${urls.push(url) - 1}@@`;

  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => `${text} (${stash(url)})`)
    .replace(/\bhttps?:\/\/\S+/g, stash)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[ \t]{0,3}(?:[-*_][ \t]*){3,}$/gm, "")
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, "")
    .replace(/^[ \t]*>[ \t]?/gm, "")
    .replace(/^([ \t]*)[-*+][ \t]+/gm, "$1- ")
    .replace(/(\*\*|__|~~)([\s\S]+?)\1/g, "$2")
    .replace(/(?<![\w*_])([*_])(?=\S)([\s\S]*?\S)\1(?![\w*_])/g, "$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .replace(/@@U(\d+)@@/g, (_, i) => urls[Number(i)]);
}
