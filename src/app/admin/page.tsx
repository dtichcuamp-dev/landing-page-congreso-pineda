"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, Users, DollarSign, ExternalLink, RefreshCw, LogOut, Eye, EyeOff } from "lucide-react";
import { usd } from "@/data/pricing";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface Registration {
  id: string;
  fecha: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  sexo: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  tipo: string;
  monto: number;
  comprobante: string;
  estado: string;
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Recuperar sesión si ya existe
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_password");
    if (saved) {
      setPassword(saved);
      fetchData(saved);
    }
  }, []);

  const fetchData = async (pass: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_data", password: pass }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al autenticar");
      
      setData(json.data);
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_password", pass);
    } catch (err: any) {
      setError(err.message);
      setIsAuthenticated(false);
      sessionStorage.removeItem("admin_password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_password");
    setIsAuthenticated(false);
    setPassword("");
    setData([]);
  };

  const approvePayment = async (id: string) => {
    if (!confirm(`¿Estás seguro de aprobar el pago del registro ${id}?`)) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", password, id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al aprobar");
      
      // Actualizar estado localmente sin recargar todo
      setData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, estado: "Aprobado" } : r))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-clinic-50 px-4">
        <form onSubmit={handleLogin} className="glass w-full max-w-sm rounded-3xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-ink mb-6 text-center">Acceso Administrativo</h1>
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink-soft mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full rounded-xl p-3 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-mute hover:text-ink transition"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Entrar al Dashboard"}
          </button>
        </form>
      </main>
    );
  }

  const totalInscritos = data.length;
  const totalMonto = data.reduce((acc, r) => acc + (Number(r.monto) || 0), 0);
  const pendientes = data.filter((r) => r.estado === "Pendiente de verificación").length;
  const aprobados = data.filter((r) => r.estado === "Aprobado").length;

  // Estadísticas
  const tipoStatsMap: Record<string, number> = {};
  const sexoStatsMap: Record<string, number> = { Femenino: 0, Masculino: 0 };
  const edadStatsMap: Record<string, number> = { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56+": 0 };
  const currentYear = new Date().getFullYear();

  data.forEach((r) => {
    tipoStatsMap[r.tipo] = (tipoStatsMap[r.tipo] || 0) + 1;
    if (r.sexo === "F") sexoStatsMap.Femenino++;
    else if (r.sexo === "M") sexoStatsMap.Masculino++;
    
    if (r.fechaNacimiento) {
      const birthYear = new Date(r.fechaNacimiento).getFullYear();
      const age = currentYear - birthYear;
      if (age >= 18 && age <= 25) edadStatsMap["18-25"]++;
      else if (age >= 26 && age <= 35) edadStatsMap["26-35"]++;
      else if (age >= 36 && age <= 45) edadStatsMap["36-45"]++;
      else if (age >= 46 && age <= 55) edadStatsMap["46-55"]++;
      else if (age >= 56) edadStatsMap["56+"]++;
    }
  });

  const tipoData = Object.entries(tipoStatsMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  const sexoData = [
    { name: "Femenino", value: sexoStatsMap.Femenino, color: "#ec4899" },
    { name: "Masculino", value: sexoStatsMap.Masculino, color: "#3b82f6" },
  ].filter(d => d.value > 0);
  const edadData = Object.entries(edadStatsMap).map(([name, value]) => ({ name, value }));

  return (
    <main className="min-h-screen bg-clinic-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink">Dashboard del Congreso</h1>
            <p className="text-ink-soft">Panel de control de inscripciones y pagos</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchData(password)}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-ink-soft shadow-sm hover:text-brand-600 transition"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100 transition"
            >
              <LogOut className="size-4" /> Salir
            </button>
          </div>
        </div>

        {/* Metricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-6 flex flex-col border-b-4 border-brand-500">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-ink-soft">Total Inscritos</span>
              <Users className="size-5 text-brand-500" />
            </div>
            <span className="text-3xl font-bold text-ink">{totalInscritos}</span>
          </div>
          <div className="glass rounded-2xl p-6 flex flex-col border-b-4 border-emerald-500">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-ink-soft">Monto Total (USD)</span>
              <DollarSign className="size-5 text-emerald-500" />
            </div>
            <span className="text-3xl font-bold text-ink">{usd(totalMonto)}</span>
          </div>
          <div className="glass rounded-2xl p-6 flex flex-col border-b-4 border-amber-500">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-ink-soft">Por Verificar</span>
              <Clock className="size-5 text-amber-500" />
            </div>
            <span className="text-3xl font-bold text-ink">{pendientes}</span>
          </div>
          <div className="glass rounded-2xl p-6 flex flex-col border-b-4 border-clinic-500">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-ink-soft">Aprobados</span>
              <CheckCircle className="size-5 text-clinic-500" />
            </div>
            <span className="text-3xl font-bold text-ink">{aprobados}</span>
          </div>
        </div>

        {/* Gráficos Estadísticos */}
        {totalInscritos > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass rounded-3xl p-6 flex flex-col items-center">
              <h3 className="text-lg font-bold text-ink mb-4 w-full text-center">Inscritos por Sexo</h3>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sexoData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5}>
                      {sexoData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="glass rounded-3xl p-6 flex flex-col items-center">
              <h3 className="text-lg font-bold text-ink mb-4 w-full text-center">Inscritos por Edades</h3>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edadData}>
                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 flex flex-col items-center">
              <h3 className="text-lg font-bold text-ink mb-4 w-full text-center">Inscritos por Tipo</h3>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tipoData} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 11}} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="glass rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/50 text-ink-soft font-medium border-b border-brand-100">
                <tr>
                  <th className="p-4 px-6">ID / Fecha</th>
                  <th className="p-4">Participante</th>
                  <th className="p-4">Cédula</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4 text-right">Monto</th>
                  <th className="p-4 text-center">Comprobante</th>
                  <th className="p-4 px-6 text-center">Estado / Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-white/40 transition">
                    <td className="p-4 px-6">
                      <div className="font-semibold text-brand-700">{row.id}</div>
                      <div className="text-xs text-ink-mute mt-1">
                        {new Date(row.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-ink">
                      {row.nombres} {row.apellidos}
                    </td>
                    <td className="p-4 text-ink-soft">{row.cedula}</td>
                    <td className="p-4 text-ink-soft">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-clinic-100 text-clinic-700 text-xs font-semibold">
                        {row.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-ink">
                      {Number(row.monto) > 0 ? usd(Number(row.monto)) : 'Exonerado'}
                    </td>
                    <td className="p-4 text-center">
                      {row.comprobante ? (
                        <a
                          href={row.comprobante}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-3 py-1.5 rounded-lg transition"
                        >
                          Ver <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-ink-mute">-</span>
                      )}
                    </td>
                    <td className="p-4 px-6 text-center">
                      {row.estado === "Aprobado" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                          <CheckCircle className="size-4" /> Aprobado
                        </span>
                      ) : row.estado === "Exonerado" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft bg-gray-100 px-3 py-1.5 rounded-lg">
                          Exonerado
                        </span>
                      ) : (
                        <button
                          onClick={() => approvePayment(row.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-1.5 rounded-lg shadow-sm transition"
                        >
                          Aprobar Pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-ink-soft">
                      No hay inscripciones registradas todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
