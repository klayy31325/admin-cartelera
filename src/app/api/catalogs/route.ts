import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [machines, clients, products, reasons] = await Promise.all([
      prisma.machine.findMany(),
      prisma.client.findMany(),
      prisma.product.findMany(),
      prisma.downtimeReason.findMany(),
    ]);

    return NextResponse.json({
      machines,
      clients,
      products,
      reasons,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error fetching catalogs" }, { status: 500 });
  }
}

// POST for quick creation of catalogs if needed
export async function POST(req: Request) {
  try {
    const { type, name } = await req.json();
    let result;

    switch (type) {
      case "machine":
        result = await prisma.machine.create({ data: { name } });
        break;
      case "client":
        result = await prisma.client.create({ data: { name } });
        break;
      case "product":
        result = await prisma.product.create({ data: { name } });
        break;
      case "reason":
        result = await prisma.downtimeReason.create({ data: { name } });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Error creating catalog item" }, { status: 500 });
  }
}
