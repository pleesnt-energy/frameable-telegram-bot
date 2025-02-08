const MarkdownIt = require("markdown-it");

/**
 * Convert Markdown to Telegram-friendly MarkdownV2.
 * Transforms general Markdown input into MarkdownV2-compliant text.
 */
const markdownToTelegram = (markdown: string): string => {
  const md = new MarkdownIt({
    html: false, // Disable raw HTML
  });

  // Remove HTML wrappers (like <p>) by emptying the rules for paragraphs
  md.renderer.rules.paragraph_open = () => '';
  md.renderer.rules.paragraph_close = () => '';

  // Custom rendering for Telegram MarkdownV2
  md.renderer.rules.strong_open = () => '**'; // Bold
  md.renderer.rules.strong_close = () => '**';

  md.renderer.rules.em_open = () => '__'; // Italic
  md.renderer.rules.em_close = () => '__';

  md.renderer.rules.link_open = (tokens, idx) => '['; // Open link text
  md.renderer.rules.link_close = (tokens, idx) => {
    const href = tokens[idx - 1]?.attrs?.find(([attr]) => attr === 'href')?.[1];
    return href ? `](${escapeTelegramMarkdown(href)})` : ']()'; // If href is missing, fallback to empty
  };

  md.renderer.rules.code_inline = (tokens, idx) => `\`${tokens[idx].content}\``; // Inline code
  md.renderer.rules.code_block = (tokens, idx) => `\`\`\`\n${tokens[idx].content}\n\`\`\``; // Code blocks
  md.renderer.rules.fence = (tokens, idx) => `\`\`\`\n${tokens[idx].content}\n\`\`\``; // Fenced code blocks

  md.renderer.rules.text = (tokens, idx) =>
    escapeTelegramMarkdown(tokens[idx].content); // Escape raw text to ensure Telegram compatibility

  return md.render(markdown).trim(); // Render Markdown to Telegram MarkdownV2
};

/**
 * Escape Telegram MarkdownV2 special characters.
 * Avoids breaking MarkdownV2 formatting rules while preserving structure.
 */
const escapeTelegramMarkdown = (text: string): string => {
  const specialChars = /([_*~`[\](){}>#+\-=|])/g; // Characters to escape

  if (typeof text !== "string") {
    console.warn("Non-string input to escapeTelegramMarkdown:", text);
    return text; // Return non-string input unchanged
  }

  return text.replace(specialChars, (char, index, fullStr) => {
    if (isInsideValidMarkdown(fullStr, index)) {
      return char; // Leave valid Markdown syntax intact
    }
    return `\\${char}`; // Otherwise, escape the character
  });
};

/**
 * Determines whether a character is part of valid Markdown formatting syntax.
 * Designed to avoid over-escaping valid Markdown structures like "**bold**" or "[link](url)".
 */
const isInsideValidMarkdown = (text: string, offset: number): boolean => {
  try {
    // Ensure that `text` is a string
    if (typeof text !== "string") return false;

    // Check for bold (**text**)
    if (text.slice(offset - 2, offset + 2).match(/\*\*(.*?)\*\*/)) return true;

    // Check for italic (__text__)
    if (text.slice(offset - 2, offset + 2).match(/__(.*?)__/)) return true;

    // Check for links [text](url)
    if (text.slice(offset - 1, offset + 1).match(/\[(.*?)\]\((.*?)\)/)) return true;

    return false; // Not part of valid Markdown structures
  } catch (error) {
    console.error("Error in isInsideValidMarkdown:", error);
    return false; // On error, assume it's not valid Markdown
  }
};

/**
 * Corrects common Markdown mistakes, like unclosed bold/italic tags.
 * Ensures Markdown structures are well-formed before rendering.
 */
const correctErrors = (text: string): string => {
  // Ensure bold tags are properly closed with `**`
  text = text.replace(/(\*\*.*?)(?!\*\*)$/g, "$1**");

  // Ensure italic tags are properly closed with `__`
  text = text.replace(/(__.*?)(?!__)$/g, "$1__");

  // Normalize nested bold/italic formatting
  text = text.replace(/\*\*(.*?)__(.*?)\*\*/g, "**$1__$2**"); // Fix nested italic in bold
  text = text.replace(/__(.*?)\*\*(.*?)__/g, "__$1**$2__"); // Fix nested bold in italics

  return text;
};

/**
 * Main transformation function: parses and formats Markdown input.
 */
const transformMarkdown = (text: string): string => {
  // Step 1: Correct common Markdown errors
  const correctedText = correctErrors(text);

  // Step 2: Convert to Telegram MarkdownV2 using markdownToTelegram
  return markdownToTelegram(correctedText);
};

// Example test cases
const testMessages = [
  "**This is bold** and __this is italic__.",
  "**Bold and __italic__ in one sentence**",
  "**This is unfinished bold and __broken italic__",
  "Here’s a [link](https://example.com) and `inline code`.",
  `
  \`\`\`javascript
  const a = 10;
  console.log(a);
  \`\`\`
  `,
  "Use commands like **/start** or visit __Telegram's homepage__ at [here](https://t.me)!",
];

// Test each message and log the transformed result
testMessages.forEach((message, idx) => {
  console.log(`Test Case ${idx + 1}:`, JSON.stringify(transformMarkdown(message)));
});
