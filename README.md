# RAG FAQ Bot

Aplikasi tanya jawab dokumen bisnis. Admin mengunggah PDF, lalu pengguna bisa bertanya dan jawabannya diambil dari isi dokumen tersebut, lengkap dengan kutipan sumbernya.

Stack: Next.js, TypeScript, Claude API, pencarian TF-IDF di memori (tanpa database eksternal).

## Cara kerja

**Unggah dokumen**
1. PDF dibaca dengan `pdf-parse`.
2. Teks dipotong per 500 karakter dengan overlap 100 karakter.
3. Setiap potongan diindeks dengan TF-IDF dan disimpan di memori.

**Tanya jawab**
1. Pertanyaan dicocokkan ke potongan teks dengan cosine similarity, lalu diambil 3 teratas.
2. Ketiga potongan dimasukkan ke system prompt, dan Claude diminta menjawab hanya berdasarkan teks itu.
3. Jawaban di-stream ke UI bersama kutipan potongan dan skor relevansinya.

## Menjalankan

Butuh Node.js 18+.

Buat `.env.local`:

```env
ANTHROPIC_API_KEY=isi_api_key
```

Lalu:

```bash
npm install
npm run dev
```

## Batasan

Indeks disimpan di memori, jadi hilang saat server restart. TF-IDF mencocokkan kata, bukan makna, sehingga pertanyaan dengan kata berbeda dari dokumen bisa meleset.
