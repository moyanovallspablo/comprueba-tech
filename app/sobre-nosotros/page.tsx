import type { Metadata } from "next";
import Link from "next/link";
import { PROFILE_OPTIONS } from "@/components/advisor/setup";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { DATA_SNAPSHOT, monitors } from "@/data/monitors";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "comprueba.tech es un motor algorítmico que compara monitores con reglas públicas y deterministas: te dice qué comprar para tu uso y qué sacrificas con cada opción.",
};

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="Proyecto"
      title="Sobre nosotros"
      intro={
        <p>
          comprueba.tech nace de una frustración: elegir monitor obliga a cruzar decenas de fichas técnicas, reseñas
          contradictorias y listas de «los mejores» que rara vez explican por qué. Aquí la respuesta la da un motor de
          cálculo con reglas públicas, y siempre viene acompañada de lo que cedes.
        </p>
      }
    >
      <LegalSection id="motor" title="Un motor algorítmico, no una opinión">
        <p>
          El corazón del proyecto es un motor de decisión que puntúa cada monitor del catálogo (hoy{" "}
          {monitors.length} modelos) para un uso concreto. Le dices cómo vas a usarlo —{" "}
          {PROFILE_OPTIONS.map((p) => p.label.toLowerCase()).join(", ")}—, tu presupuesto y tu equipo, y calcula una
          nota de 0 a 100 a partir de seis criterios: calidad de imagen, fluidez, conectividad, ergonomía, relación
          calidad-precio y madurez en el mercado.
        </p>
        <p>
          El resultado no es solo un ganador. Cada monitor recibe un veredicto (recomendado, solo con oferta o
          descartado), una explicación en lenguaje claro de lo que ganas y lo que sacrificas, y, si no encaja, el precio
          al que pasaría a merecer la pena.
        </p>
      </LegalSection>

      <LegalSection id="transparencia" title="Transparencia técnica">
        <ul>
          <li>
            <strong>Reglas deterministas.</strong> Con los mismos datos y el mismo setup, el resultado es siempre el
            mismo. No hay ajustes manuales caso a caso ni posiciones compradas.
          </li>
          <li>
            <strong>Pesos publicados.</strong> Cuánto pesa cada criterio en cada perfil está detallado en nuestras{" "}
            <Link href="/pautas-editoriales">pautas editoriales</Link>.
          </li>
          <li>
            <strong>Sin datos de afiliación en el cálculo.</strong> El motor no conoce qué enlaces generan comisión ni
            cuánto. Esa separación está en el propio código: la puntuación y los enlaces de compra viven en módulos
            distintos.
          </li>
          <li>
            <strong>Se calcula en tu navegador.</strong> Las recomendaciones personalizadas se generan en tu dispositivo
            con los datos que introduces; no se envían a ningún servidor.
          </li>
          <li>
            <strong>Datos fechados.</strong> Especificaciones de fabricante y precios orientativos del mercado español,
            con fecha de corte ({DATA_SNAPSHOT}). Cuando los datos envejecen, lo decimos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="vision" title="Hacia dónde vamos">
        <p>
          Queremos que comprar tecnología se parezca más a una decisión informada que a una apuesta. El objetivo es
          ampliar el catálogo y llevar el mismo método a otras categorías sin renunciar a tres principios: explicar
          cada recomendación, mostrar sus sacrificios y no dejar que la financiación del proyecto toque el resultado.
        </p>
        <p>
          El proyecto se financia con comisiones de afiliación cuando compras a través de nuestros enlaces, sin coste
          adicional para ti. Cómo funciona exactamente está explicado en las{" "}
          <Link href="/pautas-editoriales#afiliacion">pautas editoriales</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
