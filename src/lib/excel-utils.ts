import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportarProduccionExcel = async (
  data: any[],
  fileName: string = 'Reporte_Produccion_Morrocel_Curex.xlsx'
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte de Producción');

  // Ordenar por fecha (más reciente primero)
  const sortedData = [...data].sort((a, b) => {
    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  });

  // Definir columnas (ID eliminado)
  worksheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 20 },
    { header: 'Empresa', key: 'nombre_empresa', width: 20 },
    { header: 'Cliente', key: 'nombre_cliente', width: 20 },
    { header: 'Producto', key: 'nombre_producto', width: 20 },
    { header: 'Máquina', key: 'nombre_maquina', width: 20 },
    { header: 'Metros', key: 'metros', width: 20 },
    { header: 'Estado', key: 'status_orden', width: 20 },
  ];

  // Añadir filtros automáticos (A1 a G1 porque son 7 columnas)
  worksheet.autoFilter = {
    from: 'A1',
    to: 'G1',
  };

  // Estilizar encabezados
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F81BD' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Añadir y formatear datos
  sortedData.forEach((row) => {
    // Determinar empresa por defecto según la máquina si no viene especificada
    let empresaDefecto = row.nombre_empresa || row.empresa;
    if (!empresaDefecto) {
      const maquina = (row.nombre_maquina || row.maquina_nombre || '').toUpperCase();
      if (maquina.includes('OLYMPIA') || maquina.includes('NOVOFLEX')) {
        empresaDefecto = 'CUREX C.A';
      } else {
        empresaDefecto = 'N/A';
      }
    }

    const r = worksheet.addRow({
      fecha: row.fecha ? new Date(row.fecha) : '',
      nombre_empresa: empresaDefecto,
      nombre_cliente: row.nombre_cliente || row.cliente || '',
      nombre_producto: row.nombre_producto || row.producto || '',
      nombre_maquina: row.nombre_maquina || row.maquina_nombre || '',
      metros: Number(row.metros) || 0,
      status_orden: (row.status_orden || row.estado || row.status || '').toUpperCase(),
    });

    // Formatear columna Metros como número
    r.getCell('metros').numFmt = '#,##0';

    // Formatear columna Fecha como DD/MM/YYYY
    r.getCell('fecha').numFmt = 'DD/MM/YY';

    // Formato condicional para Estado
    const cellStatus = r.getCell('status_orden');
    const status = cellStatus.value?.toString().toLowerCase() || '';

    let color = 'FF000000'; // Default black
    if (status === 'listo' || status === 'realizado') {
      color = 'FF00B050'; // Verde
    } else if (status === 'progreso' || status === 'en progreso') {
      color = 'FFFFC000'; // Amarillo
    } else if (status === 'pendiente') {
      color = 'FFFF0000'; // Rojo
    }

    cellStatus.font = { color: { argb: color }, bold: true };
  });

  // Se eliminó el ajuste automático de ancho para respetar los anchos fijos definidos anteriormente

  // Generar archivo y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
};

/**
 * Lee un archivo Excel y devuelve un array de objetos con los datos de producción
 */
export const leerProduccionDesdeExcel = async (file: File): Promise<any[]> => {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.getWorksheet(1); // Usar la primera hoja
  const data: any[] = [];
  
  if (!worksheet) return [];

  // Mapeo de encabezados a llaves del esquema (basado en el formato de exportación)
  // Se espera: Fecha, Empresa, Cliente, Producto, Máquina, Metros, Estado
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Saltar encabezado

    const rowData: any = {
      fecha: row.getCell(1).value,
      // La empresa usualmente se maneja por token o lógica interna, pero la leemos si existe
      cliente: row.getCell(3).value?.toString() || '',
      producto: row.getCell(4).value?.toString() || '',
      maquina_nombre: row.getCell(5).value?.toString() || '',
      metros: Number(row.getCell(6).value) || 0,
      status_orden: row.getCell(7).value?.toString().toLowerCase() || 'pendiente',
    };

    // Validar datos mínimos
    if (rowData.cliente || rowData.producto || rowData.metros > 0) {
      // Ajustar fecha si es un objeto Date de Excel
      if (rowData.fecha instanceof Date) {
        rowData.fecha = rowData.fecha.toISOString().split('T')[0];
      }
      data.push(rowData);
    }
  });

  return data;
};
