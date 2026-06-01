import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      machineId, shift, clientId, productId, date, 
      daysWorked, meters, velocity, wasteML, wasteKG,
      jobNumber, repetition, approval, suspension,
      stops 
    } = body;

    // Conexión con el esquema existente (Stops y Production)
    const result = await prisma.$transaction(async (tx: any) => {
      const production = await tx.production.create({
        data: {
          machineId: machineId, // UUID en el esquema existente
          meters: Number(meters),
          velocity: Number(velocity),
          wasteML: Number(wasteML),
          wasteKG: Number(wasteKG),
          date: new Date(date),
          // Los campos adicionales (shift, clientId, productId, etc.) 
          // deberán ser agregados al esquema de base de datos real.
          // Por ahora los mapeamos o guardamos según disponibilidad.
        }
      });

      if (stops && stops.length > 0) {
        await tx.stop.createMany({
          data: stops.map((s: any) => ({
            machineId: machineId,
            event: s.event,
            minutes: Number(s.minutes),
            date: new Date(date),
          }))
        });
      }
      
      return production;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Production API Error:", error);
    return NextResponse.json({ error: error.message || "Error al crear registro" }, { status: 500 });
  }
}
