import { useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
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

    // ---- hero canvas: animated light streaks ----
    const canvas = document.getElementById("hero-canvas");
    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, dpr;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener("resize", resize);
    resize();

    const cubicPoint = (t, p0, p1, p2, p3) => {
      const it = 1 - t;
      return {
        x: it * it * it * p0.x + 3 * it * it * t * p1.x + 3 * it * t * t * p2.x + t * t * t * p3.x,
        y: it * it * it * p0.y + 3 * it * it * t * p1.y + 3 * it * t * t * p2.y + t * t * t * p3.y,
      };
    };

    const streaksDef = [
      { pts: [[-.05, .62], [.22, .18], [.48, .7], [.78, .12]], color: [31, 140, 255], speed: .00013, phase: .05, w: 3.0 },
      { pts: [[-.08, .9], [.28, .48], [.55, 1.02], [.9, .34]], color: [255, 106, 0], speed: .000105, phase: .42, w: 2.6 },
      { pts: [[-.06, .32], [.3, -.05], [.6, .42], [1.02, -.08]], color: [111, 212, 255], speed: .00015, phase: .7, w: 2.1 },
      { pts: [[-.1, 1.08], [.24, .72], [.5, 1.15], [.95, .62]], color: [255, 176, 51], speed: .00011, phase: .2, w: 2.0 },
      { pts: [[-.05, .48], [.35, .2], [.62, .6], [1.05, .08]], color: [31, 140, 255], speed: .000095, phase: .85, w: 1.8 },
      { pts: [[-.08, .2], [.18, .55], [.5, .05], [1.05, .42]], color: [255, 106, 0], speed: .00012, phase: .55, w: 1.7 },
      { pts: [[-.06, .78], [.32, 1.05], [.58, .55], [1.0, .95]], color: [111, 212, 255], speed: .0001, phase: .15, w: 1.5 },
    ];

    const streaks = streaksDef.map((s) => ({
      p0: { x: s.pts[0][0], y: s.pts[0][1] }, p1: { x: s.pts[1][0], y: s.pts[1][1] },
      p2: { x: s.pts[2][0], y: s.pts[2][1] }, p3: { x: s.pts[3][0], y: s.pts[3][1] },
      color: s.color, speed: s.speed, phase: s.phase, width: s.w,
    }));

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h);
      streaks.forEach((s) => {
        ctx.beginPath();
        const steps = 48;
        for (let i = 0; i <= steps; i++) {
          const pt = cubicPoint(i / steps, s.p0, s.p1, s.p2, s.p3);
          const x = pt.x * w, y = pt.y * h;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},.32)`;
        ctx.lineWidth = s.width;
        ctx.stroke();
      });
    };

    const drawFrame = (t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      streaks.forEach((s) => {
        ctx.beginPath();
        const steps = 48;
        for (let i = 0; i <= steps; i++) {
          const pt = cubicPoint(i / steps, s.p0, s.p1, s.p2, s.p3);
          const x = pt.x * w, y = pt.y * h;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},.32)`;
        ctx.lineWidth = s.width;
        ctx.stroke();

        const tt = (t * s.speed + s.phase) % 1;
        const tailLen = 22;
        ctx.shadowColor = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},.9)`;
        for (let k = tailLen; k >= 0; k--) {
          let tk = tt - k * 0.011;
          if (tk < 0) tk += 1;
          const p = cubicPoint(tk, s.p0, s.p1, s.p2, s.p3);
          const alpha = Math.pow(1 - k / tailLen, 1.4);
          const r = s.width * (1 + (1 - k / tailLen) * 3);
          ctx.shadowBlur = 14 * (1 - k / tailLen);
          ctx.beginPath();
          ctx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha.toFixed(3)})`;
          ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      });
      ctx.globalCompositeOperation = "source-over";
    };

    let rafId = null;
    let cancelled = false;

    if (reducedMotion) {
      drawStatic();
    } else {
      const loop = (t) => {
        if (cancelled) return;
        drawFrame(t);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
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
            <Link className="btn-ghost" to="/login" aria-label="Ingresar al portal de clientes y colaboradores">
              <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="10" rx="1"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>
              Ingresar
            </Link>
            <a className="btn-cta" href="#contacto">Cotiza tu proyecto</a>
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
          <canvas id="hero-canvas"></canvas>
          <div className="aurora a1"></div>
          <div className="aurora a2"></div>
          <div className="aurora a3"></div>
          <div className="hero-hexes"></div>
          <div className="hero-vignette"></div>

          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow">Integrador de telecomunicaciones y seguridad electrónica</span>
              <h1>
                <span>PROTEGEMOS</span>
                <span className="c-blue">Y CONECTAMOS</span>
                <span className="c-orange">TU OPERACIÓN.</span>
              </h1>
              <p className="lede">Videovigilancia, control de acceso, enlaces de conectividad y cableado estructurado — diseñados, instalados y soportados por el mismo equipo, en todo Guatemala.</p>
              <div className="hero-cta-row">
                <a className="btn-cta" href="#contacto">Cotiza tu proyecto</a>
                <a className="link-scroll" href="#soluciones">
                  Conoce nuestras soluciones
                  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
                </a>
              </div>
            </div>

            <div className="quick-panel reveal">
              <div className="qp-head"><span>Áreas de servicio</span></div>
              <div className="qp-grid">
                <div className="qp-item">
                  <div className="qp-icon"><svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2"></rect><circle cx="9" cy="12" r="3"></circle><path d="M16 10l6-3.5v11L16 14"></path></svg></div>
                  <div className="lbl">Videovigilancia</div>
                </div>
                <div className="qp-item">
                  <div className="qp-icon"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path><circle cx="12" cy="15" r="1.6"></circle></svg></div>
                  <div className="lbl">Control de acceso</div>
                </div>
                <div className="qp-item">
                  <div className="qp-icon"><svg viewBox="0 0 24 24"><path d="M2 18a12 12 0 0 1 20 0"></path><path d="M6 18a8 8 0 0 1 12 0"></path><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"></circle></svg></div>
                  <div className="lbl">Enlaces y conectividad</div>
                </div>
                <div className="qp-item">
                  <div className="qp-icon"><svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="12" r="3"></circle><line x1="9" y1="12" x2="15" y2="12"></line><path d="M6 9V6M18 9V6"></path></svg></div>
                  <div className="lbl">Redes estructuradas</div>
                </div>
              </div>
            </div>
          </div>

          <div className="scroll-cue">
            DESLIZA
            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"></path></svg>
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
              <span className="eyebrow blue">Qué hacemos</span>
              <h2>Cuatro soluciones, una sola arquitectura</h2>
              <p>Cada línea se diseña pensando en cómo se conecta con las otras — no como proyectos aislados que después alguien tiene que hacer hablar entre sí.</p>
            </div>

            <div className="solutions-grid reveal">
              <div className="sol-card">
                <div className="sol-icon"><svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2"></rect><circle cx="9" cy="12" r="3"></circle><path d="M16 10l6-3.5v11L16 14"></path></svg></div>
                <span className="tag">Sistema 01</span>
                <h3>Videovigilancia</h3>
                <p>Cámaras IP, analítica de video y monitoreo centralizado para ver lo que pasa en tu operación, en vivo y en el histórico.</p>
              </div>
              <div className="sol-card">
                <div className="sol-icon"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path><circle cx="12" cy="15" r="1.6"></circle></svg></div>
                <span className="tag">Sistema 02</span>
                <h3>Control de acceso</h3>
                <p>Biometría, tarjetas y control de puertas o torniquetes, integrado con horarios y nómina para saber quién entra y cuándo.</p>
              </div>
              <div className="sol-card">
                <div className="sol-icon"><svg viewBox="0 0 24 24"><path d="M2 18a12 12 0 0 1 20 0"></path><path d="M6 18a8 8 0 0 1 12 0"></path><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"></circle></svg></div>
                <span className="tag">Sistema 03</span>
                <h3>Enlaces y conectividad</h3>
                <p>Radioenlaces y fibra óptica para conectar sedes, bodegas y sucursales sin depender de un único proveedor de internet.</p>
              </div>
              <div className="sol-card">
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
              <span className="eyebrow blue">Quiénes somos</span>
              <h2 style={{ marginTop: 12 }}>Un solo equipo detrás de toda tu infraestructura</h2>
              <p>Grupo AC es una empresa guatemalteca de telecomunicaciones y seguridad electrónica. Diseñamos, instalamos y damos soporte a los sistemas que mantienen a tu negocio funcionando y protegido: cámaras, accesos, enlaces y redes.</p>
              <p>Trabajamos como canal autorizado de las marcas del sector, lo que significa equipos certificados y garantía de fabricante vigente en cada proyecto que entregamos.</p>
            </div>
            <div className="nosotros-art reveal">
              <div className="glow"></div>
              <div className="ring r1"></div>
              <div className="ring r2"></div>
              <img src={logo} alt="Grupo AC" />
            </div>
          </div>
        </section>

        <section id="trabajo">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="eyebrow blue">Nuestro trabajo</span>
              <h2>Sectores donde operamos</h2>
              <p>La misma arquitectura de video, accesos, enlaces y cableado se adapta a distintos tipos de operación.</p>
            </div>
            <div className="sectors reveal">
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
        </section>

        <section id="proceso">
          <div className="wrap">
            <div className="section-head reveal">
              <span className="eyebrow blue">Cómo trabajamos</span>
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
                <a href="mailto:info@grupo-ac.com.gt">info@grupo-ac.com.gt</a>
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
