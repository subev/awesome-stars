const IMAGE_URL = /\.(?:png|jpe?g|gif|svg|webp|bmp|ico)(?:[?#].*)?$/i;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const linkTarget = (target: string) => {
  const trimmed = target.trim();
  if (trimmed.startsWith("*")) return `#${slugify(trimmed.slice(1))}`;
  return trimmed.replace(/^file:/, "");
};

const renderLink = (target: string, description?: string) => {
  const href = linkTarget(target);
  if (description === undefined) {
    return IMAGE_URL.test(href) ? `![](${href})` : `[${href}](${href})`;
  }
  const label = IMAGE_URL.test(description)
    ? `![](${description})`
    : description;
  return `[${label}](${href})`;
};

const LINK = /\[\[([^\]]+?)\](?:\[([^\]]*?)\])?\]/g;
// Emphasis needs a delimiter on both sides — a lone `/` cell stays literal.
const VERBATIM =
  /(^|[\s(\-'"{|])([=~])(\S(?:[^\n]*?\S)?)\2(?=[\s.,;:!?'")}\]|-]|$)/g;
const EMPHASIS =
  /(^|[\s(\-'"{|])([*/])(\S(?:[^\n]*?\S)?)\2(?=[\s.,;:!?'")}\]|-]|$)/g;
// Links park behind a sentinel so the emphasis pass can't see `*` and `/` in urls.
const PLACEHOLDER = /\uE000(\d+)\uE001/g;

const inline = (text: string) => {
  const kept: string[] = [];
  const keep = (value: string) => `\uE000${kept.push(value) - 1}\uE001`;

  const converted = text
    .replace(LINK, (_m, target: string, description?: string) =>
      keep(renderLink(target, description)),
    )
    .replace(VERBATIM, (_m, before: string, _marker: string, body: string) =>
      body.includes("`")
        ? `${before}${body}`
        : `${before}${keep(`\`${body}\``)}`,
    )
    .replace(
      EMPHASIS,
      (_m, before: string, marker: string, body: string) =>
        `${before}${marker === "*" ? `**${body}**` : `*${body}*`}`,
    );

  return converted.replace(PLACEHOLDER, (_m, index: string) => kept[+index]);
};

const cellsOf = (row: string) =>
  row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");

const isTableRow = (line: string) => /^\s*\|/.test(line);
const isTableRule = (line: string) =>
  /^\s*\|[-+|\s]*\|?\s*$/.test(line) && line.includes("-");

// Org puts rules anywhere to group rows; GFM allows exactly one, right after
// the header — so extra rules are dropped and repeated headers become rows.
const convertTable = (block: string[]) => {
  const rows = block.filter((line) => !isTableRule(line)).map(cellsOf);
  if (rows.length === 0) return [];
  const render = (cells: string[]) =>
    `| ${cells.map((cell) => inline(cell.trim())).join(" | ")} |`;
  return [
    render(rows[0]),
    `|${" --- |".repeat(rows[0].length)}`,
    ...rows.slice(1).map(render),
  ];
};

const convertLine = (line: string) => {
  const heading = /^(\*+)\s+(.*)$/.exec(line);
  if (heading) {
    const text = heading[2].replace(/\s+:[\w@#%:]+:$/, "");
    return `${"#".repeat(heading[1].length)} ${inline(text)}`;
  }
  const numbered = /^(\s*)(\d+)\)\s/.exec(line);
  const normalized = numbered
    ? `${numbered[1]}${numbered[2]}. ${line.slice(numbered[0].length)}`
    : line;
  return inline(normalized).replace(
    /^(\s*[-+*]\s+)(.+?)\s+::\s+/,
    "$1**$2** — ",
  );
};

const ORG_KEYWORD = /^[ \t]*#\+\w+[:[ \t]/m;
const ORG_TABLE_RULE = /^[ \t]*\|[-+]{3,}[-+|]*\|?[ \t]*$/m;
const ORG_LINK = /\[\[[^\]\n]+\]\[[^\]\n]*\]\]/;
const ORG_HEADING = /^\*+ \S/m;
const MARKDOWN = /^#{1,6} \S|\]\(https?:/m;

// The GitHub API serves the README without its file name, so the format has to
// come off the content: `#+keyword` lines are unambiguous, while the weaker
// signals only count when nothing in the file reads as Markdown.
export const looksLikeOrg = (text: string) =>
  ORG_KEYWORD.test(text) ||
  (!MARKDOWN.test(text) &&
    (ORG_TABLE_RULE.test(text) ||
      (ORG_LINK.test(text) && ORG_HEADING.test(text))));

const BLOCK_START = /^\s*#\+begin_(\w+)\s*(.*)$/i;
const BLOCK_END = /^\s*#\+end_(\w+)/i;
const KEYWORD = /^\s*#\+(\w+):\s*(.*)$/;

export const orgToMarkdown = (org: string): string => {
  const lines = org.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    const blockStart = BLOCK_START.exec(line);
    if (blockStart) {
      const kind = blockStart[1].toLowerCase();
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !BLOCK_END.test(lines[index])) {
        body.push(lines[index]);
        index += 1;
      }
      index += 1;
      if (kind === "src" || kind === "example") {
        const language = kind === "src" ? blockStart[2].split(/\s+/)[0] : "";
        out.push(`\`\`\`${language}`, ...body, "```");
      } else if (kind === "quote") {
        out.push(...body.map((entry) => `> ${inline(entry)}`));
      } else if (kind === "export") {
        out.push(...body);
      } else {
        out.push(...body.map(convertLine));
      }
      continue;
    }

    if (/^\s*:PROPERTIES:\s*$/i.test(line)) {
      while (index < lines.length && !/^\s*:END:\s*$/i.test(lines[index])) {
        index += 1;
      }
      index += 1;
      continue;
    }

    const keyword = KEYWORD.exec(line);
    if (keyword) {
      if (keyword[1].toLowerCase() === "title" && keyword[2].trim()) {
        out.push(`# ${inline(keyword[2].trim())}`);
      }
      index += 1;
      continue;
    }

    if (/^#(\s|$)/.test(line)) {
      index += 1;
      continue;
    }

    if (isTableRow(line)) {
      const block: string[] = [];
      while (index < lines.length && isTableRow(lines[index])) {
        block.push(lines[index]);
        index += 1;
      }
      out.push(...convertTable(block));
      continue;
    }

    out.push(convertLine(line));
    index += 1;
  }

  return out.join("\n");
};
