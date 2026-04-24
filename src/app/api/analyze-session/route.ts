import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI APIキーが設定されていません。.envファイルを確認してください。' },
      { status: 500 }
    );
  }

  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const prompt = `
あなたはプロのパーソナルトレーナーのアシスタントです。
以下の「セッション中の会話またはメモの文字起こし」を分析し、指定されたフォーマットのJSONで情報を抽出してください。

【文字起こし内容】
${text}

【抽出・生成項目】
1. routines: 行ったトレーニングの内容と回数（例: スクワット 10回x3セットなど）
2. summary: 会話内容の要約（親しみやすく、かつ簡潔に）
3. homework: お客様に出した宿題や、次回のセッションまでに意識してもらうこと
4. motivation: 会話や内容から推測されるお客様の現在のモチベーション（高い/安定/低下気味 などとその理由）
5. advice: 今後の目標達成のために、食事・運動・生活習慣の観点からAIが提供する専門的なアドバイス

【出力形式】
JSON形式のみで出力してください。
{
  "routines": "...",
  "summary": "...",
  "homework": "...",
  "motivation": "...",
  "advice": "..."
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // または gpt-4
      messages: [{ role: 'system', content: 'You are a professional fitness personal trainer assistant.' }, { role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = response.choices[0].message.content;
    return NextResponse.json(JSON.parse(result || '{}'));
  } catch (error: any) {
    console.error('AI Analysis error:', error);
    return NextResponse.json(
      { error: `AI分析に失敗しました: ${error.message || 'APIキーが無効な可能性があります。'}` },
      { status: 500 }
    );
  }
}
