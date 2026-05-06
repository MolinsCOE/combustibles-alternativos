import type { KeyboardEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useRole } from "../auth/useRole.js";
import type { CaSession } from "../auth/RoleContext.js";
import { rolHomePath } from "../auth/rolHomePath.js";
import { autenticarUsuario } from "../auth/mockUsers.js";

export function LoginPage() {
  const { login } = useRole();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEntrar = () => {
    if (!username.trim()) {
      setError("Introduce tu nombre de usuario.");
      return;
    }
    if (!password) {
      setError("Introduce tu contraseña.");
      return;
    }

    const usuario = autenticarUsuario(username.trim(), password);
    if (!usuario) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    setError(null);

    const session: CaSession = {
      nombre: usuario.nombre,
      rol: usuario.rol,
      proveedorId: usuario.proveedorId
    };
    login(session);
    void navigate(rolHomePath(usuario.rol), { replace: true });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleEntrar();
  };

  return (
    <div className="ca-login">
      {/* Panel izquierdo — identidad y descripción del flujo */}
      <div className="ca-login__left">
        <div className="ca-login__brand">
          <img
            src="/brand/molins-logo.png"
            alt="Molins"
            className="ca-login__brand-logo"
          />
        </div>

        <div className="ca-login__hero-text">
          <h1 className="ca-login__headline">
            Combustibles Alternativos
          </h1>
          <p className="ca-login__subheadline">
            Un único flujo para coordinar producción, compras y proveedores
            sin correos manuales ni hojas de cálculo.
          </p>
        </div>

        <ol className="ca-login__steps">
          <li>
            <span className="ca-login__step-num">1</span>
            <div>
              <strong>Producción solicita</strong>
              <span>Indica los viajes que necesita por material y día</span>
            </div>
          </li>
          <li>
            <span className="ca-login__step-num">2</span>
            <div>
              <strong>Compras distribuye</strong>
              <span>Asigna proveedor y transportista y envía la planificación</span>
            </div>
          </li>
          <li>
            <span className="ca-login__step-num">3</span>
            <div>
              <strong>El proveedor confirma</strong>
              <span>Acepta o rechaza cada línea desde su vista</span>
            </div>
          </li>
          <li>
            <span className="ca-login__step-num">4</span>
            <div>
              <strong>Seguimiento en tiempo real</strong>
              <span>Cruza lo planificado con lo que llega realmente</span>
            </div>
          </li>
        </ol>
      </div>

      {/* Panel derecho — formulario de acceso */}
      <div className="ca-login__right">
        <div className="ca-login__card">
          <div className="ca-login__card-header">
            <img
              src="/brand/molins-symbol.png"
              alt=""
              aria-hidden="true"
              className="ca-login__card-symbol"
            />
            <h2 className="ca-login__card-title">Acceder al módulo</h2>
          </div>

          <div className="ca-login__field">
            <label htmlFor="ca-username">Usuario</label>
            <input
              id="ca-username"
              type="text"
              placeholder="Ej. produccion"
              value={username}
              autoComplete="username"
              autoFocus
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              onKeyDown={handleKeyDown}
              aria-invalid={error !== null ? "true" : undefined}
            />
          </div>

          <div className="ca-login__field">
            <label htmlFor="ca-password">Contraseña</label>
            <div className="ca-login__password-wrapper">
              <input
                id="ca-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                aria-invalid={error !== null ? "true" : undefined}
              />
              <button
                type="button"
                className="ca-login__toggle-password"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={0}
              >
                {showPassword
                  ? <EyeOff size={18} aria-hidden="true" />
                  : <Eye size={18} aria-hidden="true" />
                }
              </button>
            </div>
          </div>

          {error && (
            <p className="ca-login__error" role="alert">{error}</p>
          )}

          <button
            type="button"
            className="ca-login__btn-entrar"
            onClick={handleEntrar}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
