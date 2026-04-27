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

【最重要】
- あなたは経験豊富な理学療法士およびパーソナルトレーナーであり、解剖学的な視点から非常に高い信憑性のある分析を行います。
- 「画像が見られません」という回答は言語道断です。ピクセル情報から肩峰、胸郭、骨盤、大転子、膝関節、足関節のアライメントを正確に把握し、プロの視点で分析してください。
- 変化については「少し良くなった」などの曖昧な表現を避け、「骨盤の前傾が改善し、反り腰の原因である脊柱起立筋の過緊張が緩和されています」のように、具体的かつ専門的な根拠を持って述べてください。
- この分析により、将来的にどのような膝痛や腰痛の予防につながるか、あるいはスポーツパフォーマンスがどう向上するかなど、顧客が驚き、納得するような強力なメリットを提示してください。
- 300文字から400文字程度で、誠実さと専門性が伝わるポジティブなフィードバックをテキストのみで出力してください。`
      }
    ];

    const contentArray: any[] = [
      { type: 'text', text: 'プロトタイプとなるBefore/After写真のアライメントを徹底的に解剖学的に比較分析してください。' }
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
