import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { 
      sessionData, 
      menuItems, 
      postureAnalysis 
    } = await request.json();

    const prompt = `
あなたはエリートパーソナルトレーナーであり、顧客へのフィードバックレポートを作成するスペシャリストです。
以下のセッションデータをすべて統合し、顧客が感動し、モチベーションが最大化されるような「総合アドバイスレポート」を作成してください。

【1. セッションの基本データ】
- 日付: ${sessionData.date}
- コンディション（自覚）: ${sessionData.conditionSelf}
- コンディション（トレーナー評価）: ${sessionData.conditionObjective}
- 体重: ${sessionData.weight}kg, 血圧: ${sessionData.bloodPressureHigh}/${sessionData.bloodPressureLow}

【2. 実施メニュー】
${menuItems.map((m: any) => `- ${m.name}: ${m.sets}セット (${m.reps}回, ${m.weight})`).join('\n')}

【3. 姿勢分析結果（AIによる別解析結果）】
${postureAnalysis}

【4. トレーナーメモ/会話内容】
${sessionData.summary || '特になし'}

---

【レポートの構成案（これらを統合して1つのまとまった文章にしてください）】
1. 今日のセッションへの賞賛と感謝
2. 身体データとコンディションから見る現状の評価
3. 実施したメニューが、顧客の今の姿勢（分析結果を反映）をどう改善し、理想の体にどう近づけているかの科学的解説
4. 次回までに意識すべき具体的なアクション（食事、生活習慣、セルフケア）
5. 最後に、顧客を強く勇気づけるメッセージ

【制約事項】
- 400文字から600文字程度のボリューム感。
- 曖昧な表現を避け、数値や解剖学的根拠に基づいた「信憑性のある」言葉を選んでください。
- 顧客が「自分のためにここまで丁寧に考えてくれているんだ！」と感じるようなパーソナライズされた表現を心がけてください。
- テキストのみで出力してください。
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'あなたは顧客の人生を変える最高のアドバイスを生成するエリートトレーナーです。'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return NextResponse.json({
      report: response.choices[0].message.content
    });

  } catch (error: any) {
    console.error('Comprehensive Report Generation error:', error);
    return NextResponse.json({ error: 'レポート生成に失敗しました。' }, { status: 500 });
  }
}
