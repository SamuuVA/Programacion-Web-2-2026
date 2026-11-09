import { logoutAction } from "../actions";

export function LogoutButton() {
  return (
    <form action={logoutAction} className="logout-form">
      <button className="link-button" type="submit">
        Cerrar sesión
      </button>
    </form>
  );
}
