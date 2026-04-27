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
        content: 'あなたはプロのパーソナルトレーナー及び理学療法士です。提供された顧客のセッション前（Before）とセッション後（After）の姿勢写真を確認し、どのような姿勢の改善が見られたかを分析してください。専門用語を少し交えつつも、顧客が読んで喜ぶようなポジティブでわかりやすいフィードバックを200文字程度で生成してください。形式はテキストのみです。'
      }
    ];

    const contentArray: any[] = [
      { type: 'text', text: '以下の写真を見て、姿勢の改善要素を分析してください。' }
    ];

    beforeImages.forEach((img: string) => {
      contentArray.push({ type: 'image_url', image_url: { url: img, detail: 'low' } });
    });

    afterImages.forEach((img: string) => {
      contentArray.push({ type: 'image_url', image_url: { url: img, detail: 'low' } });
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
