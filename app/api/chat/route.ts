import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ragStore } from '@/lib/ragStore';
import { searchVectorStore } from '@/lib/ragHelpers';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    const clientApiKey = req.headers.get('x-api-key');
    const apiKey = clientApiKey || process.env.ANTHROPIC_API_KEY;

    if (!question || question.trim() === '') {
      return NextResponse.json({ error: 'Question cannot be empty.' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key missing. Please provide it in UI or .env.local.' },
        { status: 400 }
      );
    }

    const { chunks, df, totalDocs } = ragStore.getData();
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No document uploaded. Please upload a PDF knowledge base first.' },
        { status: 400 }
      );
    }

    const searchResults = searchVectorStore(question, chunks, df, totalDocs);
    const topChunks = searchResults.slice(0, 3);

    const contextText = topChunks.map((c) => c.text).join('\n\n---\n\n');

    const anthropic = new Anthropic({ apiKey });

    const messageResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0.2,
      system: `You are an AI FAQ Assistant. Answer user questions accurately based ONLY on the provided document context.

Rules:
1. If the exact answer is NOT contained in the context, explicitly state: "I cannot find this information in the uploaded document."
2. Keep the answer concise and helpful.
3. Do not rely on outside knowledge or hallucinate.

CONTEXT DOCUMENT:
${contextText}`,
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
    });

    const answer =
      messageResponse.content[0].type === 'text'
        ? messageResponse.content[0].text
        : 'No text response generated.';

    return NextResponse.json({
      answer,
      references: topChunks.map((c) => ({
        id: c.id,
        text: c.text,
        score: c.score,
      })),
    });
  } catch (error: any) {
    console.error('Claude Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate answer from Claude API.' },
      { status: 500 }
    );
  }
}
