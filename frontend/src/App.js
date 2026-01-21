import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Toaster, toast } from "sonner";
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  Sun,
  RefreshCw,
  Download,
  Calendar,
  Activity,
  Navigation,
  TrendingUp,
  TrendingDown,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auto-refresh interval (1 minute)
const REFRESH_INTERVAL = 60000;

// Helper to format date for API
const formatDateForApi = (date) => format(date, "yyyyMMdd");

// Wind direction helper
const getWindDirection = (degrees) => {
  if (degrees === null || degrees === undefined) return "N/A";
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-white/20 p-3 font-mono text-xs">
        <p className="text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4">
            <span>{entry.name}:</span>
            <span className="font-bold">{entry.value?.toFixed(1) ?? "N/A"}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Metric Card Component
const MetricCard = ({ icon: Icon, label, value, unit, trend, color = "green", large = false }) => {
  const colorClasses = {
    blue: "text-blue-400",
    orange: "text-orange-400",
    green: "text-emerald-400",
    yellow: "text-amber-400",
    purple: "text-violet-400",
    cyan: "text-cyan-400",
    red: "text-rose-400"
  };

  const bgClasses = {
    blue: "bg-blue-500/10 border-blue-500/20",
    orange: "bg-orange-500/10 border-orange-500/20",
    green: "bg-emerald-500/10 border-emerald-500/20",
    yellow: "bg-amber-500/10 border-amber-500/20",
    purple: "bg-violet-500/10 border-violet-500/20",
    cyan: "bg-cyan-500/10 border-cyan-500/20",
    red: "bg-rose-500/10 border-rose-500/20"
  };

  return (
    <div 
      className={`glass-card p-5 group transition-all duration-300 ${large ? "col-span-2 row-span-2" : ""}`} 
      data-testid={`metric-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg border ${bgClasses[color]} ${colorClasses[color]} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${trend >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend).toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="metric-label mb-1">{label}</div>
      <div className={`metric-value ${large ? "text-5xl" : "text-3xl"} ${colorClasses[color]}`}>
        {value !== null && value !== undefined ? value : "—"}
        {unit && <span className="text-base text-slate-500 ml-1 font-normal">{unit}</span>}
      </div>
    </div>
  );
};

// Stats Summary Component
const StatsSummary = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="glass-card p-6" data-testid="stats-summary">
      <h3 className="heading text-lg mb-6 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>
        Resumen Estadístico
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="space-y-1">
          <div className="metric-label">Temp Máx</div>
          <div className="metric-value text-2xl text-rose-400">{stats.temp_max_c?.toFixed(1) ?? "—"}°C</div>
        </div>
        <div className="space-y-1">
          <div className="metric-label">Temp Mín</div>
          <div className="metric-value text-2xl text-blue-400">{stats.temp_min_c?.toFixed(1) ?? "—"}°C</div>
        </div>
        <div className="space-y-1">
          <div className="metric-label">Humedad Media</div>
          <div className="metric-value text-2xl text-cyan-400">{stats.humidity_avg?.toFixed(1) ?? "—"}%</div>
        </div>
        <div className="space-y-1">
          <div className="metric-label">Ráfaga Máx</div>
          <div className="metric-value text-2xl text-orange-400">{stats.wind_gust_max_kph?.toFixed(1) ?? "—"} km/h</div>
        </div>
        <div className="space-y-1">
          <div className="metric-label">Viento Medio</div>
          <div className="metric-value text-2xl text-emerald-400">{stats.wind_avg_kph?.toFixed(1) ?? "—"} km/h</div>
        </div>
        <div className="space-y-1">
          <div className="metric-label">Presión Media</div>
          <div className="metric-value text-2xl text-violet-400">{stats.pressure_avg_mb?.toFixed(1) ?? "—"} mb</div>
        </div>
        <div className="space-y-1">
          <div className="metric-label">Precipitación</div>
          <div className="metric-value text-2xl text-blue-300">{stats.precip_total_mm?.toFixed(1) ?? 0} mm</div>
        </div>
        <div className="space-y-1">
          <div className="metric-label">Observaciones</div>
          <div className="metric-value text-2xl text-white">{stats.observation_count ?? 0}</div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 1),
    to: new Date()
  });
  const [activeTab, setActiveTab] = useState("temperature");

  // Fetch current weather
  const fetchCurrentWeather = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/weather/current`);
      if (response.data.status === "success") {
        setCurrentWeather(response.data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error fetching current weather:", error);
      toast.error("Error al obtener datos actuales");
    }
  }, []);

  // Fetch history data
  const fetchHistory = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return;

    try {
      const startDate = formatDateForApi(dateRange.from);
      const endDate = formatDateForApi(dateRange.to);

      const [historyRes, statsRes] = await Promise.all([
        axios.get(`${API}/weather/history?start_date=${startDate}&end_date=${endDate}`),
        axios.get(`${API}/weather/statistics?start_date=${startDate}&end_date=${endDate}`)
      ]);

      if (historyRes.data.status === "success") {
        // Process data for charts
        const processedData = historyRes.data.data.map((obs) => ({
          ...obs,
          time: format(new Date(obs.timestamp), "HH:mm", { locale: es }),
          datetime: format(new Date(obs.timestamp), "dd/MM HH:mm", { locale: es })
        }));
        setHistoryData(processedData);
      }

      if (statsRes.data.status === "success") {
        setStatistics(statsRes.data.statistics);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Error al obtener histórico");
    }
  }, [dateRange]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCurrentWeather(), fetchHistory()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCurrentWeather, fetchHistory]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrentWeather();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchCurrentWeather]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCurrentWeather(), fetchHistory()]);
    setRefreshing(false);
    toast.success("Datos actualizados");
  };

  // Export to Excel
  const handleExport = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error("Selecciona un rango de fechas");
      return;
    }

    try {
      const startDate = formatDateForApi(dateRange.from);
      const endDate = formatDateForApi(dateRange.to);

      const response = await axios.get(
        `${API}/weather/export/excel?start_date=${startDate}&end_date=${endDate}`,
        { responseType: "blob" }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `weather_data_${startDate}_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Archivo Excel descargado");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Error al exportar datos");
    }
  };

  // Date range handler
  const handleDateSelect = (range) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from
      });
    }
  };

  // Fetch history when date range changes
  useEffect(() => {
    if (dateRange.from && dateRange.to && !loading) {
      fetchHistory();
    }
  }, [dateRange, fetchHistory, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
            <Activity className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="font-outfit text-lg text-white mt-6">Cargando datos meteorológicos...</p>
          <p className="text-slate-500 text-sm mt-2">Estación Meteomedrano</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14]" data-testid="weather-dashboard">
      <Toaster position="top-right" theme="dark" richColors />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#080c14]/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 animate-pulse-glow">
                <Activity className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="heading text-xl md:text-2xl">
                  Centro Meteorológico Villacarrillo
                </h1>
                <p className="text-slate-500 text-xs mt-0.5">
                  Estación Meteomedrano
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="flex items-center gap-2 text-slate-500 text-xs bg-white/5 px-3 py-2 rounded-lg">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span>{format(lastUpdate, "HH:mm:ss", { locale: es })}</span>
                </div>
              )}
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 rounded-lg px-4 py-2 transition-colors duration-200"
                data-testid="refresh-button"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-8">
        {/* Current Conditions Grid */}
        <section className="mb-10">
          <h2 className="heading text-base mb-5 text-slate-400 flex items-center gap-2">
            <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
            Condiciones Actuales
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" data-testid="current-conditions">
            <MetricCard
              icon={Thermometer}
              label="Temperatura"
              value={currentWeather?.temp_c?.toFixed(1)}
              unit="°C"
              color="orange"
              large={false}
            />
            <MetricCard
              icon={Droplets}
              label="Humedad"
              value={currentWeather?.humidity?.toFixed(0)}
              unit="%"
              color="cyan"
            />
            <MetricCard
              icon={Wind}
              label="Viento"
              value={currentWeather?.wind_speed_kph?.toFixed(1)}
              unit="km/h"
              color="green"
            />
            <MetricCard
              icon={Navigation}
              label="Ráfaga"
              value={currentWeather?.wind_gust_kph?.toFixed(1)}
              unit="km/h"
              color="orange"
            />
            <MetricCard
              icon={Gauge}
              label="Presión"
              value={currentWeather?.pressure_mb?.toFixed(1)}
              unit="mb"
              color="purple"
            />
            <MetricCard
              icon={CloudRain}
              label="Precipitación"
              value={currentWeather?.precip_total_mm?.toFixed(1)}
              unit="mm"
              color="blue"
            />
          </div>

          {/* Additional metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <MetricCard
              icon={Thermometer}
              label="Punto de Rocío"
              value={currentWeather?.dewpoint_c?.toFixed(1)}
              unit="°C"
              color="cyan"
            />
            <MetricCard
              icon={Navigation}
              label="Dirección Viento"
              value={getWindDirection(currentWeather?.wind_dir)}
              unit={currentWeather?.wind_dir ? `${currentWeather.wind_dir}°` : ""}
              color="green"
            />
            <MetricCard
              icon={Sun}
              label="Índice UV"
              value={currentWeather?.uv?.toFixed(1)}
              unit=""
              color="yellow"
            />
            <MetricCard
              icon={Sun}
              label="Radiación Solar"
              value={currentWeather?.solar_radiation?.toFixed(0)}
              unit="W/m²"
              color="yellow"
            />
          </div>
        </section>

        {/* Controls */}
        <section className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className="bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-lg px-5 py-2.5 justify-start transition-colors duration-200"
                  data-testid="date-picker-button"
                >
                  <Calendar className="w-4 h-4 mr-2 text-emerald-400" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    "Seleccionar fechas"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#0c1018] border-white/10 rounded-xl" align="start">
                <CalendarComponent
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  locale={es}
                  className="bg-[#0c1018] text-white rounded-xl"
                  data-testid="calendar"
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={handleExport}
              className="bg-emerald-500 text-white hover:bg-emerald-600 font-medium rounded-lg px-5 py-2.5 transition-colors duration-200"
              data-testid="export-button"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>

            <div className="text-sm text-slate-500 ml-auto flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              {historyData.length} observaciones
            </div>
          </div>
        </section>

        {/* Statistics Summary */}
        {statistics && <section className="mb-10"><StatsSummary stats={statistics} /></section>}

        {/* Charts Section */}
        <section className="mb-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/5 border border-white/5 rounded-xl p-1.5 mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger
                value="temperature"
                className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-colors duration-200"
                data-testid="tab-temperature"
              >
                Temperatura
              </TabsTrigger>
              <TabsTrigger
                value="humidity"
                className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-colors duration-200"
                data-testid="tab-humidity"
              >
                Humedad
              </TabsTrigger>
              <TabsTrigger
                value="wind"
                className="font-barlow uppercase tracking-wider rounded-none data-[state=active]:bg-neon-blue data-[state=active]:text-white"
                data-testid="tab-wind"
              >
                Viento
              </TabsTrigger>
              <TabsTrigger
                value="pressure"
                className="font-barlow uppercase tracking-wider rounded-none data-[state=active]:bg-neon-blue data-[state=active]:text-white"
                data-testid="tab-pressure"
              >
                Presión
              </TabsTrigger>
              <TabsTrigger
                value="precipitation"
                className="font-barlow uppercase tracking-wider rounded-none data-[state=active]:bg-neon-blue data-[state=active]:text-white"
                data-testid="tab-precipitation"
              >
                Precipitación
              </TabsTrigger>
            </TabsList>

            {/* Temperature Chart */}
            <TabsContent value="temperature" className="mt-0">
              <Card className="glass-card border-white/10 rounded-none" data-testid="chart-temperature">
                <CardHeader className="border-b border-white/5 pb-4">
                  <CardTitle className="heading text-lg flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-neon-orange" />
                    Temperatura
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData}>
                        <defs>
                          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="datetime"
                          stroke="#475569"
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#475569"
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          tickLine={false}
                          domain={["auto", "auto"]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="temp_c"
                          name="Temperatura (°C)"
                          stroke="#F97316"
                          strokeWidth={2}
                          fill="url(#tempGradient)"
                        />
                        <Line
                          type="monotone"
                          dataKey="dewpoint_c"
                          name="Punto Rocío (°C)"
                          stroke="#06B6D4"
                          strokeWidth={1}
                          dot={false}
                          strokeDasharray="5 5"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Humidity Chart */}
            <TabsContent value="humidity" className="mt-0">
              <Card className="glass-card border-white/10 rounded-none" data-testid="chart-humidity">
                <CardHeader className="border-b border-white/5 pb-4">
                  <CardTitle className="heading text-lg flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-cyan-500" />
                    Humedad
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData}>
                        <defs>
                          <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="datetime"
                          stroke="#475569"
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#475569"
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          tickLine={false}
                          domain={[0, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="humidity"
                          name="Humedad (%)"
                          stroke="#06B6D4"
                          strokeWidth={2}
                          fill="url(#humidityGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wind Chart */}
            <TabsContent value="wind" className="mt-0">
              <Card className="glass-card border-white/10 rounded-none" data-testid="chart-wind">
                <CardHeader className="border-b border-white/5 pb-4">
                  <CardTitle className="heading text-lg flex items-center gap-2">
                    <Wind className="w-5 h-5 text-emerald-500" />
                    Viento
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={historyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="datetime"
                          stroke="#475569"
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#475569"
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="wind_speed_kph"
                          name="Velocidad (km/h)"
                          stroke="#10B981"
                          fill="rgba(16, 185, 129, 0.2)"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="wind_gust_kph"
                          name="Ráfaga (km/h)"
                          stroke="#F97316"
                          strokeWidth={2}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pressure Chart */}
            <TabsContent value="pressure" className="mt-0">
              <Card className="glass-card border-white/10 rounded-none" data-testid="chart-pressure">
                <CardHeader className="border-b border-white/5 pb-4">
                  <CardTitle className="heading text-lg flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-purple-500" />
                    Presión Atmosférica
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="datetime"
                          stroke="#475569"
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#475569"
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          tickLine={false}
                          domain={["auto", "auto"]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="pressure_mb"
                          name="Presión (mb)"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Precipitation Chart */}
            <TabsContent value="precipitation" className="mt-0">
              <Card className="glass-card border-white/10 rounded-none" data-testid="chart-precipitation">
                <CardHeader className="border-b border-white/5 pb-4">
                  <CardTitle className="heading text-lg flex items-center gap-2">
                    <CloudRain className="w-5 h-5 text-blue-400" />
                    Precipitación
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={historyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="datetime"
                          stroke="#475569"
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#475569"
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#475569"
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="precip_rate_mm"
                          name="Tasa (mm/h)"
                          fill="rgba(59, 130, 246, 0.6)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="precip_total_mm"
                          name="Acumulado (mm)"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-6 mt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-slate-500 font-mono">
            <div>
              Datos de Weather Underground PWS · Meteomedrano
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Auto-actualización cada minuto
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
