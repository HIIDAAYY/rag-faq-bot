'use client';

import { useState } from 'react';

interface Reference {
  id: string;
  text: string;
  score: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  references?: Reference[];
}

export default function RAGDemoPage() {
  const [activeTab, setActiveTab] = useState<'admin' | 'chat'>('admin');
  const [apiKey, setApiKey] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a PDF file first.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload document.');

      setUploadedDoc(data.fileName);
      setUploadSuccessMsg(`Successfully processed "${data.fileName}" into ${data.chunkCount} vector chunks!`);
      setActiveTab('chat');
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async () => {
    try {
      await fetch('/api/upload', { method: 'DELETE' });
      setUploadedDoc(null);
      setFile(null);
      setMessages([]);
      setUploadSuccessMsg('Document removed.');
    } catch (err: any) {
      setUploadError('Failed to remove document.');
    }
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim()) return;

    if (!uploadedDoc) {
      setChatError('No document uploaded yet! Please upload a PDF in Admin tab first.');
      return;
    }

    const userQ = inputQuestion.trim();
    setInputQuestion('');
    setChatError(null);

    setMessages((prev) => [...prev, { role: 'user', content: userQ }]);
    setIsChatting(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
        },
        body: JSON.stringify({ question: userQ }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch answer.');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          references: data.references,
        },
      ]);
    } catch (err: any) {
      setChatError(err.message);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl mb-6 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
          AI FAQ Bot (Claude RAG Engine)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Powered by Anthropic Claude API + In-Memory Vector Search
        </p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <input
            type="password"
            placeholder="Anthropic API Key (sk-ant-... or set in .env.local)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-80 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-200"
          />
        </div>
      </header>

      <div className="w-full max-w-4xl flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-2.5 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'admin'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Admin Document Upload
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'chat'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          2. User Chat Interface
        </button>
      </div>

      <div className="w-full max-w-4xl bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 shadow-xl">
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Upload Knowledge Base PDF</h2>
              <p className="text-slate-400 text-sm mt-1">
                Upload clinic policies or FAQ PDFs for Claude to query against.
              </p>
            </div>

            {uploadedDoc ? (
              <div className="bg-emerald-950/60 border border-emerald-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                    Active Document
                  </span>
                  <span className="text-slate-200 font-medium">{uploadedDoc}</span>
                </div>
                <button
                  onClick={handleDeleteDoc}
                  className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 border border-red-700 text-red-300 text-xs rounded-md transition"
                >
                  Remove Document
                </button>
              </div>
            ) : (
              <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 text-amber-300 text-xs">
                ⚠️ No active document indexed. Upload a PDF below before chatting.
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-8 text-center transition">
                <input
                  type="file"
                  accept="application/pdf"
                  id="pdf-upload"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer block">
                  <span className="text-3xl block mb-2">📄</span>
                  <span className="text-slate-200 font-medium block">
                    {file ? file.name : 'Click to select PDF document'}
                  </span>
                  <span className="text-slate-400 text-xs block mt-1">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports standard PDF files'}
                  </span>
                </label>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-lg text-xs">
                  {uploadError}
                </div>
              )}

              {uploadSuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs">
                  {uploadSuccessMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition flex justify-center items-center"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin text-lg">⏳</span> Indexing PDF text...
                  </span>
                ) : (
                  'Process & Index PDF'
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[600px]">
            <div className="pb-3 mb-4 border-b border-slate-700 flex justify-between items-center text-xs text-slate-400">
              <span>
                Document Status:{' '}
                {uploadedDoc ? (
                  <strong className="text-emerald-400 font-medium">{uploadedDoc}</strong>
                ) : (
                  <strong className="text-red-400 font-medium">No Document Uploaded</strong>
                )}
              </span>
              <span>Model: Claude Haiku 4.5</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
                  <span className="text-4xl mb-2">💬</span>
                  <p className="text-sm">Ask questions about your uploaded PDF document.</p>
                  <p className="text-xs mt-1 text-slate-600">
                    Claude will answer strictly from extracted context snippets.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-amber-600 text-white rounded-br-none'
                        : 'bg-slate-700/80 text-slate-100 rounded-bl-none border border-slate-600/50'
                    }`}
                  >
                    {msg.content}

                    {msg.references && msg.references.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-600/60 text-xs">
                        <span className="font-semibold text-amber-300 block mb-1">
                          📌 Cited Document Context:
                        </span>
                        <div className="space-y-1.5">
                          {msg.references.map((ref) => (
                            <div
                              key={ref.id}
                              className="bg-slate-800/90 p-2 rounded border border-slate-700/80 text-slate-300 font-mono text-[11px]"
                            >
                              <div className="text-slate-400 font-sans text-[10px] mb-0.5 flex justify-between">
                                <span>{ref.id}</span>
                                <span>Relevance Score: {ref.score}</span>
                              </div>
                              "{ref.text}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isChatting && (
                <div className="flex items-start">
                  <div className="bg-slate-700/80 text-slate-400 text-xs rounded-2xl px-4 py-3 border border-slate-600/50 flex items-center gap-2">
                    <span className="animate-spin">🟧</span> Asking Claude API...
                  </div>
                </div>
              )}
            </div>

            {chatError && (
              <div className="mt-3 p-2.5 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg">
                {chatError}
              </div>
            )}

            <form onSubmit={handleSendQuestion} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder={
                  uploadedDoc
                    ? 'Ask Claude a question about the document...'
                    : 'Please upload a PDF first in Admin tab...'
                }
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                disabled={!uploadedDoc || isChatting}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-slate-950 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!uploadedDoc || isChatting || !inputQuestion.trim()}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}