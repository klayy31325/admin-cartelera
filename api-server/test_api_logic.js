const paradasRepository = require('./repositories/paradas.repository');

async function test() {
  const month = '2026-05';
  const maquina_id = 1;
  
  console.log(`Buscando paradas para Mes: ${month}, Maquina: ${maquina_id}`);
  
  const data = await paradasRepository.getSummaryByMonth(month, maquina_id);
  
  console.log('--- RESULTADO REPOSITORY ---');
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

test();
