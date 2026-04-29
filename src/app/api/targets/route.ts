import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const targets = await prisma.target.findMany({
      include: { machine: true }
    });
    return NextResponse.json(targets);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching targets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { machineId, metric, greenMax, yellowMax } = body;

    const target = await prisma.target.upsert({
      where: {
        machineId_metric: {
          machineId: parseInt(machineId),
          metric
        }
      },
      update: {
        greenMax: Number(greenMax),
        yellowMax: Number(yellowMax)
      },
      create: {
        machineId: parseInt(machineId),
        metric,
        greenMax: Number(greenMax),
        yellowMax: Number(yellowMax)
      }
    });

    return NextResponse.json(target);
  } catch (error) {
    console.error("Target API Error:", error);
    return NextResponse.json({ error: "Error updating target" }, { status: 500 });
  }
}
