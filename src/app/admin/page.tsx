"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  ExternalLink,
  RefreshCw,
  LogOut,
  Eye,
  EyeOff,
  Mail,
  Send,
  Search,
  Check,
  AlertTriangle,
  CheckSquare,
  Square,
  X,
  FileCheck2,
} from "lucide-react";
import { usd } from "@/data/pricing";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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

  // Estados para reenvío de comprobantes y QR
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFilter, setBulkFilter] = useState<"all" | "approved_only" | "selected">("all");
  const [bulkSending, setBulkSending] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    setSelectedIds([]);
  };

  const approvePayment = async (id: string, correo: string) => {
    if (!confirm(`¿Estás seguro de aprobar el pago del registro ${id}? Se enviará automáticamente su código QR a ${correo}.`)) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", password, id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al aprobar");

      // Actualizar estado localmente
      setData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, estado: "Aprobado" } : r))
      );
      setNotification({
        type: "success",
        message: `✓ Pago aprobado para ${id}. Se ha remitido el comprobante y pase QR oficial a ${correo}.`,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Reenvío individual de comprobante con código QR
  const handleResendSingle = async (row: Registration) => {
    if (!confirm(`¿Reenviar comprobante oficial y código QR a ${row.nombres} ${row.apellidos} (${row.correo})?`)) return;
    setResendingId(row.id);
    setNotification(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_email", password, id: row.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo reenviar el comprobante");

      setNotification({
        type: "success",
        message: `✓ Comprobante con código QR reenviado exitosamente a ${row.correo} (${row.id}).`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Error al reenviar a ${row.correo}: ${err.message}`,
      });
    } finally {
      setResendingId(null);
    }
  };

  // Reenvío masivo de comprobantes
  const handleResendBulk = async () => {
    setBulkSending(true);
    setNotification(null);
    try {
      const payload: any = {
        action: "resend_bulk_emails",
        password,
        filter: bulkFilter === "approved_only" ? "approved_only" : "all",
      };
      if (bulkFilter === "selected" && selectedIds.length > 0) {
        payload.ids = selectedIds;
      }

      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error en el reenvío masivo");

      setShowBulkModal(false);
      setSelectedIds([]);
      setNotification({
        type: "success",
        message: `✓ Reenvío masivo completado exitosamente: Se enviaron ${json.data.sentCount} correos con código QR de ${json.data.totalCount} participantes.${
          json.data.failed && json.data.failed.length > 0
            ? ` (${json.data.failed.length} no pudieron enviarse por dirección errónea)`
            : ""
        }`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Error en reenvío masivo: ${err.message}`,
      });
    } finally {
      setBulkSending(false);
    }
  };

  // Filtrado de la tabla
  const filteredData = data.filter((r) => {
    const matchesSearch =
      !searchTerm.trim() ||
      `${r.nombres} ${r.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cedula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tipo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "Aprobado" && r.estado === "Aprobado") ||
      (statusFilter === "Exonerado" && r.estado === "Exonerado") ||
      (statusFilter === "Pendiente" && r.estado === "Pendiente de verificación");

    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length && filteredData.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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
  const exonerados = data.filter((r) => r.estado === "Exonerado").length;

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-ink">Dashboard del Congreso</h1>
            <p className="text-xs sm:text-sm text-ink-soft">
              Panel de control de inscripciones, control de aforo y emisión de credenciales oficiales
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botón Reenvío Masivo de Comprobantes */}
            <button
              onClick={() => {
                setBulkFilter(selectedIds.length > 0 ? "selected" : "all");
                setShowBulkModal(true);
              }}
              disabled={data.length === 0}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 via-brand-700 to-clinic-600 hover:brightness-110 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-brand-500/25 transition disabled:opacity-50"
              title="Reenviar comprobante y código QR masivamente"
            >
              <Send className="size-4" />
              {selectedIds.length > 0
                ? `Reenviar a Seleccionados (${selectedIds.length})`
                : "Reenvío Masivo de Comprobantes"}
            </button>

            <button
              onClick={() => fetchData(password)}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-ink-soft shadow-sm hover:text-brand-600 hover:border-brand-200 transition"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100 transition"
            >
              <LogOut className="size-4" /> Salir
            </button>
          </div>
        </div>

        {/* Notificación Toast / Feedback */}
        {notification && (
          <div
            className={`flex items-center justify-between gap-3 p-4 rounded-2xl shadow-sm text-xs sm:text-sm font-semibold transition ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : notification.type === "error"
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle className="size-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="size-5 text-red-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-5 flex flex-col border-b-4 border-brand-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">Total Inscritos</span>
              <Users className="size-5 text-brand-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-ink">{totalInscritos}</span>
              <span className="text-xs text-ink-mute">({exonerados} exonerados)</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 flex flex-col border-b-4 border-emerald-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">Monto Total (USD)</span>
              <DollarSign className="size-5 text-emerald-500" />
            </div>
            <span className="text-3xl font-black text-ink">{usd(totalMonto)}</span>
          </div>

          <div className="glass rounded-2xl p-5 flex flex-col border-b-4 border-amber-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">Por Verificar</span>
              <Clock className="size-5 text-amber-500" />
            </div>
            <span className="text-3xl font-black text-ink">{pendientes}</span>
          </div>

          <div className="glass rounded-2xl p-5 flex flex-col border-b-4 border-clinic-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">Aprobados</span>
              <CheckCircle className="size-5 text-clinic-500" />
            </div>
            <span className="text-3xl font-black text-ink">{aprobados}</span>
          </div>
        </div>

        {/* Gráficos Estadísticos */}
        {totalInscritos > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass rounded-3xl p-6 flex flex-col items-center">
              <h3 className="text-base font-bold text-ink mb-4 w-full text-center">Inscritos por Sexo</h3>
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sexoData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={5}>
                      {sexoData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="glass rounded-3xl p-6 flex flex-col items-center">
              <h3 className="text-base font-bold text-ink mb-4 w-full text-center">Inscritos por Edades</h3>
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edadData}>
                    <XAxis dataKey="name" tick={{fontSize: 11}} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 flex flex-col items-center">
              <h3 className="text-base font-bold text-ink mb-4 w-full text-center">Inscritos por Categoría</h3>
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tipoData} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Filtros y Búsqueda */}
        <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-mute" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, correo o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/80 pl-10 pr-4 py-2 text-xs sm:text-sm text-ink placeholder:text-ink-mute focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-soft">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-ink focus:border-brand-500 focus:outline-none"
            >
              <option value="all">Todos ({data.length})</option>
              <option value="Aprobado">Aprobados ({aprobados})</option>
              <option value="Exonerado">Exonerados ({exonerados})</option>
              <option value="Pendiente">Pendientes ({pendientes})</option>
            </select>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-brand-700 underline font-semibold ml-2"
              >
                Limpiar selección ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Participantes */}
        <div className="glass rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/60 text-ink-soft font-semibold text-xs border-b border-brand-100">
                <tr>
                  <th className="p-4 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-ink-mute hover:text-brand-600 transition"
                      title={selectedIds.length === filteredData.length ? "Deseleccionar todos" : "Seleccionar todos"}
                    >
                      {selectedIds.length > 0 && selectedIds.length === filteredData.length ? (
                        <CheckSquare className="size-4 text-brand-600" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 px-4">ID / Registro</th>
                  <th className="p-4">Participante & Contacto</th>
                  <th className="p-4">Cédula</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4 text-right">Monto</th>
                  <th className="p-4 text-center">Comprobante</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {filteredData.map((row) => {
                  const isSelected = selectedIds.includes(row.id);
                  const isResending = resendingId === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-white/50 transition ${isSelected ? "bg-brand-50/40" : ""}`}
                    >
                      {/* Checkbox de selección */}
                      <td className="p-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelect(row.id)}
                          className="text-ink-mute hover:text-brand-600 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="size-4 text-brand-600" />
                          ) : (
                            <Square className="size-4" />
                          )}
                        </button>
                      </td>

                      {/* ID y Fecha */}
                      <td className="p-4 px-4">
                        <div className="font-mono font-bold text-brand-700">{row.id}</div>
                        <div className="text-[11px] text-ink-mute mt-0.5">
                          {new Date(row.fecha).toLocaleDateString("es-VE", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Nombre y Correo */}
                      <td className="p-4">
                        <div className="font-bold text-ink leading-tight">
                          {row.nombres} {row.apellidos}
                        </div>
                        <div className="text-xs text-ink-soft font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="size-3 text-brand-500 shrink-0" />
                          <span>{row.correo}</span>
                        </div>
                      </td>

                      {/* Cédula */}
                      <td className="p-4 text-xs font-mono font-medium text-ink-soft">
                        {row.cedula}
                      </td>

                      {/* Categoría */}
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-clinic-100 text-clinic-800 text-[11px] font-bold">
                          {row.tipo}
                        </span>
                      </td>

                      {/* Monto */}
                      <td className="p-4 text-right font-bold text-ink">
                        {Number(row.monto) > 0 ? (
                          usd(Number(row.monto))
                        ) : (
                          <span className="text-clinic-700 font-semibold text-xs">Exonerado</span>
                        )}
                      </td>

                      {/* Comprobante bancario */}
                      <td className="p-4 text-center">
                        {row.comprobante ? (
                          <a
                            href={row.comprobante}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200 transition"
                          >
                            Ver <ExternalLink className="size-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-ink-mute">-</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="p-4 text-center">
                        {row.estado === "Aprobado" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <CheckCircle className="size-3" /> Aprobado
                          </span>
                        ) : row.estado === "Exonerado" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-clinic-700 bg-clinic-50 border border-clinic-200 px-2.5 py-1 rounded-lg">
                            <Check className="size-3" /> Exonerado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            <Clock className="size-3" /> Por Verificar
                          </span>
                        )}
                      </td>

                      {/* Acciones: Aprobar pago y Reenviar Comprobante / QR */}
                      <td className="p-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {row.estado === "Pendiente de verificación" && (
                            <button
                              type="button"
                              onClick={() => approvePayment(row.id, row.correo)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-amber-500 hover:bg-amber-600 px-2.5 py-1.5 rounded-lg shadow-sm transition"
                              title="Aprobar pago y enviar QR"
                            >
                              <FileCheck2 className="size-3.5" /> Aprobar
                            </button>
                          )}

                          {/* Botón individual de reenvío de comprobante */}
                          <button
                            type="button"
                            disabled={isResending}
                            onClick={() => handleResendSingle(row)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-900 bg-white hover:bg-brand-50 border border-brand-200 px-2.5 py-1.5 rounded-lg shadow-sm transition disabled:opacity-50"
                            title={`Reenviar comprobante oficial y código QR a ${row.correo}`}
                          >
                            {isResending ? (
                              <>
                                <RefreshCw className="size-3 animate-spin text-brand-600" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Mail className="size-3 text-brand-600" />
                                Reenviar QR
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-ink-soft">
                      {searchTerm
                        ? "No se encontraron inscripciones que coincidan con la búsqueda."
                        : "No hay inscripciones registradas todavía."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ──────── MODAL DE REENVÍO MASIVO ──────── */}
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="glass-strong w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <Send className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-ink">Reenvío Masivo de Comprobantes</h3>
                    <p className="text-xs text-ink-soft">Emisión masiva de credenciales y códigos QR por correo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-ink-soft">
                <p>
                  Esta acción enviará a cada participante su correo oficial con la <b>credencial digital de acceso</b>, los <b>días/turnos asignados en Salón Principal (1) y Salón Alterno (2)</b> y su <b>Código QR en alta resolución</b>.
                </p>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/80 space-y-2.5">
                  <label className="block font-bold text-ink">Selecciona el grupo de destinatarios:</label>

                  {selectedIds.length > 0 && (
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="bulkOption"
                        checked={bulkFilter === "selected"}
                        onChange={() => setBulkFilter("selected")}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <span>
                        <b>Solo los seleccionados manualmente</b> ({selectedIds.length} participantes)
                      </span>
                    </label>
                  )}

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkOption"
                      checked={bulkFilter === "all"}
                      onChange={() => setBulkFilter("all")}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>
                      <b>Todos los participantes registrados</b> ({data.length} participantes)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkOption"
                      checked={bulkFilter === "approved_only"}
                      onChange={() => setBulkFilter("approved_only")}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>
                      <b>Solo confirmados</b> (Aprobados y Exonerados: {aprobados + exonerados} participantes)
                    </span>
                  </label>
                </div>

                <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-900 border border-brand-200">
                  ℹ️ Los correos se remitirán desde la cuenta oficial del Congreso con el remitente configurado.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={bulkSending}
                  onClick={() => setShowBulkModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-ink-soft hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={bulkSending}
                  onClick={handleResendBulk}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-clinic-600 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-brand-500/25 transition hover:brightness-110 disabled:opacity-50"
                >
                  {bulkSending ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Procesando reenvío masivo...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Iniciar Reenvío Masivo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
