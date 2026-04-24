import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: Request,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, periodStart, periodEnd } = body;

    // 1. 顧客情報の取得
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        metrics: {
          where: periodStart ? {
            date: { gte: new Date(periodStart), lte: new Date(periodEnd) }
          } : {
            date: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
          },
          orderBy: { date: "asc" }
        },
        sessions: {
          where: periodStart ? {
            date: { gte: new Date(periodStart), lte: new Date(periodEnd) }
          } : {
            date: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
          },
          include: { menuItems: true },
          orderBy: { date: "desc" }
        },
        goals: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // 2. AIへのプロンプト作成
    const dataSummary = `
      顧客名: ${customer.name}
      目的: ${customer.goals[0]?.longTermPurpose || "未設定"}
      直近の計測データ数: ${customer.metrics.length}件
      セッション数: ${customer.sessions.length}回
      実施した主な種目: ${customer.sessions.flatMap(s => s.menuItems.map(m => m.name)).join(", ")}
    `;

    const prompt = `
      あなたはパーソナルジム「BodyCareGymCONNECT」のスーパー専属AIトレーナーです。
      以下のデータをもとに、顧客のモチベーションを最大化させるための【月間フィードバックレポート】を日本語で作成してください。

      【データ概要】
      ${dataSummary}

      【構成案】
      1. タイトル（ワクワクするようなもの）
      2. 今月の頑張りへの称賛（具体的なデータや種目に触れる）
      3. 身体の変化・コンディションについての考察
      4. 次の期間でより意識してほしいポイント（専門的かつ前向きなアドバイス）
      5. 最後に一言（顧客の目的に寄り添った力強いエール）

      専門用語は分かりやすく使いつつ、プロフェッショナルで信頼感があり、かつ温かい雰囲気で書いてください。
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
    });

    const reportContent = completion.choices[0].message.content;

    // 3. レポートの保存
    const report = await prisma.report.create({
      data: {
        customerId: id,
        title: `${new Date().getMonth() + 1}月のトレーニングレポート`,
        content: reportContent || "",
        type: type || "Monthly",
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
