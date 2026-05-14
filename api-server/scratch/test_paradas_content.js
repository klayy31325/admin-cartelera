const paradasRepository = require('../repositories/paradas.repository');
async function test() {
  const mId = 1;
  const today = '2026-05-13';
  const pD = await paradasRepository.getSummaryByDate(today, mId);
  console.log('Paradas Hoy Rows:', JSON.stringify(pD, null, 2));
  process.exit(0);
}
test();
