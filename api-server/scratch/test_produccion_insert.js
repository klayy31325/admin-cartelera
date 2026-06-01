const produccionService = require('../services/produccion.service');

async function runTest() {
  try {
    console.log("Iniciando prueba de guardado de producción...");
    
    const mockData = {
      maquina_nombre: "OLYMPIA",
      cliente: "CLIENTE PRUEBA ANTIGRAVITY",
      producto: "PRODUCTO PRUEBA ANTIGRAVITY",
      metros: 850,
      fecha: "2026-05-18",
      status_orden: "pendiente"
    };

    const result = await produccionService.create(mockData, "CUREX C.A");
    console.log("¡RESULTADO EXITOSO!", result);
    process.exit(0);
  } catch (error) {
    console.error("¡ERROR AL GUARDAR!", error);
    process.exit(1);
  }
}

runTest();
