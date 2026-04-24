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

    // 全てのセッションを取得
    const allSessions = await prisma.session.findMany({
      orderBy: { date: 'desc' }
    });

    const allCustomers = await prisma.customer.findMany();

    // 今月のセッション (計測のみを除外)
    const thisMonthSessions = allSessions.filter(s => {
      const d = new Date(s.date);
      return d >= currentMonthStart && d <= currentMonthEnd && s.type !== "計測のみ";
    });

    // 先月のセッション (計測のみを除外)
    const lastMonthSessions = allSessions.filter(s => {
      const d = new Date(s.date);
      return d >= lastMonthStart && d <= lastMonthEnd && s.type !== "計測のみ";
    });

    // 計測のみの件数（今月）
    const thisMonthMeasurements = allSessions.filter(s => {
      const d = new Date(s.date);
      return d >= currentMonthStart && d <= currentMonthEnd && s.type === "計測のみ";
    }).length;

    // 内訳
    const durationCount = {
      "60": thisMonthSessions.filter(s => s.duration === 60).length,
      "90": thisMonthSessions.filter(s => s.duration === 90).length,
      "other": thisMonthSessions.filter(s => s.duration !== 60 && s.duration !== 90).length
    };

    // 体験数 (今月)
    const experienceCount = thisMonthSessions.filter(s => s.type === "体験").length;

    // 新規入会数 (今月登録された顧客)
    const newEnrollments = allCustomers.filter(c => {
      const d = new Date(c.createdAt);
      return d >= currentMonthStart && d <= currentMonthEnd;
    }).length;

    // 入会率 (新規入会 / 体験数)
    const enrollmentRate = experienceCount > 0 ? (newEnrollments / experienceCount) * 100 : 0;

    // プラン別顧客数
    const planStats = allCustomers.reduce((acc: any, c) => {
      const plan = c.plan || "未設定";
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      summary: {
        thisMonthSessionCount: thisMonthSessions.length,
        lastMonthSessionCount: lastMonthSessions.length,
        thisMonthMeasurements,
        durationCount,
        experienceCount,
        newEnrollments,
        enrollmentRate: enrollmentRate.toFixed(1),
        totalCustomers: allCustomers.length
      },
      planStats
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
