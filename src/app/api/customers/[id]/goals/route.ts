import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 最新の目標を取得
export async function GET(
  request: Request,
  { params }: { params: any }
) {
  const { id } = await params;
  try {
    const goal = await prisma.goal.findFirst({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch goal" }, { status: 500 });
  }
}

// 目標を保存（更新または新規作成）
export async function POST(
  request: Request,
  { params }: { params: any }
) {
  const { id } = await params;
  const body = await request.json();
  const { longTermPurpose, actionPlan, targetWeight, deadline, month } = body;

  try {
    // 既存の同じ月の目標があるかチェック
    const existingGoal = await prisma.goal.findFirst({
      where: {
        customerId: id,
        month: month
      }
    });

    if (existingGoal) {
      // 更新
      const updatedGoal = await prisma.goal.update({
        where: { id: existingGoal.id },
        data: {
          longTermPurpose,
          actionPlan,
          targetWeight,
          deadline: deadline ? new Date(deadline) : null,
        }
      });
      return NextResponse.json(updatedGoal);
    } else {
      // 新規作成
      const newGoal = await prisma.goal.create({
        data: {
          customerId: id,
          longTermPurpose,
          actionPlan,
          targetWeight,
          deadline: deadline ? new Date(deadline) : null,
          month: month || new Date().toISOString().substring(0, 7)
        }
      });
      return NextResponse.json(newGoal);
    }
  } catch (error) {
    console.error("Goal save error:", error);
    return NextResponse.json({ error: "Failed to save goal" }, { status: 500 });
  }
}
