const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const machines = ["NOVOFLEX", "OLYMPIA"];
  for (const name of machines) {
    await prisma.machine.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const reasons = ["Mantenimiento", "Limpieza", "Falta Insumo", "Cambio de Rodillo", "Falla Eléctrica"];
  for (const name of reasons) {
    await prisma.downtimeReason.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
