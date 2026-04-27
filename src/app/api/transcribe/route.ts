import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Whisper APIの上限：25MB
const MAX_FILE_SIZE_MB = 25;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI APIキーが設定されていません。' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: '音声ファイルがありません' }, { status: 400 });
    }

    // ファイルサイズチェック
    const fileSizeMB = audioFile.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return NextResponse.json(
        {
          error: `ファイルサイズが上限を超えています (${fileSizeMB.toFixed(1)}MB / 上限 ${MAX_FILE_SIZE_MB}MB)。チャンク分割設定を確認してください。`,
        },
        { status: 413 }
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'ja',
    });

    return NextResponse.json({
      text: transcription.text,
      fileSizeMB: fileSizeMB.toFixed(2),
    });
  } catch (error: any) {
    console.error('Transcription error:', error);

    // OpenAI APIからの詳細エラーを返す
    const detail = error?.error?.message || error?.message || '不明なエラー';
    const statusCode = error?.status || 500;

    return NextResponse.json(
      { error: `Whisper API エラー: ${detail}` },
      { status: statusCode }
    );
  }
}
