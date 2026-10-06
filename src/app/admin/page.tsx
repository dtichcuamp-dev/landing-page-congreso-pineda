"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, Users, DollarSign, ExternalLink, RefreshCw, LogOut } from "lucide-react";
import { usd } from "@/data/pricing";

interface Registration {
  id: string;
  fecha: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  correo: string;
  tipo: string;
  monto: number;
  comprobante: string;
  estado: string;
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full rounded-xl p-3"
              required
            />
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
