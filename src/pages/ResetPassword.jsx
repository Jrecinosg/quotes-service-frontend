import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import logo from "../assets/logo.png";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!oobCode) {
      setError("Este enlace no es válido. Solicita uno nuevo desde la pantalla de inicio de sesión.");
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setDone(true);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/expired-action-code") setError("Este enlace ya expiró. Solicita uno nuevo.");
      else if (err.code === "auth/invalid-action-code") setError("Este enlace ya fue usado o no es válido. Solicita uno nuevo.");
      else if (err.code === "auth/weak-password") setError("La contraseña debe tener al menos 6 caracteres.");
      else setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-surface p-8 rounded-xl shadow-lg border border-info/25">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-surface shadow-sm border border-line flex items-center justify-center mx-auto mb-3 p-2">
            <img src={logo} alt="Grupo AC" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">Restablecer contraseña</h2>
          <p className="text-sm mt-1 font-semibold text-transparent bg-clip-text bg-brand-gradient">Plataforma Grupo AC</p>
        </div>

        {done ? (
          <div className="text-center">
            <div className="mb-4 p-3 bg-ok/10 text-ok text-sm rounded-lg flex items-center gap-2 border border-ok/25">
              <CheckCircle2 size={18} />
              Tu contraseña se actualizó correctamente.
            </div>
            <Link
              to="/login"
              className="inline-block w-full btn btn-primary py-3 px-4 mt-2"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-bad/10 text-bad text-sm rounded-lg flex items-center gap-2 border border-bad/25">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-ink-muted w-5 h-5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn btn-primary py-3 px-4 mt-2 disabled:opacity-60"
              >
                {submitting ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
