# Weather Dashboard PRD - Centro Meteorológico

## Original Problem Statement
Construir una aplicación meteorológica integrada con Weather Underground PWS para la estación IVILLA1220, con exportación de datos a Excel, gráficos interactivos avanzados y auto-actualización de datos.

## User Personas
- **Usuario Principal**: Propietario de estación meteorológica personal (PWS) que necesita visualizar y exportar datos meteorológicos de forma interactiva.

## Core Requirements (Static)
1. Integración con Weather Underground PWS API
2. Visualización de todas las métricas: temperatura, humedad, presión, viento, precipitación, UV, radiación solar
3. Exportación a Excel con resumen estadístico
4. Selector de fechas personalizable (por defecto 24h)
5. Auto-actualización cada 5 minutos
6. Gráficos interactivos avanzados

## What's Been Implemented (January 21, 2026)

### Backend (FastAPI)
- ✅ Integración con Weather Underground API (real, no mocked)
- ✅ GET /api/weather/current - Condiciones actuales
- ✅ GET /api/weather/history - Datos históricos por rango de fechas
- ✅ GET /api/weather/statistics - Estadísticas calculadas
- ✅ GET /api/weather/last24h - Últimas 24 horas
- ✅ GET /api/weather/export/excel - Exportación a Excel con 2 hojas
- ✅ GET /api/station/info - Información de la estación
- ✅ Auto-fetch en background cada 5 minutos
- ✅ Almacenamiento en MongoDB para caché

### Frontend (React)
- ✅ Dashboard con diseño "Centro de Comando Meteorológico"
- ✅ 10 tarjetas de métricas actuales con iconos
- ✅ 5 gráficos interactivos (Recharts): Temperatura, Humedad, Viento, Presión, Precipitación
- ✅ Selector de fechas con calendario
- ✅ Botón de exportar Excel
- ✅ Panel de resumen estadístico
- ✅ Auto-refresh cada 5 minutos
- ✅ Diseño dark theme con estética táctica/científica

### Configuration
- Station ID: IVILLA1220
- API Key: Configurada en backend/.env
- Database: weather_station_db

## Prioritized Backlog

### P0 (Done)
- [x] Conexión con Weather Underground API
- [x] Dashboard de condiciones actuales
- [x] Gráficos históricos
- [x] Exportación Excel
- [x] Auto-actualización

### P1 (Next)
- [ ] Alertas meteorológicas personalizables
- [ ] Integración con Google Sheets para auto-actualización
- [ ] Widgets embebibles

### P2 (Future)
- [ ] Predicción meteorológica con IA
- [ ] Comparación con otras estaciones cercanas
- [ ] App móvil (PWA)

## Next Tasks
1. Implementar alertas configurables (ej: si temperatura < 0°C)
2. Añadir integración con Google Sheets para actualización automática
3. Agregar más visualizaciones (rosa de vientos, gráfico de tendencias)
