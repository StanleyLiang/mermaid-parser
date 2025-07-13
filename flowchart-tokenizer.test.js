const { tokenize } = require('./flowchart-tokenizer');

describe('flowchart-tokenizer', () => {

  // 輔助函數：從 token 數組中移除 line 和 column 信息，以便於比較
  const stripPosition = (tokens) => tokens.map(({ type, value }) => ({ type, value }));

  test('should tokenize a simple flowchart definition', () => {
    const code = 'flowchart TD';
    const expected = [
      { type: 'FLOWCHART_DEF', value: 'flowchart' },
      { type: 'DIRECTION', value: 'TD' },
      { type: 'EOF', value: 'EOF' },
    ];
    expect(stripPosition(tokenize(code))).toEqual(expected);
  });

  test('should handle comments and whitespace', () => {
    const code = `
      flowchart LR %% This is a test
      A --> B;
    `;
    const expected = [
      { type: 'FLOWCHART_DEF', value: 'flowchart' },
      { type: 'DIRECTION', value: 'LR' },
      { type: 'ID', value: 'A' },
      { type: 'LINK', value: '-->' },
      { type: 'ID', value: 'B' },
      { type: 'SEMICOLON', value: ';' },
      { type: 'EOF', value: 'EOF' },
    ];
    expect(stripPosition(tokenize(code))).toEqual(expected);
  });

  test('should tokenize all major node shapes', () => {
    const code = 'A[Square] --> B(Round) --> C{Rhombus} --> D((Circle))';
    const expected = [
      { type: 'ID', value: 'A' },
      { type: 'SQUARE_START', value: '[' },
      { type: 'ID', value: 'Square' },
      { type: 'SQUARE_END', value: ']' },
      { type: 'LINK', value: '-->' },
      { type: 'ID', value: 'B' },
      { type: 'ROUND_START', value: '(' },
      { type: 'ID', value: 'Round' },
      { type: 'ROUND_END', value: ')' },
      { type: 'LINK', value: '-->' },
      { type: 'ID', value: 'C' },
      { type: 'RHOMBUS_START', value: '{' },
      { type: 'ID', value: 'Rhombus' },
      { type: 'RHOMBUS_END', value: '}' },
      { type: 'LINK', value: '-->' },
      { type: 'ID', value: 'D' },
      { type: 'CIRCLE_START', value: '((' },
      { type: 'ID', value: 'Circle' },
      { type: 'CIRCLE_END', value: '))' },
      { type: 'EOF', value: 'EOF' },
    ];
    expect(stripPosition(tokenize(code))).toEqual(expected);
  });

  test('should tokenize links with text', () => {
    const code = 'A -- text --> B';
    const expected = [
        { type: 'ID', value: 'A' },
        { type: 'LINK', value: '--' },
        { type: 'ID', value: 'text' },
        { type: 'LINK', value: '-->' },
        { type: 'ID', value: 'B' },
        { type: 'EOF', value: 'EOF' },
    ];
    expect(stripPosition(tokenize(code))).toEqual(expected);
  });

  test('should correctly tokenize flowchart with Unicode characters', () => {
    const code = 'flowchart TD; A[開始] --> B{成功？};';
    const expected = [
      { type: 'FLOWCHART_DEF', value: 'flowchart' },
      { type: 'DIRECTION', value: 'TD' },
      { type: 'SEMICOLON', value: ';' },
      { type: 'ID', value: 'A' },
      { type: 'SQUARE_START', value: '[' },
      { type: 'ID', value: '開始' },
      { type: 'SQUARE_END', value: ']' },
      { type: 'LINK', value: '-->' },
      { type: 'ID', value: 'B' },
      { type: 'RHOMBUS_START', value: '{' },
      { type: 'ID', value: '成功？' },
      { type: 'RHOMBUS_END', value: '}' },
      { type: 'SEMICOLON', value: ';' },
      { type: 'EOF', value: 'EOF' },
    ];
    expect(stripPosition(tokenize(code))).toEqual(expected);
  });

  test('should throw an error for invalid characters', () => {
    const code = 'A --> B @ C';
    // The arrow function passed to expect(...).toThrow() is the test
    expect(() => tokenize(code)).toThrow('Lexical Error: Unexpected character at line 1, column 9: @');
  });

  test('should handle an empty string', () => {
    const code = '';
    const expected = [{ type: 'EOF', value: 'EOF' }];
    expect(stripPosition(tokenize(code))).toEqual(expected);
  });

  test('should handle a string with only whitespace', () => {
    const code = '   \n  \t ';
    const expected = [{ type: 'EOF', value: 'EOF' }];
    expect(stripPosition(tokenize(code))).toEqual(expected);
  });

  test('should tokenize subgraphs and end keywords', () => {
    const code = 'subgraph My Subgraph; A; end';
    const expected = [
      { type: 'SUBGRAPH', value: 'subgraph' },
      { type: 'ID', value: 'My' },
      { type: 'ID', value: 'Subgraph' },
      { type: 'SEMICOLON', value: ';' },
      { type: 'ID', value: 'A' },
      { type: 'SEMICOLON', value: ';' },
      { type: 'END', value: 'end' },
      { type: 'EOF', value: 'EOF' },
    ];
    expect(stripPosition(tokenize(code))).toEqual(expected);
  });

  test('should correctly ignore a configuration directive', () => {
    const code = `
      %%{init: {"theme": "dark"}}%%
      flowchart TD
      A --> B
    `;
    const expected = [
      { type: 'FLOWCHART_DEF', value: 'flowchart' },
      { type: 'DIRECTION', value: 'TD' },
      { type: 'ID', value: 'A' },
      { type: 'LINK', value: '-->' },
      { type: 'ID', value: 'B' },
      { type: 'EOF', value: 'EOF' },
    ];
    expect(stripPosition(tokenize(code))).toEqual(expected);
  });

  test('should correctly ignore a frontmatter block', () => {
    const code = `
---
title: My Test Diagram
---
flowchart TD
    A --> B
    `;
    const expected = [
      { type: 'FLOWCHART_DEF', value: 'flowchart' },
      { type: 'DIRECTION', value: 'TD' },
      { type: 'ID', value: 'A' },
      { type: 'LINK', value: '-->' },
      { type: 'ID', value: 'B' },
      { type: 'EOF', value: 'EOF' },
    ];
    expect(stripPosition(tokenize(code))).toEqual(expected);
  });
});
