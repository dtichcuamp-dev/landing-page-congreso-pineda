"use client";

import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CheckCircle, XCircle, Camera, Users, Building, Calendar, Eye, EyeOff } from "lucide-react";

export default function ScannerPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState("");
  const [salon, setSalon] = useState("Salón Principal");
  const [jornada, setJornada] = useState("2026-11-02");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [scanResult, setScanResult] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
    nombres?: string;
    tipo?: string;
  }>({ status: "idle", message: "" });
  
  // Last scanned to prevent double scanning rapidly
  const [lastScanned, setLastScanned] = useState("");

  useEffect(() => {
    const savedPass = localStorage.getItem("scanner_password");
    const savedUser = localStorage.getItem("scanner_user");
    if (savedPass && savedUser) {
      setPassword(savedPass);
      setUser(savedUser);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Configurar Scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      false
    );

    scanner.render(
      async (decodedText) => {
        // Prevent double scans
        if (decodedText === lastScanned) return;
        setLastScanned(decodedText);
        
        // Handle scan
        setScanResult({ status: "loading", message: `Validando ${decodedText}...` });
        
        try {
          const res = await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              action: "scan_qr", 
              password,
              id: decodedText,
              salon,
              jornada,
              user
            }),
          });
          
          const json = await res.json();
          if (!res.ok || !json.ok) {
            setScanResult({ status: "error", message: json.error || "Error al validar" });
          } else {
            setScanResult({ 
              status: "success", 
              message: "¡Acceso Permitido!", 
              nombres: json.data.nombres,
              tipo: json.data.tipo
            });
          }
        } catch (err: any) {
          setScanResult({ status: "error", message: err.message });
        }
        
        // Reset after 4 seconds
        setTimeout(() => {
          setScanResult({ status: "idle", message: "" });
          setLastScanned("");
        }, 4000);
      },
      (error) => {
        // Ignore normal scan errors (no qr found)
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isAuthenticated, salon, jornada, password, user, lastScanned]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !password) return;
    localStorage.setItem("scanner_password", password);
    localStorage.setItem("scanner_user", user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("scanner_password");
    localStorage.removeItem("scanner_user");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-clinic-50 px-4">
        <form onSubmit={handleLogin} className="glass w-full max-w-sm rounded-3xl p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="bg-brand-600 p-3 rounded-full text-white">
              <Camera className="size-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-ink mb-6 text-center">Control de Acceso</h1>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-2">Nombre del Validador</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Ej. Validador 1"
                className="glass-input w-full rounded-xl p-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-2">Contraseña de Scanner</label>
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
          </div>
          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition"
          >
            Iniciar Scanner
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-clinic-50">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white p-4 shadow-sm border-b border-brand-100 flex justify-between items-center z-10 relative">
          <div className="font-bold text-brand-700">Scanner Pineda</div>
          <button onClick={handleLogout} className="text-sm font-semibold text-red-500 hover:text-red-700">
            Cerrar Sesión
          </button>
        </header>

        {/* Configuración Rápida */}
        <div className="bg-white p-4 shadow-sm border-b border-brand-50 flex gap-2 overflow-x-auto z-10 relative">
          <div className="flex items-center gap-2 bg-clinic-50 rounded-lg p-2 border border-brand-100 shrink-0">
            <Building className="size-4 text-brand-600" />
            <select 
              value={salon} 
              onChange={(e) => setSalon(e.target.value)}
              className="bg-transparent text-sm font-semibold text-ink outline-none"
            >
              <option value="Salón Principal">Salón Principal</option>
              <option value="Salón Alterno">Salón Alterno</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-clinic-50 rounded-lg p-2 border border-brand-100 shrink-0">
            <Calendar className="size-4 text-brand-600" />
            <select 
              value={jornada} 
              onChange={(e) => setJornada(e.target.value)}
              className="bg-transparent text-sm font-semibold text-ink outline-none"
            >
              <option value="2026-11-02">Lunes 02</option>
              <option value="2026-11-03">Martes 03</option>
              <option value="2026-11-04">Miércoles 04</option>
              <option value="2026-11-05">Jueves 05</option>
              <option value="2026-11-06">Viernes 06</option>
            </select>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="flex-grow relative flex flex-col bg-black">
          <div id="reader" className="w-full h-full border-none"></div>
          
          {/* Ovelay de resultados */}
          {scanResult.status !== "idle" && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 ${
              scanResult.status === "loading" ? "bg-black/60" :
              scanResult.status === "success" ? "bg-emerald-600/95" : "bg-red-600/95"
            } transition-colors backdrop-blur-sm`}>
              
              {scanResult.status === "loading" && (
                <div className="text-white text-xl font-bold animate-pulse">{scanResult.message}</div>
              )}
              
              {scanResult.status === "success" && (
                <div className="text-center animate-in zoom-in duration-300">
                  <CheckCircle className="size-24 text-white mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-white mb-2">{scanResult.message}</h2>
                  <p className="text-emerald-100 text-lg mb-1">{scanResult.nombres}</p>
                  <span className="inline-block bg-white/20 text-white font-bold px-3 py-1 rounded-lg text-sm mt-2">
                    {scanResult.tipo}
                  </span>
                </div>
              )}
              
              {scanResult.status === "error" && (
                <div className="text-center animate-in zoom-in duration-300">
                  <XCircle className="size-24 text-white mx-auto mb-4" />
                  <h2 className="text-2xl font-black text-white mb-2">Acceso Denegado</h2>
                  <p className="text-red-100 text-lg font-medium">{scanResult.message}</p>
                </div>
              )}
              
            </div>
          )}
        </div>
        
        {/* Footer Info */}
        <div className="bg-white p-3 text-center text-xs text-ink-mute font-medium">
          Validador: {user}
        </div>
      </div>
    </main>
  );
}
