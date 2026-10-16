const COMPARE_SEPARATOR = "-vs-";

export const monitorHref = (id: string) => `/monitor/${id}`;

export const compareHref = (a: string, b: string) => `/comparar/${a}${COMPARE_SEPARATOR}${b}`;

/** Ancla de la comparativa que abre el visor 3D al llegar (botón "Lanzar comparativa 3D" del hub). */
export const SPATIAL_ANCHOR = "espacio-3d";
export const compare3dHref = (a: string, b: string) => `${compareHref(a, b)}#${SPATIAL_ANCHOR}`;

/** "dell-u2724de-vs-lg-27gr83q" → ["dell-u2724de", "lg-27gr83q"]. Los ids nunca contienen "-vs-". */
export function parseCompareSlug(slug: string): [string, string] | null {
  const parts = decodeURIComponent(slug).split(COMPARE_SEPARATOR);
  if (parts.length !== 2 || !parts[0] || !parts[1] || parts[0] === parts[1]) return null;
  return [parts[0], parts[1]];
}
