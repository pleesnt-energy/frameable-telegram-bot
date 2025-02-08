const MarkdownIt = require("markdown-it");

/**
 * Transform Markdown text into Telegram MarkdownV2-compatible output.
 */
/**
 * Convert Markdown to Telegram-friendly MarkdownV2.
 */
const markdownToTelegram = (markdown: string): string => {
  const md = new MarkdownIt({
    html: false, // Disable raw HTML
    xhtmlOut: false, // Disable XHTML output
    breaks: false, // Disable inserting <br> tags on single newlines
  });

  // Remove HTML wrappers (like <p>)
  md.renderer.rules.paragraph_open = () => '';
  md.renderer.rules.paragraph_close = () => '';

  // Custom formatting rules for Telegram MarkdownV2
  md.renderer.rules.strong_open = () => '**'; // Bold
  md.renderer.rules.strong_close = () => '**';

  md.renderer.rules.em_open = () => '__'; // Italic
  md.renderer.rules.em_close = () => '__';

  let href = "";
  md.renderer.rules.link_open = (tokens, idx) => {
    href = tokens[idx]?.attrs?.find(([attr]) => attr === 'href')?.[1];
    // console.log('href1? ',href);
    return `[`; // Open link text
  };  
  md.renderer.rules.link_close = (tokens, idx) => {
    // console.log('href2? ',href);
    return `](${escapeTelegramMarkdown(href || '')})`;
  };

  md.renderer.rules.code_inline = (tokens, idx) => `\`${tokens[idx].content}\``; // Inline code
  md.renderer.rules.code_block = (tokens, idx) => `\`\`\`\n${tokens[idx].content}\n\`\`\``; // Code blocks
  md.renderer.rules.fence = (tokens, idx) => `\`\`\`\n${tokens[idx].content}\n\`\`\``; // Fenced code

  md.renderer.rules.text = (tokens, idx) =>
    escapeTelegramMarkdown(tokens[idx].content); // Escape raw text

  return md.render(markdown).trim(); // Render Telegram-safe Markdown
};

/**
 * Escape Telegram MarkdownV2 special characters.
 * Ensures the output avoids breaking Telegram processing rules.
 */
const escapeTelegramMarkdown = (text: string): string => {
  return text.replace(/([_*~`[\](){}>#+\-=|.!])/g, "\\$1");
};


const testMessages = [
  "**This is bold** and _this is italic_.",
  "**Bold and _italic_ in one sentence**",
  "**This is unfinished bold and _broken italic_",
  "Here’s a [link](https://example.com) and `inline code`.",
  `
  \`\`\`javascript
  const a = 10;
  console.log(a);
  \`\`\`
  `,
  "Use commands like **/start** or visit _Telegram's homepage_ at [here](https://t.me)!",
];

testMessages.forEach((message) => {
  const formattedMessage = markdownToTelegram(message);
  console.log(JSON.stringify(formattedMessage), { parse_mode: "MarkdownV2" })
});