import { NextResponse, type NextRequest } from "next/server";
import { monitors } from "@/data/monitors";
import { parseCompareSlug } from "@/lib/routes";

/**
 * Con Cache Components las páginas leen `params` dentro de <Suspense> (navegación instantánea), así que un
 * notFound() llega cuando la respuesta ya ha empezado con 200. Aquí se validan los ids antes de renderizar
 * para que un modelo inexistente devuelva un 404 real.
 */

const IDS = new Set(monitors.map((m) => m.id));
const NOT_FOUND_PATH = "/_monitor-no-encontrado"; // sin ruta: Next sirve not-found con estado 404

export function proxy(request: NextRequest) {
  const [, section, slug] = request.nextUrl.pathname.split("/");
  const valid =
    section === "monitor"
      ? IDS.has(decodeURIComponent(slug ?? ""))
      : (parseCompareSlug(slug ?? "")?.every((id) => IDS.has(id)) ?? false);

  if (!valid) return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
}

export const config = {
  matcher: ["/monitor/:id", "/comparar/:ids"],
};
