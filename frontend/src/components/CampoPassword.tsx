import { useState } from "react";
import { IconOjo, IconOjoTachado } from "./Icons";

type Props = {
  name: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
};

/** Campo de contraseña con botón de ojo para mostrar u ocultar lo escrito. */
export default function CampoPassword({ name, placeholder, minLength, maxLength }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="campo-password">
      <input
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete="new-password"
        required
      />
      <button
        type="button"
        className="ojo-btn"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <IconOjo size={20} /> : <IconOjoTachado size={20} />}
      </button>
    </div>
  );
}
