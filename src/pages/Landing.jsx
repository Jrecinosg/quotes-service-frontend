import { useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import logoOscuro from "../assets/logo-transparente.webp";
import "./Landing.css";

export default function Landing() {
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const header = document.getElementById("site-header");
    const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 30);
    window.addEventListener("scroll", onScroll);

    // El sitio usa HashRouter (rutas viven en el # de la URL), así que los
    // anclas internas del tipo href="#soluciones" NO pueden dejarse nativas:
    // el router las interpretaría como una navegación a la ruta "/soluciones"
    // (que no existe) y terminaría mandando a /login. Interceptamos el clic
    // y hacemos scroll a mano, sin tocar el hash de la URL.
    const root = document.querySelector(".gac-landing");
    const sectionAnchorSelector = ["inicio", "soluciones", "nosotros", "trabajo", "contacto"]
      .map((id) => `a[href="#${id}"]`).join(", ");
    const anchorLinks = root ? Array.from(root.querySelectorAll(sectionAnchorSelector)) : [];
    const onAnchorClick = (e) => {
      const href = e.currentTarget.getAttribute("href");
      const targetId = href.slice(1);
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
      e.preventDefault();
      const offset = (header ? header.offsetHeight : 0) + 16;
      const top = targetEl.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: reducedMotionQuery.matches ? "auto" : "smooth" });
    };
    anchorLinks.forEach((a) => a.addEventListener("click", onAnchorClick));

    // Entrada por enlace directo (#nosotros, etc.): main.jsx guardó la sección; vamos a ella.
    let anclaTimer;
    try {
      const ancla = sessionStorage.getItem("gac-ancla");
      if (ancla) {
        anclaTimer = setTimeout(() => {
          sessionStorage.removeItem("gac-ancla");
          const el = document.getElementById(ancla);
          if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - ((header ? header.offsetHeight : 0) + 16), behavior: "auto" });
        }, 120);
      }
    } catch { /* sin almacenamiento */ }

    const revealObservers = [];
    document.querySelectorAll(".reveal").forEach((el) => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      io.observe(el);
      revealObservers.push(io);
    });

    const sectionIds = ["inicio", "soluciones", "nosotros", "trabajo", "contacto"];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    const navLinks = document.querySelectorAll(".nav-links a");
    const railLinks = document.querySelectorAll(".rail a");
    const secIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
          railLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
        }
      });
    }, { threshold: 0.5 });
    sections.forEach((s) => secIO.observe(s));

    return () => {
      clearTimeout(anclaTimer);
      window.removeEventListener("scroll", onScroll);
      anchorLinks.forEach((a) => a.removeEventListener("click", onAnchorClick));
      revealObservers.forEach((io) => io.disconnect());
      secIO.disconnect();
    };
  }, []);

  return (
    <div className="gac-landing">
      <header id="site-header">
        <div className="nav">
          <div className="brand">
            <img src={logo} alt="Grupo AC" />
            <div className="brand-text">
              <span className="name">GRUPO <b>AC</b></span>
              <span className="tag">Tecnoseguridad e Informática</span>
            </div>
          </div>
          <nav className="nav-links">
            <a href="#inicio" className="active">Inicio</a>
            <a href="#soluciones">Soluciones</a>
            <a href="#nosotros">Nosotros</a>
            <a href="#trabajo">Nuestro trabajo</a>
            <a href="#contacto">Contacto</a>
          </nav>
          <div className="nav-actions">
            <Link className="btn btn-secondary" to="/login" aria-label="Ingresar al portal de clientes y colaboradores">
              <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="10" rx="1"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>
              Portal
            </Link>
            <a className="btn btn-cta" href="#contacto">Cotiza tu proyecto</a>
          </div>
        </div>
      </header>

      <nav className="rail" aria-label="Secciones">
        <a href="#inicio" className="active" aria-label="Inicio"></a>
        <a href="#soluciones" aria-label="Soluciones"></a>
        <a href="#nosotros" aria-label="Nosotros"></a>
        <a href="#trabajo" aria-label="Nuestro trabajo"></a>
        <a href="#contacto" aria-label="Contacto"></a>
      </nav>

      <main>
        <section className="hero" id="inicio">
          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow mono rise" style={{ "--i": 0 }}>Integrador de telecomunicaciones y seguridad electrónica</span>
              <h1 className="rise" style={{ "--i": 1 }}>
                <span>Protegemos</span>
                <span className="c-blue">y conectamos</span>
                <span className="c-warm">tu operación.</span>
              </h1>
              <p className="lede rise" style={{ "--i": 2 }}>Videovigilancia, control de acceso, enlaces de conectividad y cableado estructurado — diseñados, instalados y soportados por el mismo equipo, en todo Guatemala.</p>
              <div className="hero-cta-row rise" style={{ "--i": 3 }}>
                <a className="btn btn-primary btn-hero-primary" href="#contacto">Cotiza tu proyecto</a>
                <a className="btn btn-secondary" href="#soluciones">
                  Conoce nuestras soluciones
                  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
                </a>
              </div>
            </div>

            <div className="ops rise" style={{ "--i": 2 }} role="img" aria-label="Ejemplo ilustrativo de un centro de operación: plano con cámaras y zonas de cobertura">
              <div className="ops-top"><span className="dot"></span>Centro de operación · ejemplo ilustrativo</div>
              <svg className="plan" viewBox="0 0 420 210" fill="none" aria-hidden="true">
                <defs>
                  <radialGradient id="gac-cone" cx="0" cy="0" r="1"><stop offset="0" stopColor="#00C2FF" stopOpacity=".55" /><stop offset="1" stopColor="#00C2FF" stopOpacity="0" /></radialGradient>
                  <radialGradient id="gac-coneW" cx="0" cy="0" r="1"><stop offset="0" stopColor="#F5B94A" stopOpacity=".6" /><stop offset="1" stopColor="#F5B94A" stopOpacity="0" /></radialGradient>
                </defs>
                <rect x="10" y="10" width="400" height="190" rx="10" stroke="rgba(255,255,255,.22)" strokeWidth="2" />
                <path d="M150 10V120M150 120H10M270 10V90M270 90H410M270 90V200M150 160V200" stroke="rgba(255,255,255,.13)" strokeWidth="2" />
                <g fontFamily="IBM Plex Mono,monospace" fontSize="8" letterSpacing="1.2" fill="#6F86A0">
                  <text x="22" y="28">RECEPCIÓN</text><text x="162" y="28">BODEGA 2</text><text x="282" y="28">PASILLO A</text><text x="22" y="190">ENTRADA</text><text x="282" y="190">PARQUEO</text>
                </g>
                <path className="fov" d="M80 60 L40 20 A60 60 0 0 1 120 20Z" fill="url(#gac-cone)" style={{ "--d": 0 }} />
                <path className="fov" d="M210 60 L170 110 A60 60 0 0 0 250 110Z" fill="url(#gac-cone)" style={{ "--d": 1 }} />
                <path className="fov" d="M340 40 L290 70 A60 60 0 0 0 390 70Z" fill="url(#gac-cone)" style={{ "--d": 2 }} />
                <path className="fov" d="M60 170 L20 130 A60 60 0 0 1 100 130Z" fill="url(#gac-cone)" style={{ "--d": 3 }} />
                <path className="fov" d="M340 140 L290 175 A60 60 0 0 0 390 175Z" fill="url(#gac-coneW)" style={{ "--d": 4 }} />
                <g fill="#007BFF" stroke="#fff" strokeWidth="1.5"><circle cx="80" cy="60" r="5" /><circle cx="210" cy="60" r="5" /><circle cx="340" cy="40" r="5" /><circle cx="60" cy="170" r="5" /></g>
                <circle cx="340" cy="140" r="5" fill="#F5B94A" stroke="#fff" strokeWidth="1.5" />
                <circle className="ring" cx="340" cy="140" r="5" stroke="#F5B94A" strokeWidth="1.5" />
                <g className="walker"><rect x="-9" y="-13" width="18" height="26" rx="3" stroke="#22C3A6" strokeWidth="1.5" /><circle r="3" fill="#22C3A6" /></g>
              </svg>
              <div className="ops-grid">
                <div className="mini">
                  <h4>Enlace sede ↔ sucursal</h4>
                  <svg className="topo" viewBox="0 0 260 84" fill="none" aria-hidden="true">
                    <defs><linearGradient id="gac-g"><stop stopColor="#00C2FF" /><stop offset="1" stopColor="#007BFF" /></linearGradient></defs>
                    <path d="M20 62 C 80 62, 90 22, 130 22 S 190 62, 240 62" stroke="rgba(255,255,255,.14)" strokeWidth="2" />
                    <path className="pulse" d="M20 62 C 80 62, 90 22, 130 22 S 190 62, 240 62" stroke="url(#gac-g)" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="20" cy="62" r="6" fill="#007BFF" /><circle cx="130" cy="22" r="6" fill="#00C2FF" /><circle cx="240" cy="62" r="6" fill="#22C3A6" />
                  </svg>
                </div>
                <div className="mini"><h4>Puertas con acceso</h4><div className="n">12<small>de 12 en línea</small></div></div>
              </div>
            </div>
          </div>
        </section>

        <div className="wrap">
          <div className="trust-strip reveal">
            <div className="trust-item">
              <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M9 9h6v6H9zM4 9H2M4 15H2M22 9h-2M22 15h-2M9 4V2M15 4V2M9 22v-2M15 22v-2"></path></svg>
              <span>Tecnología de vanguardia, con equipos y marcas líderes del sector.</span>
            </div>
            <div className="trust-item">
              <svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"></path><path d="M9 12l2 2 4-4"></path></svg>
              <span>Canal autorizado, con garantía de fabricante vigente en cada proyecto.</span>
            </div>
            <div className="trust-item">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"></path></svg>
              <span>Un mismo equipo propio, del diseño a la instalación y el soporte.</span>
            </div>
            <div className="trust-item">
              <svg viewBox="0 0 24 24"><path d="M3 18v-2a4 4 0 0 1 4-4h1M21 18v-2a4 4 0 0 0-4-4h-1"></path><circle cx="8" cy="8" r="3"></circle><circle cx="16" cy="8" r="3"></circle><path d="M3 18a3 3 0 0 1 3-3M21 18a3 3 0 0 0-3-3"></path></svg>
              <span>Soporte técnico especializado después de la instalación.</span>
            </div>
          </div>
        </div>

        <section id="soluciones">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="eyebrow mono">Qué hacemos</span>
              <h2>Cuatro soluciones, una sola arquitectura</h2>
              <p>Cada línea se diseña pensando en cómo se conecta con las otras — no como proyectos aislados que después alguien tiene que hacer hablar entre sí.</p>
            </div>

            <div className="solutions-grid reveal">
              <div className="sol-card">
                <svg className="go" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
                <div className="sol-icon"><svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2"></rect><circle cx="9" cy="12" r="3"></circle><path d="M16 10l6-3.5v11L16 14"></path></svg></div>
                <span className="tag">Sistema 01</span>
                <h3>Videovigilancia</h3>
                <p>Cámaras IP, analítica de video y monitoreo centralizado para ver lo que pasa en tu operación, en vivo y en el histórico.</p>
              </div>
              <div className="sol-card">
                <svg className="go" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
                <div className="sol-icon"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path><circle cx="12" cy="15" r="1.6"></circle></svg></div>
                <span className="tag">Sistema 02</span>
                <h3>Control de acceso</h3>
                <p>Biometría, tarjetas y control de puertas o torniquetes, integrado con horarios y nómina para saber quién entra y cuándo.</p>
              </div>
              <div className="sol-card">
                <svg className="go" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
                <div className="sol-icon"><svg viewBox="0 0 24 24"><path d="M2 18a12 12 0 0 1 20 0"></path><path d="M6 18a8 8 0 0 1 12 0"></path><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"></circle></svg></div>
                <span className="tag">Sistema 03</span>
                <h3>Enlaces y conectividad</h3>
                <p>Radioenlaces y fibra óptica para conectar sedes, bodegas y sucursales sin depender de un único proveedor de internet.</p>
              </div>
              <div className="sol-card">
                <svg className="go" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
                <div className="sol-icon"><svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="12" r="3"></circle><line x1="9" y1="12" x2="15" y2="12"></line><path d="M6 9V6M18 9V6"></path></svg></div>
                <span className="tag">Sistema 04</span>
                <h3>Redes estructuradas</h3>
                <p>Cableado de datos y eléctrico certificado, diseñado para crecer con tu empresa sin necesidad de reobras.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="nosotros">
          <div className="wrap nosotros">
            <div className="nosotros-copy reveal">
              <span className="eyebrow mono">Quiénes somos</span>
              <h2>Un solo equipo detrás de toda tu infraestructura</h2>
              <p>Grupo AC es una empresa guatemalteca de telecomunicaciones y seguridad electrónica. Diseñamos, instalamos y damos soporte a los sistemas que mantienen a tu negocio funcionando y protegido: cámaras, accesos, enlaces y redes.</p>
              <p>Trabajamos como canal autorizado de las marcas del sector, lo que significa equipos certificados y garantía de fabricante vigente en cada proyecto que entregamos.</p>
            </div>
            <div className="nosotros-art reveal">
              <img src={logoOscuro} alt="Grupo AC" />
            </div>
          </div>
        </section>

        <section id="trabajo">
          <div className="wrap two">
            <div className="reveal">
              <span className="eyebrow mono">Nuestro trabajo</span>
              <h2>Sectores donde operamos</h2>
              <p className="section-sub" style={{ color: "#8DA2B8", maxWidth: "40em" }}>La misma arquitectura de video, accesos, enlaces y cableado se adapta a distintos tipos de operación.</p>
              <div className="sectors">
                <div className="sector">
                  <svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"></path></svg>
                  <h3>Industria y manufactura</h3>
                  <p>Plantas, bodegas y líneas de producción.</p>
                </div>
                <div className="sector">
                  <svg viewBox="0 0 24 24"><path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"></path><path d="M9 21v-6h6v6"></path></svg>
                  <h3>Comercios y retail</h3>
                  <p>Tiendas y cadenas con varias sucursales.</p>
                </div>
                <div className="sector">
                  <svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="1"></rect><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"></path></svg>
                  <h3>Corporativo y oficinas</h3>
                  <p>Edificios corporativos y centros de negocio.</p>
                </div>
                <div className="sector">
                  <svg viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="12" rx="1"></rect><path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"></path><path d="M2 13h20"></path></svg>
                  <h3>Bodegas y logística</h3>
                  <p>Centros de distribución y almacenamiento.</p>
                </div>
              </div>
            </div>
            <div className="reveal">
              <div className="portal" role="img" aria-label="Ejemplo ilustrativo del portal de clientes con solicitudes y garantías">
                <div className="bar"><i></i><i></i><i></i></div>
                <h4>Portal de clientes · tus solicitudes</h4>
                <div className="req"><div className="t">Revisión de cámara de parqueo<small>Solicitud de servicio</small></div><span className="pill p-new">Nueva</span></div>
                <div className="req"><div className="t">Mantenimiento de enlace<small>Solicitud de servicio</small></div><span className="pill p-wait">En proceso</span></div>
                <div className="req"><div className="t">Cambio de lector biométrico<small>Garantía</small></div><span className="pill p-ok">Resuelta</span></div>
              </div>
              <p className="portal-cap">Ejemplo ilustrativo del portal</p>
            </div>
          </div>
        </section>

        <section id="proceso">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="eyebrow mono">Cómo trabajamos</span>
              <h2>De la visita técnica al soporte continuo</h2>
            </div>
            <div className="process reveal">
              <div className="step"><span className="idx">01</span><h3>Diagnóstico</h3><p>Se levanta el estado actual del sitio y las necesidades reales de la operación.</p></div>
              <div className="step"><span className="idx">02</span><h3>Diseño</h3><p>Se propone la arquitectura de cámaras, accesos, enlaces y cableado.</p></div>
              <div className="step"><span className="idx">03</span><h3>Instalación</h3><p>Se ejecuta el proyecto con el mismo equipo que hizo el diseño.</p></div>
              <div className="step"><span className="idx">04</span><h3>Soporte</h3><p>Mantenimiento y monitoreo continuo una vez el sistema está en operación.</p></div>
            </div>
          </div>
        </section>

        <section id="contacto">
          <div className="wrap">
            <div className="contact-panel reveal">
              <div>
                <h2>Hablemos de tu proyecto</h2>
                <p>Cuéntanos qué necesita tu operación y te contactamos para agendar una visita de diagnóstico.</p>
              </div>
              <div className="contact-links">
                <a className="btn btn-primary" href="mailto:info@grupo-ac.com.gt">Pedir visita de diagnóstico</a>
                <a className="btn btn-secondary" href="mailto:info@grupo-ac.com.gt">info@grupo-ac.com.gt</a>
                <span className="domain">grupo-ac.com.gt</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot-grid">
          <div className="foot-brand">
            <img src={logo} alt="Grupo AC" />
            <div>
              <div className="name">GRUPO AC</div>
              <div className="foot-copy">© 2026 Tecnoseguridad e Informática, S.A. — Guatemala.</div>
            </div>
          </div>
          <nav className="foot-nav">
            <a href="#soluciones">Soluciones</a>
            <a href="#nosotros">Nosotros</a>
            <a href="#trabajo">Nuestro trabajo</a>
            <a href="#contacto">Contacto</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
