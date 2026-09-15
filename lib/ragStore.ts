import { Chunk } from './ragHelpers';

class RAGStore {
  private documentName: string | null = null;
  private chunks: Chunk[] = [];
  private df: Record<string, number> = {};
  private totalDocs = 0;

  public setDocument(name: string, chunks: Chunk[], df: Record<string, number>, totalDocs: number) {
    this.documentName = name;
    this.chunks = chunks;
    this.df = df;
    this.totalDocs = totalDocs;
  }

  public getData() {
    return {
      documentName: this.documentName,
      chunks: this.chunks,
      df: this.df,
      totalDocs: this.totalDocs,
    };
  }

  public clear() {
    this.documentName = null;
    this.chunks = [];
    this.df = {};
    this.totalDocs = 0;
  }
}

const globalForRAG = globalThis as unknown as { ragStore: RAGStore };
export const ragStore = globalForRAG.ragStore || new RAGStore();
if (process.env.NODE_ENV !== 'production') globalForRAG.ragStore = ragStore;
