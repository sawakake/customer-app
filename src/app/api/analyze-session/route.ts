import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60; // タイムアウトを60秒に延長

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI APIキーが設定されていません。' },
      { status: 500 }
    );
  }

  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: '分析するテキストがありません' }, { status: 400 });
    }

    // =============================================
    // プロンプト（テキスト整形 + 分析を一括で実行）
    // =============================================
    const prompt = `
あなたはプロのパーソナルトレーナーのアシスタントです。
以下の「セッション中の会話の文字起こし」を読み、セッション記録を作成してください。

【文字起こし内容（複数チャンクを結合したもの）】
${text}

---

【ステップ1: テキスト前処理（内部処理）】
分析の前に、以下の整形を行ってください（出力には含めない）:
- 重複している文や繰り返し表現を削除（Whisper特有のハルシネーション対策）
- 「えー」「あのー」「えっと」「まあ」等の無意味なフィラーを除去
- トレーナーの発言とお客様の発言を区別できる場合は意識して読む
- チャンクの切れ目で途切れた文章は文脈で補完する
- 90-120分などの長時間セッションの場合、重要度の低い雑談は削り、トレーニング内容とアドバイスに重点を置く

【ステップ2: 情報抽出（JSON出力）】
以下をJSONで出力してください。

1. menuItems: 実施したトレーニング・ストレッチの配列
   各要素: { name: 種目名, type: "トレーニング"|"ストレッチ", sets: セット数(数字), reps: 回数(文字列), weight: 重量(文字列) }
   ※ セット数・回数・重量が不明な場合は null

2. summary: セッション全体の要約（200文字以内）
   ※ トレーナーがお客様の様子・状態・会話の要点をまとめたもの

3. smallTalk: 日常生活やたわいもない会話、仕事の状況、趣味の話題などの要約
   ※ スタッフがお客様のプライベートな情報を把握するために使用（150文字以内）
   ※ 言及がなければ null

4. homework: 次回セッションまでにお客様に取り組んでもらうこと
   ※ 言及がなければ null

5. motivation: 会話から読み取れるお客様の現在のモチベーション状態
   例: "高い（新しい種目に積極的）"、"やや低下（疲労感を訴えていた）"
   ※ 読み取れなければ null

6. advice: 目標達成のためのアドバイス（食事・運動・生活習慣の観点から）
   ※ 言及がなければ null

【出力形式】
必ずJSONのみで出力。余分な説明文は不要。
{
  "menuItems": [{ "name": "...", "type": "...", "sets": 3, "reps": "10", "weight": "自重" }],
  "summary": "...",
  "smallTalk": "...",
  "homework": "...",
  "motivation": "...",
  "advice": "..."
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'あなたはパーソナルトレーニングのセッション記録を正確に整理するアシスタントです。必ずJSON形式のみで回答してください。'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // 低温度で安定した出力
    });

    const result = response.choices[0].message.content;
    const parsed = JSON.parse(result || '{}');

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('AI Analysis error:', error);

    const detail = error?.error?.message || error?.message || '不明なエラー';
    const status = error?.status || 500;

    return NextResponse.json(
      { error: `GPT-4o 分析エラー: ${detail}` },
      { status }
    );
  }
}
