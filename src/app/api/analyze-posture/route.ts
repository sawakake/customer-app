import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI APIキーが設定されていません。' }, { status: 500 });
  }

  try {
    const { beforeImages, afterImages } = await request.json();

    if (!beforeImages?.length && !afterImages?.length) {
      return NextResponse.json({ error: '分析する画像が含まれていません。' }, { status: 400 });
    }

    const messages: any[] = [
      {
        role: 'system',
        content: `あなたはプロの理学療法士兼パーソナルトレーナーです。
画像認識能力を駆使して、提供された顧客のセッション前（Before）とセッション後（After）の写真から姿勢の改善点を分析してください。

【重要】
- あなたには画像がはっきりと見えています。「画像が見られません」という回答は絶対に避け、見えている情報（肩の高さ、骨盤の傾き、首の位置など）から誠実に分析してください。
- セッションによってどのようなポジティブな変化（猫背の改善、重心の安定など）があったかを具体的に述べてください。
- 専門用語（骨盤前傾、円背など）を適度に取り入れつつ、顧客が読んでやる気が出るようなポジティブな口調で、200文字から300文字程度にまとめてください。
- 形式はテキストのみで出力してください。`
      }
    ];

    const contentArray: any[] = [
      { type: 'text', text: '以下のBefore/After写真を比較分析してください。' }
    ];

    beforeImages.forEach((img: string, i: number) => {
      contentArray.push({ type: 'text', text: `【Before 写真 ${i + 1}】` });
      contentArray.push({ type: 'image_url', image_url: { url: img, detail: 'high' } });
    });

    afterImages.forEach((img: string, i: number) => {
      contentArray.push({ type: 'text', text: `【After 写真 ${i + 1}】` });
      contentArray.push({ type: 'image_url', image_url: { url: img, detail: 'high' } });
    });

    messages.push({
      role: 'user',
      content: contentArray
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 300,
    });

    return NextResponse.json({
      analysis: response.choices[0].message.content
    });

  } catch (error: any) {
    console.error('Posture AI Analysis error:', error);
    return NextResponse.json(
      { error: `GPT-4o 分析エラー: ${error.message}` },
      { status: 500 }
    );
  }
}
