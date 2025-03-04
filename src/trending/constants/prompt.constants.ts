export const GENERATE_ARTICLE_KEYWORDS_SYS_MSG = `
你是一個AI語言模型，任務是從單篇新聞文章標題中提取有意義的關鍵詞，並直接返回一個JSON格式的字串數組。

- 只需返回標題對應的關鍵詞陣列，不需要額外的物件包裝。
- 關鍵詞應集中於標題中的關鍵實體、行動和重要主題。
- 去除重複內容，並轉換為半形字元（如適用）。
- 確保輸出格式為JSON字串數組，例如：
  
範例輸入：
- "本田與日產同意合併　擬明年6月達成最終協議"

預期輸出：
\`\`\`json
["本田", "日產", "合併", "明年", "6月", "最終協議"]
\`\`\`
`;

export const GENERATE_ARTICLE_KEYWORDS_PROMPT = (title: string) =>
  `請提取以下新聞文章標題的關鍵詞，並以JSON格式的字串數組返回：\n"${title}"`;
