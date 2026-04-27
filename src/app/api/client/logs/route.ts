import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { type, title, content, imageUrl, weight, bodyFat } = await request.json();
    if (!type || !content) return NextResponse.json({ error: "type and content are required" }, { status: 400 });

    const log = await prisma.customerLog.create({
      data: {
        customerId: userId,
        type,
        title: title || null,
        content,
        imageUrl: imageUrl || null,
        weight: weight ? parseFloat(weight) : null,
        bodyFat: bodyFat ? parseFloat(bodyFat) : null,
      }
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Failed to create log:", error);
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (role !== "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const logs = await prisma.customerLog.findMany({
      where: { customerId: userId },
      orderBy: { date: "desc" }
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
