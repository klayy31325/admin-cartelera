const paradasRepository = require('../repositories/paradas.repository');
const produccionRepository = require('../repositories/produccion.repository');
const velocidadRepository = require('../repositories/velocidad.repository');

async function test(mId, name) {
  try {
    const today = '2026-05-13';
    const month = '2026-05';

    console.log(`\n=== Testing ${name} (ID ${mId}) ===`);
    const pD = await paradasRepository.getSummaryByDate(today, mId);
    const prD = await produccionRepository.getSummaryByDate(today, mId);
    const vH = await velocidadRepository.getResumenHoy(mId);
    const vS = await velocidadRepository.getSeriesHoy(mId);

    console.log('Paradas Hoy:', pD.length);
    console.log('Prod Hoy:', prD.length);
    console.log('Vel Hoy:', vH);
    console.log('Vel Series:', vS.length);

  } catch (err) {
    console.error(`FAILED ${name}:`, err);
  }
}

async function run() {
  await test(1, 'OLYMPIA');
  await test(2, 'NOVOFLEX');
  process.exit(0);
}

run();
