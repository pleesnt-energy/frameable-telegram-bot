var MarkdownIt = require("markdown-it");
/**
 * Convert Markdown to Telegram-friendly MarkdownV2.
 * Transforms general Markdown input into MarkdownV2-compliant text.
 */
var markdownToTelegram = function (markdown) {
    var md = new MarkdownIt({
        html: false, // Disable raw HTML
    });
    // Remove HTML wrappers (like <p>) by emptying the rules for paragraphs
    md.renderer.rules.paragraph_open = function () { return ''; };
    md.renderer.rules.paragraph_close = function () { return ''; };
    // Custom rendering for Telegram MarkdownV2
    md.renderer.rules.strong_open = function () { return '**'; }; // Bold
    md.renderer.rules.strong_close = function () { return '**'; };
    md.renderer.rules.em_open = function () { return '__'; }; // Italic
    md.renderer.rules.em_close = function () { return '__'; };
    md.renderer.rules.link_open = function (tokens, idx) { return '['; }; // Open link text
    md.renderer.rules.link_close = function (tokens, idx) {
        var _a, _b, _c;
        var href = (_c = (_b = (_a = tokens[idx - 1]) === null || _a === void 0 ? void 0 : _a.attrs) === null || _b === void 0 ? void 0 : _b.find(function (_a) {
            var attr = _a[0];
            return attr === 'href';
        })) === null || _c === void 0 ? void 0 : _c[1];
        return href ? "](".concat(escapeTelegramMarkdown(href), ")") : ']()'; // If href is missing, fallback to empty
    };
    md.renderer.rules.code_inline = function (tokens, idx) { return "`".concat(tokens[idx].content, "`"); }; // Inline code
    md.renderer.rules.code_block = function (tokens, idx) { return "```\n".concat(tokens[idx].content, "\n```"); }; // Code blocks
    md.renderer.rules.fence = function (tokens, idx) { return "```\n".concat(tokens[idx].content, "\n```"); }; // Fenced code blocks
    md.renderer.rules.text = function (tokens, idx) {
        return escapeTelegramMarkdown(tokens[idx].content);
    }; // Escape raw text to ensure Telegram compatibility
    return md.render(markdown).trim(); // Render Markdown to Telegram MarkdownV2
};
/**
 * Escape Telegram MarkdownV2 special characters.
 * Avoids breaking MarkdownV2 formatting rules while preserving structure.
 */
var escapeTelegramMarkdown = function (text) {
    var specialChars = /([_*~`[\](){}>#+\-=|])/g; // Characters to escape
    if (typeof text !== "string") {
        console.warn("Non-string input to escapeTelegramMarkdown:", text);
        return text; // Return non-string input unchanged
    }
    return text.replace(specialChars, function (char, index, fullStr) {
        if (isInsideValidMarkdown(fullStr, index)) {
            return char; // Leave valid Markdown syntax intact
        }
        return "\\".concat(char); // Otherwise, escape the character
    });
};
/**
 * Determines whether a character is part of valid Markdown formatting syntax.
 * Designed to avoid over-escaping valid Markdown structures like "**bold**" or "[link](url)".
 */
var isInsideValidMarkdown = function (text, offset) {
    try {
        // Ensure that `text` is a string
        if (typeof text !== "string")
            return false;
        // Check for bold (**text**)
        if (text.slice(offset - 2, offset + 2).match(/\*\*(.*?)\*\*/))
            return true;
        // Check for italic (__text__)
        if (text.slice(offset - 2, offset + 2).match(/__(.*?)__/))
            return true;
        // Check for links [text](url)
        if (text.slice(offset - 1, offset + 1).match(/\[(.*?)\]\((.*?)\)/))
            return true;
        return false; // Not part of valid Markdown structures
    }
    catch (error) {
        console.error("Error in isInsideValidMarkdown:", error);
        return false; // On error, assume it's not valid Markdown
    }
};
/**
 * Corrects common Markdown mistakes, like unclosed bold/italic tags.
 * Ensures Markdown structures are well-formed before rendering.
 */
var correctErrors = function (text) {
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
var transformMarkdown = function (text) {
    // Step 1: Correct common Markdown errors
    var correctedText = correctErrors(text);
    // Step 2: Convert to Telegram MarkdownV2 using markdownToTelegram
    return markdownToTelegram(correctedText);
};
// Example test cases
var testMessages = [
    "**This is bold** and __this is italic__.",
    "**Bold and __italic__ in one sentence**",
    "**This is unfinished bold and __broken italic__",
    "Here’s a [link](https://example.com) and `inline code`.",
    "\n  ```javascript\n  const a = 10;\n  console.log(a);\n  ```\n  ",
    "Use commands like **/start** or visit __Telegram's homepage__ at [here](https://t.me)!",
];
// Test each message and log the transformed result
testMessages.forEach(function (message, idx) {
    console.log("Test Case ".concat(idx + 1, ":"), JSON.stringify(transformMarkdown(message)));
});
