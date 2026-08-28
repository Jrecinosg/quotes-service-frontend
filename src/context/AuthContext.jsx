import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "../firebase";
import { authService } from "../services/auth.service";
import Swal from 'sweetalert2';

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Registro con Correo
  const signup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return userCredential;
  };

  // 2. Login con Correo
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 3. Login con Google -en celular los navegadores casi siempre bloquean la
  // ventana emergente (auth/popup-blocked); si eso pasa, se cae a redirect
  // (misma pestaña, sin ventana emergente). En escritorio la ventana
  // emergente sigue siendo la experiencia normal.
  const loginWithGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const fallbackCodes = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'];
      if (fallbackCodes.includes(error.code)) {
        return signInWithRedirect(auth, googleProvider);
      }
      throw error;
    }
  };

  const resetPassword = (email) => {
    return authService.forgotPassword(email);
  };

  const logout = () => signOut(auth);

  // Captura errores del login con Google cuando volvio por redirect (celular)
  // -si el redirect si funciono, onAuthStateChanged de abajo ya lo agarra solo.
  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error("Error en el resultado del redirect de Google:", error);
      Swal.fire({
        icon: 'error',
        title: 'No se pudo iniciar sesión con Google',
        text: 'Intenta de nuevo o usa correo y contraseña.',
        confirmButtonColor: '#ef4444'
      });
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {

      // SI HAY USUARIO, SINCRONIZA CON BACKEND
      if (currentUser) {
        try {
          const dbUser = await authService.syncUser();

          setUser({
            ...currentUser,
            role: dbUser.role,
            name: currentUser.displayName || dbUser.name,
            clientId: dbUser.clientId || null,
            client: dbUser.client || null
          });

        } catch (error) {
          console.error("Error al sincronizar db", error);
          await signOut(auth);
          setUser(null);

          if (error.response?.status === 403) {
            Swal.fire({
              icon: 'error',
              title: 'Acceso Denegado',
              text: 'Tu correo no está autorizado para entrar al sistema. Contacta al Administrador.',
              confirmButtonColor: '#ef4444'
            });
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      signup,
      login,
      loginWithGoogle,
      logout,
      loading,
      resetPassword
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}