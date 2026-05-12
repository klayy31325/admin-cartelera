-- 1. Resumen de paradas por motivo (Por Fecha)
CREATE OR REPLACE VIEW v_paradas_resumen AS
SELECT 
    t.fecha,
    mp.nombre AS motivo, 
    mp.tipo AS tipo_parada,
    SUM(pt.minutos) AS total_minutos,
    COUNT(pt.id) AS cantidad_ocurrencias
FROM paradas_trabajo pt
JOIN motivos_parada mp ON pt.motivo_id = mp.id
JOIN trabajos t ON pt.trabajo_id = t.id
GROUP BY t.fecha, mp.nombre, mp.tipo;

-- 2. Estado Global de Producción (Por Fecha)
CREATE OR REPLACE VIEW v_produccion_resumen AS
SELECT 
    t.fecha,
    m.nombre AS maquina,
    SUM(t.metros_producidos) AS metros_totales,
    SUM(t.tiempo_produccion_min) AS minutos_produccion,
    SUM(t.tiempo_parada_total_min) AS minutos_parada,
    ROUND((SUM(t.tiempo_produccion_min) / NULLIF(SUM(t.tiempo_total_min), 0)) * 100, 1) AS eficiencia_porcentaje
FROM trabajos t
JOIN maquinas m ON t.maquina_id = m.id
GROUP BY t.fecha, m.nombre;
