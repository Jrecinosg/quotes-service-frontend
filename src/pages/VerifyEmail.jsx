import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import { auth } from "../firebase";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import logo from "../assets/logo.png";

// Pantalla a la que llega el enlace del correo "Verifica tu correo". El código del enlace
// se usa una sola vez, por eso se guarda en una referencia para no aplicarlo dos veces
// (el modo estricto de React ejecuta los efectos dos veces en desarrollo).
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const aplicado = useRef(false);

  const [estado, setEstado] = useState(oobCode ? "verificando" : "error");
  const [mensaje, setMensaje] = useState(
    oobCode ? "" : "Este enlace no es válido. Inicia sesión y te enviaremos uno nuevo."
  );

  useEffect(() => {
    if (!oobCode || aplicado.current) return;
    aplicado.current = true;

    applyActionCode(auth, oobCode)
      .then(() => setEstado("listo"))
      .catch((err) => {
        console.error(err);
        setEstado("error");
        if (err.code === "auth/expired-action-code") setMensaje("Este enlace ya expiró. Inicia sesión y te enviaremos uno nuevo.");
        else if (err.code === "auth/invalid-action-code") setMensaje("Este enlace ya fue usado o no es válido. Si ya verificaste tu correo, inicia sesión; si no, inicia sesión y te enviaremos uno nuevo.");
        else setMensaje("Ocurrió un error. Intenta de nuevo.");
      });
  }, [oobCode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-blue-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-3 p-2">
            <img src={logo} alt="Grupo AC" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-800">Verificar correo</h2>
          <p className="text-sm mt-1 font-semibold text-transparent bg-clip-text bg-brand-gradient">Plataforma Grupo AC</p>
        </div>

        {estado === "verificando" && (
          <div className="text-center text-gray-600 flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Verificando tu correo...
          </div>
        )}

        {estado === "listo" && (
          <div className="text-center">
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2 border border-green-100">
              <CheckCircle2 size={18} />
              Tu correo quedó verificado. Ya puedes iniciar sesión.
            </div>
            <Link
              to="/login"
              className="inline-block w-full bg-brand-gradient hover:brightness-105 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        )}

        {estado === "error" && (
          <div className="text-center">
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100 text-left">
              <AlertCircle size={18} className="shrink-0" />
              {mensaje}
            </div>
            <Link
              to="/login"
              className="inline-block w-full bg-brand-gradient hover:brightness-105 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
