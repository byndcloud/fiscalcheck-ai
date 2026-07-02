import { redirect } from "next/navigation";

/*
  Rota `/` redireciona ao acesso. Autenticação real virá em T03; até lá
  a home é apenas um shortcut para o fluxo de login mockado.
*/
export default function HomePage(): never {
  redirect("/login");
}
