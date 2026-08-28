import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, AlertCircle, Type } from "lucide-react";
import Swal from "sweetalert2";
import logo from "../assets/logo.png";

export default function Login() {
  const { login, signup, loginWithGoogle, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isRegistering, setIsRegistering] = useState(searchParams.get("mode") === "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Por favor, ingresa tu correo electrónico primero.");
      return;
    }

    try {
      await resetPassword(email);
      Swal.fire({
        icon: 'success',
        title: 'Correo enviado',
        text: `Se ha enviado un enlace de recuperación a ${email}`,
        confirmButtonColor: '#2563eb'
      });
    } catch (err) {
      console.error(err);
      setError("No se pudo enviar el correo de recuperación.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Limpia errores

    try {
      if (isRegistering) {
        try {
          await signup(email, password, name);
        } catch (signupErr) {
          // El correo ya tiene cuenta (de una invitacion anterior, por ejemplo):
          // en vez de dejar a la persona atascada en un error, se intenta
          // entrar directo con la misma contraseña que acaba de escribir.
          if (signupErr.code === 'auth/email-already-in-use') {
            await login(email, password);
          } else {
            throw signupErr;
          }
        }
      } else {
        await login(email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError(isRegistering
          ? "Ya tienes una cuenta con este correo, pero la contraseña no coincide. Usa \"¿Olvidaste tu contraseña?\" para restablecerla."
          : "Correo o contraseña incorrectos.");
      }
      else if (err.code === 'auth/email-already-in-use') setError("Este correo ya está registrado.");
      else if (err.code === 'auth/weak-password') setError("La contraseña debe tener al menos 6 caracteres.");
      else setError("Ocurrió un error. Intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-blue-100">

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-3 p-2">
            <img src={logo} alt="Grupo AC" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-800">
            {isRegistering ? "Crear Cuenta" : "Bienvenido de nuevo"}
          </h2>
          <p className="text-sm mt-1 font-semibold text-transparent bg-clip-text bg-brand-gradient">Plataforma Grupo AC</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <div className="relative">
                <Type className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  required={isRegistering}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Juan Pérez"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="ejemplo@empresa.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>

              {/* LINK: Olvidé mi contraseña -visible tambien en registro, por si
                  el correo ya tenia cuenta y la contraseña no coincide */}
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-gradient hover:brightness-105 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md mt-2"
          >
            {isRegistering ? "Registrarse" : "Iniciar Sesión"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O continúa con</span>
          </div>
        </div>

        <button
          onClick={loginWithGoogle}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Google
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          {isRegistering ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            {isRegistering ? "Inicia Sesión" : "Regístrate aquí"}
          </button>
        </p>
      </div>
    </div>
  );
}