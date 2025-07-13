// flowchart-tokenizer.js

/**
 * 這是我們定義的所有 Token 類型和它們對應的正則表達式。
 * 順序非常重要！因為我們的詞法分析器會按順序匹配。
 * 例如，'flowchart' 關鍵字必須在 'ID' (通用標識符) 之前，
 * 否則 'flowchart' 會被錯誤地識別為一個 ID。
 *
 * 每個正則表達式都以 '^' 開頭，確保只從字符串的開頭進行匹配。
 */
const tokenDefinitions = [
  // 1. 需要忽略的內容 (Whitespace, Comments, Configs, Frontmatter)
  // 將特殊塊放在最前面，以確保優先匹配
  { type: "WHITESPACE", regex: /^\s+/, ignore: true },
  { type: "FRONTMATTER", regex: /^---\s*[\r\n]+(.|\s)*?[\r\n]+---/, ignore: true },
  { type: "CONFIGURATION", regex: /^%%\{.*?\}%%/, ignore: true },
  { type: "COMMENT", regex: /^%%.*/, ignore: true },

  // 2. 關鍵字 (Keywords) - 嚴格區分大小寫
  { type: "FLOWCHART_DEF", regex: /^(flowchart|graph)/ },
  { type: "DIRECTION", regex: /^(TB|TD|BT|RL|LR)/ },
  { type: "SUBGRAPH", regex: /^subgraph/ },
  { type: "END", regex: /^end/ },


  // 3. 鏈接和箭頭 (Links and Arrows) - 長的符號優先匹配
  {
    type: "LINK",
    regex: /^(==>|---|\.->|-->|--|~~~|o--|--o|x--|--x|<-->|-\.->)/,
  },

  // 4. 節點形狀 (Node Shapes) - 長的、更具體的符號優先
  { type: "CYLINDER_START", regex: /^\[\(/ },
  { type: "CYLINDER_END", regex: /^\)\]/ },
  { type: "CIRCLE_START", regex: /^\(\(/ },
  { type: "CIRCLE_END", regex: /^\)\)/ },
  { type: "ROUND_START", regex: /^\(/ },
  { type: "ROUND_END", regex: /^\)/ },
  { type: "SQUARE_START", regex: /^\[/ },
  { type: "SQUARE_END", regex: /^\]/ },
  { type: "ASYMMETRIC_START", regex: /^>/ },
  { type: "ASYMMETRIC_END", regex: /^\]/ },
  { type: "RHOMBUS_START", regex: /^\{/ },
  { type: "RHOMBUS_END", regex: /^\}/ },

  // 5. 其他符號 (Operators and Delimiters)
  { type: "SEMICOLON", regex: /^;/ },
  { type: "AMPERSAND", regex: /^&/ },
  { type: "PIPE", regex: /^\|/ },

  // 6. 數據類型 (Data Types)
  // 字符串必須在 ID 之前，因為字符串的內容可能符合 ID 的規則
  { type: "STRING", regex: /^"[^"]*"/ },
  // ID 必須在最後，因為它是最通用的匹配
  { type: "ID", regex: /^[\p{L}\p{N}_?？]+/u },
];

/**
 * 詞法分析器函數
 * @param {string} code - 要分析的 Mermaid 流程圖代碼
 * @returns {Array<{type: string, value: string, line: number, column: number}>} - Token 數組
 */
function tokenize(code) {
  const tokens = [];
  let cursor = 0;
  let line = 1;
  let column = 1;

  while (cursor < code.length) {
    let matched = false;

    for (const tokenDef of tokenDefinitions) {
      const match = code.substring(cursor).match(tokenDef.regex);

      if (match) {
        const value = match[0];

        if (!tokenDef.ignore) {
          tokens.push({
            type: tokenDef.type,
            value: value,
            line: line,
            column: column,
          });
        }

        // 更新光標、行號和列號
        cursor += value.length;
        const newlines = value.match(/\n/g);
        if (newlines) {
          line += newlines.length;
          column = value.length - value.lastIndexOf("\n");
        } else {
          column += value.length;
        }

        matched = true;
        break; // 匹配成功，跳出 for 循環，從頭開始下一個 token 的匹配
      }
    }

    if (!matched) {
      throw new Error(
        `Lexical Error: Unexpected character at line ${line}, column ${column}: ${code[cursor]}`
      );
    }
  }

  tokens.push({ type: "EOF", value: "EOF", line, column }); // End of File token
  return tokens;
}

module.exports = { tokenize };
