export interface Chunk {
  id: string;
  text: string;
  tf: Record<string, number>;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  const cleanText = text.replace(/\s+/g, ' ').trim();

  if (!cleanText) return [];

  while (start < cleanText.length) {
    const end = Math.min(start + chunkSize, cleanText.length);
    chunks.push(cleanText.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

export function buildTFIDFStore(rawChunks: string[]) {
  const df: Record<string, number> = {};
  
  const chunks: Chunk[] = rawChunks.map((chunkText, index) => {
    const tokens = tokenize(chunkText);
    const tf: Record<string, number> = {};
    const uniqueTokens = new Set(tokens);

    for (const token of tokens) {
      tf[token] = (tf[token] || 0) + 1;
    }

    for (const token in tf) {
      tf[token] = tf[token] / (tokens.length || 1);
    }

    for (const token of uniqueTokens) {
      df[token] = (df[token] || 0) + 1;
    }

    return {
      id: `chunk-${index + 1}`,
      text: chunkText,
      tf,
    };
  });

  return { chunks, df, totalDocs: rawChunks.length };
}

export function searchVectorStore(
  query: string,
  chunks: Chunk[],
  df: Record<string, number>,
  totalDocs: number
) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0 || chunks.length === 0) return [];

  const queryTF: Record<string, number> = {};
  for (const t of queryTokens) {
    queryTF[t] = (queryTF[t] || 0) + 1;
  }

  const scores = chunks.map((chunk) => {
    let score = 0;
    for (const token of queryTokens) {
      if (chunk.tf[token]) {
        const idf = Math.log((totalDocs + 1) / ((df[token] || 0) + 1)) + 1;
        score += chunk.tf[token] * idf * (queryTF[token] / queryTokens.length);
      }
    }
    return {
      id: chunk.id,
      text: chunk.text,
      score: Math.round(score * 100) / 100,
    };
  });

  return scores.sort((a, b) => b.score - a.score);
}
