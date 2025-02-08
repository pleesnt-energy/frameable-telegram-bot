"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var MarkdownIt = require("markdown-it");
/**
 * Transform Markdown text into Telegram MarkdownV2-compatible output.
 */
/**
 * Convert Markdown to Telegram-friendly MarkdownV2.
 */
var markdownToTelegram = function (markdown) {
    var md = new MarkdownIt({
        html: false, // Disable raw HTML
        xhtmlOut: false, // Disable XHTML output
        breaks: false, // Disable inserting <br> tags on single newlines
    });
    // Remove HTML wrappers (like <p>)
    md.renderer.rules.paragraph_open = function () { return ''; };
    md.renderer.rules.paragraph_close = function () { return ''; };
    // Custom formatting rules for Telegram MarkdownV2
    md.renderer.rules.strong_open = function () { return '**'; }; // Bold
    md.renderer.rules.strong_close = function () { return '**'; };
    md.renderer.rules.em_open = function () { return '__'; }; // Italic
    md.renderer.rules.em_close = function () { return '__'; };
    var href = "";
    md.renderer.rules.link_open = function (tokens, idx) {
        var _a, _b, _c;
        href = (_c = (_b = (_a = tokens[idx]) === null || _a === void 0 ? void 0 : _a.attrs) === null || _b === void 0 ? void 0 : _b.find(function (_a) {
            var attr = _a[0];
            return attr === 'href';
        })) === null || _c === void 0 ? void 0 : _c[1];
        // console.log('href1? ',href);
        return "["; // Open link text
    };
    md.renderer.rules.link_close = function (tokens, idx) {
        // console.log('href2? ',href);
        return "](".concat(escapeTelegramMarkdown(href || ''), ")");
    };
    md.renderer.rules.code_inline = function (tokens, idx) { return "`".concat(tokens[idx].content, "`"); }; // Inline code
    md.renderer.rules.code_block = function (tokens, idx) { return "```\n".concat(tokens[idx].content, "\n```"); }; // Code blocks
    md.renderer.rules.fence = function (tokens, idx) { return "```\n".concat(tokens[idx].content, "\n```"); }; // Fenced code
    md.renderer.rules.text = function (tokens, idx) {
        return escapeTelegramMarkdown(tokens[idx].content);
    }; // Escape raw text
    return md.render(markdown).trim(); // Render Telegram-safe Markdown
};
/**
 * Escape Telegram MarkdownV2 special characters.
 * Ensures the output avoids breaking Telegram processing rules.
 */
var escapeTelegramMarkdown = function (text) {
    return text.replace(/([_*~`[\](){}>#+\-=|.!])/g, "\\$1");
};
var transformMarkdown = function (text) {
    // Step 1: Correct any formatting issues in the raw text
    var correctedText = correctErrors(text);
    // Step 2: Parse the corrected text into structured components
    var parsedComponents = parseMarkdown(correctedText);
    // Step 3: Format the parsed components into Telegram MarkdownV2
    return formatMarkdown(parsedComponents);
};
var correctErrors = function (text) {
    // Fix unclosed bold/italic tags
    text = text.replace(/(\*\*.*?)(?!\*\*)$/g, "$1**"); // Ensure bold ends with `**`
    text = text.replace(/(__.*?)(?!__)$/g, "$1__"); // Ensure italics ends with `__`
    // Normalize nested formatting
    text = text.replace(/\*\*(.*?)__(.*?)\*\*/g, "**$1__$2**"); // Fix nested italic in bold
    text = text.replace(/__(.*?)\*\*(.*?)__/g, "__$1**$2__"); // Fix nested bold in italics
    return text;
};
// const link = (content: string | FmtString, url: string) =>
//   linkOrMention(content, { type: 'text_link', url })
// import { linkOrMention } from "telegraf/typings/core/helpers/formatting";
var format_1 = require("telegraf/format");
var formatMarkdown = function (components) {
    return components
        .map(function (component) {
        switch (component.type) {
            case "bold":
                return (0, format_1.fmt)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", ""], ["", ""])), (0, format_1.bold)(component.content)).text;
            case "italic":
                return (0, format_1.fmt)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", ""], ["", ""])), (0, format_1.italic)(component.content)).text;
            case "link":
                return (0, format_1.fmt)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", ""], ["", ""])), (0, format_1.link)(component.content, "https://unprincely.com")).text;
            case "quote":
                return (0, format_1.fmt)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", ""], ["", ""])), (0, format_1.quote)(component.content)).text;
            case "inlineCode":
                return (0, format_1.fmt)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", ""], ["", ""])), (0, format_1.pre)("typescript")(component.content)).text;
            case "code":
                return (0, format_1.fmt)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["", ""], ["", ""])), (0, format_1.code)(component.content)).text;
            default:
                // Fallback for unknown text
                return component.content;
        }
    })
        .join("");
};
var parseMarkdown = function (text) {
    var components = [];
    // Regexes for identifying Markdown components
    var patterns = {
        bold: /\*\*(.*?)\*\*/g, // Matches **bold** text
        italic: /__(.*?)__/g, // Matches __italic__ text
        link: /\[(.*?)\]\((.*?)\)/g, // Matches [text](url)
        pre: /```([\s\S]*?)```/g, // Matches ```code blocks```
        code: /`([^`]+)`/g, // Matches `inline code`
    };
    // Extract matches for each Markdown type
    for (var _i = 0, _a = Object.entries(patterns); _i < _a.length; _i++) {
        var _b = _a[_i], type = _b[0], regex = _b[1];
        var match = void 0;
        while ((match = regex.exec(text)) !== null) {
            components.push({ type: type, content: match[1] });
        }
    }
    return components;
};
var testMessages = [
    "**This is bold** and _this is italic_.",
    "**Bold and _italic_ in one sentence**",
    "**This is unfinished bold and _broken italic_",
    "Here’s a [link](https://example.com) and `inline code`.",
    "\n  ```javascript\n  const a = 10;\n  console.log(a);\n  ```\n  ",
    "Use commands like **/start** or visit _Telegram's homepage_ at [here](https://t.me)!",
];
testMessages.forEach(function (message) {
    var formattedMessage = markdownToTelegram(message);
    console.log(JSON.stringify(formattedMessage), { parse_mode: "MarkdownV2" });
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
