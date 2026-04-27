import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    
    // 今月の開始日と終了日 (Native JS)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // 先月の開始日と終了日 (Native JS)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 並列で集計クエリを実行（findMany全件取得をやめ、DB側にカウントさせる）
    const [
      thisMonthSessionCount,
      lastMonthSessionCount,
      thisMonthMeasurements,
      experienceCount,
      groupByDurationThisMonth,
      groupByDurationLastMonth,
      totalCustomers,
      newEnrollments,
      planGroup
    ] = await Promise.all([
      // 今月のセッション数
      prisma.session.count({
        where: { date: { gte: currentMonthStart, lte: currentMonthEnd }, type: { not: "計測のみ" } }
      }),
      // 先月のセッション数
      prisma.session.count({
        where: { date: { gte: lastMonthStart, lte: lastMonthEnd }, type: { not: "計測のみ" } }
      }),
      // 今月の計測のみ数
      prisma.session.count({
        where: { date: { gte: currentMonthStart, lte: currentMonthEnd }, type: "計測のみ" }
      }),
      // 今月の体験数
      prisma.session.count({
        where: { date: { gte: currentMonthStart, lte: currentMonthEnd }, type: "体験" }
      }),
      // 今月：時間ごとのグループ集計
      prisma.session.groupBy({
        by: ['duration'],
        where: { date: { gte: currentMonthStart, lte: currentMonthEnd }, type: { not: "計測のみ" } },
        _count: true
      }),
      // 先月：時間ごとのグループ集計
      prisma.session.groupBy({
        by: ['duration'],
        where: { date: { gte: lastMonthStart, lte: lastMonthEnd }, type: { not: "計測のみ" } },
        _count: true
      }),
      // 全顧客数
      prisma.customer.count(),
      // 今月の新規顧客
      prisma.customer.count({
        where: { createdAt: { gte: currentMonthStart, lte: currentMonthEnd } }
      }),
      // プランごとの顧客数集計
      prisma.customer.groupBy({
        by: ['plan'],
        _count: true
      })
    ]);

    // 内訳と売上の計算
    const durationCount = { "60": 0, "90": 0, "other": 0 };
    let thisMonthRevenue = 0;
    groupByDurationThisMonth.forEach(g => {
      if (g.duration === 60) durationCount["60"] += g._count;
      else if (g.duration === 90) durationCount["90"] += g._count;
      else durationCount["other"] += g._count;

      thisMonthRevenue += (g.duration / 60) * 8500 * g._count;
    });

    let lastMonthRevenue = 0;
    groupByDurationLastMonth.forEach(g => {
      lastMonthRevenue += (g.duration / 60) * 8500 * g._count;
    });

    // 入会率 (新規入会 / 体験数)
    const enrollmentRate = experienceCount > 0 ? (newEnrollments / experienceCount) * 100 : 0;

    // プラン別顧客数
    const planStats: Record<string, number> = {};
    planGroup.forEach(g => {
      const planName = g.plan || "未設定";
      planStats[planName] = (planStats[planName] || 0) + g._count;
    });

    return NextResponse.json({
      summary: {
        thisMonthSessionCount,
        lastMonthSessionCount,
        thisMonthMeasurements,
        durationCount,
        experienceCount,
        newEnrollments,
        enrollmentRate: enrollmentRate.toFixed(1),
        totalCustomers,
        thisMonthRevenue: Math.round(thisMonthRevenue),
        lastMonthRevenue: Math.round(lastMonthRevenue)
      },
      planStats
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
