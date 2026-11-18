import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { HashRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import InteractionFx from './components/InteractionFx.jsx'

// Enlaces directos a secciones de la portada (p. ej. https://grupo-ac.com.gt/#nosotros):
// con HashRouter el router los tomaría como la ruta "/nosotros" y terminaría en el login.
// Los convertimos a la portada ("#/") y guardamos la sección para que Landing haga el scroll.
const SECCIONES_PORTADA = ["inicio", "soluciones", "nosotros", "trabajo", "proceso", "contacto"];
const hashInicial = window.location.hash.replace(/^#/, "");
if (SECCIONES_PORTADA.includes(hashInicial)) {
  try { sessionStorage.setItem("gac-ancla", hashInicial); } catch { /* sin almacenamiento: abre en el inicio */ }
  window.history.replaceState(null, "", window.location.pathname + window.location.search + "#/");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <InteractionFx />
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
