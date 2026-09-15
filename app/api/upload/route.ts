import { NextRequest, NextResponse } from 'next/server';
import { createRequire } from 'module';
import { ragStore } from '@/lib/ragStore';
import { chunkText, buildTFIDFStore } from '@/lib/ragHelpers';

// pdf-parse pulls in pdfjs-dist and the native @napi-rs/canvas binaries, so this
// route has to run on the Node.js runtime (not Edge).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Turbopack cannot statically bundle pdf-parse (native .node files + a worker
// entry that is resolved at runtime). Loading it through createRequire keeps the
// import out of the module graph; `serverExternalPackages` in next.config.ts
// tells Next to leave it as an external runtime require.
const nodeRequire = createRequire(import.meta.url);

type PdfParseModule = typeof import('pdf-parse');

async function extractPdfText(data: Uint8Array): Promise<string> {
  // pdf-parse v2 has no default export: it exposes a PDFParse class.
  const { PDFParse } = nodeRequire('pdf-parse') as PdfParseModule;

  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const extractedText = await extractPdfText(new Uint8Array(bytes));

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. The file might be scanned or empty.' },
        { status: 400 }
      );
    }

    const textChunks = chunkText(extractedText);
    const { chunks, df, totalDocs } = buildTFIDFStore(textChunks);

    ragStore.setDocument(file.name, chunks, df, totalDocs);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      chunkCount: chunks.length,
    });
  } catch (error: unknown) {
    console.error('PDF Upload Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process PDF document.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  ragStore.clear();
  return NextResponse.json({ success: true, message: 'Document removed successfully.' });
}
