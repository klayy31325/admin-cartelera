require('dotenv').config({path:'api-server/.env'});
const mysql = require('mysql2/promise');
const ExcelJS = require('exceljs');

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('PRO-2026-05-CX - copia.xlsx');
  const ws = wb.getWorksheet(1);

  const row7 = ws.getRow(7);
  const row8 = ws.getRow(8);
  console.log('=== HEADERS (fila 7) ===');
  row7.eachCell((c, i) => {
    if (c.value) console.log(`  COL ${i}: ${c.value}`);
  });
  console.log('\n=== SUBHEADERS (fila 8) ===');
  row8.eachCell((c, i) => {
    if (c.value) console.log(`  COL ${i}: ${c.value}`);
  });

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306
  });
  const [cols] = await conn.execute('DESCRIBE paradas_trabajo');
  console.log('\n=== DB COLUMNS (paradas_trabajo) ===');
  cols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

  const [rows] = await conn.execute('SELECT * FROM paradas_trabajo LIMIT 5');
  console.log('\n=== SAMPLE DB DATA ===');
  rows.forEach(r => console.log(' ', JSON.stringify(r)));

  await conn.end();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
