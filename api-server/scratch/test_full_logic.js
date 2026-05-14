const paradasRepository = require('../repositories/paradas.repository');
const produccionRepository = require('../repositories/produccion.repository');
const desperdiciosRepository = require('../repositories/desperdicios.repository');
const velocidadRepository = require('../repositories/velocidad.repository');

async function test() {
  try {
    const mId = 1;
    const today = '2026-05-13';
    const month = '2026-05';

    console.log('--- Testing Paradas ---');
    const pD = await paradasRepository.getSummaryByDate(today, mId);
    const pM = await paradasRepository.getSummaryByMonth(month, mId);
    console.log('Paradas Hoy:', pD.length);
    console.log('Paradas Mes:', pM.length);

    console.log('--- Testing Producción ---');
    const prD = await produccionRepository.getSummaryByDate(today, mId);
    const prM = await produccionRepository.getSummaryByMonth(month, mId);
    console.log('Prod Hoy:', prD.length);
    console.log('Prod Mes:', prM.length);

    console.log('--- Testing Desperdicios ---');
    const dD = await desperdiciosRepository.getSummaryByDate(today, mId);
    const dM = await desperdiciosRepository.getSummaryByMonth(month, mId);
    console.log('Desp Hoy:', dD);

    console.log('--- Testing Velocidad ---');
    const vH = await velocidadRepository.getResumenHoy(mId);
    const vM = await velocidadRepository.getResumenMes(month, mId);
    const vS = await velocidadRepository.getSeriesHoy(mId);
    console.log('Vel Hoy:', vH);
    console.log('Vel Series:', vS.length);

    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

test();
