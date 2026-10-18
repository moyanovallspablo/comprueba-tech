import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, OwnerData } from "@/components/legal/LegalPage";
import { DATA_SNAPSHOT } from "@/data/monitors";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos de uso",
  description:
    "Condiciones de uso de comprueba.tech: naturaleza orientativa de las recomendaciones, precisión de las especificaciones técnicas y variaciones de precio en tiendas externas.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Términos de uso"
      intro={
        <p>
          Estas condiciones regulan el uso de {LEGAL.siteName}. Al navegar por el sitio las aceptas; si no estás de
          acuerdo con ellas, te pedimos que no lo utilices.
        </p>
      }
    >
      <LegalSection id="servicio" title="1. Qué es y qué no es este servicio">
        <p>
          {LEGAL.siteName} es una herramienta gratuita que compara monitores y calcula recomendaciones a partir de los
          datos que introduces y de reglas publicadas en nuestras <Link href="/pautas-editoriales">pautas editoriales</Link>.
        </p>
        <p>
          Las recomendaciones son <strong>orientativas</strong>: ayudan a decidir, pero no sustituyen tu propio criterio
          ni constituyen asesoramiento profesional. La decisión de compra es siempre tuya.
        </p>
      </LegalSection>

      <LegalSection id="especificaciones" title="2. Precisión de las especificaciones técnicas">
        <ul>
          <li>
            Las especificaciones proceden de las fichas oficiales de los fabricantes. Un mismo modelo puede cambiar de
            componentes entre revisiones, lotes o regiones sin que el fabricante cambie su nombre.
          </li>
          <li>
            Algunas cifras de fabricante (tiempo de respuesta, brillo, cobertura de color) se miden en condiciones
            ideales y pueden no coincidir con el uso real.
          </li>
          <li>
            Las ilustraciones y vistas 3D se dibujan a escala con las medidas declaradas: sirven para comparar tamaños,
            no como representación exacta del producto.
          </li>
        </ul>
        <p>Antes de comprar, verifica en la tienda las especificaciones que sean decisivas para ti.</p>
      </LegalSection>

      <LegalSection id="precios" title="3. Precios, ofertas y disponibilidad">
        <ul>
          <li>
            Los precios que mostramos son <strong>orientativos</strong> del mercado español, con fecha de corte{" "}
            {DATA_SNAPSHOT}. No se actualizan en tiempo real.
          </li>
          <li>
            Los precios y la disponibilidad en tiendas externas como Amazon cambian con frecuencia, incluso varias veces
            al día, y pueden variar según el vendedor, la variante o el momento. Cuando algún dato proceda de los
            sistemas de una tienda, puede llegar con retraso o contener errores ajenos a nosotros.
          </li>
          <li>
            El precio válido es el que muestra la tienda en el momento de confirmar tu pedido. Los estados «buen precio»
            o «sobreprecio» y los precios objetivo se calculan con nuestros datos fechados y no son una oferta.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="compras" title="4. Compras en tiendas externas">
        <p>
          {LEGAL.siteName} no vende productos ni interviene en la compraventa. Al pulsar un enlace de compra, el contrato
          se celebra entre tú y la tienda o el vendedor, que son los responsables del pedido, el pago, la entrega, la
          garantía y el derecho de desistimiento. Algunos enlaces son de afiliación: te lo explicamos en las{" "}
          <Link href="/pautas-editoriales#afiliacion">pautas editoriales</Link>.
        </p>
      </LegalSection>

      <LegalSection id="uso" title="5. Uso aceptable">
        <p>Al usar el sitio te comprometes a no:</p>
        <ul>
          <li>Extraer de forma masiva o automatizada el catálogo o sus datos sin autorización.</li>
          <li>Intentar dañar, sobrecargar o acceder sin permiso a la infraestructura del sitio.</li>
          <li>Presentar el contenido o las recomendaciones como propios o como avalados por {LEGAL.siteName} fuera de contexto.</li>
        </ul>
      </LegalSection>

      <LegalSection id="responsabilidad" title="6. Limitación de responsabilidad">
        <p>
          Ponemos cuidado en la exactitud de los datos, pero no respondemos de los daños derivados de decisiones tomadas
          únicamente con la información del sitio, de errores en datos de terceros ni de interrupciones del servicio,
          salvo en los casos en que la ley no permita excluir esa responsabilidad. Nada en estos términos limita los
          derechos que te reconoce la normativa de consumidores.
        </p>
      </LegalSection>

      <LegalSection id="cambios" title="7. Cambios y legislación aplicable">
        <p>
          Podemos actualizar estos términos para reflejar cambios en el servicio o en la ley; la versión vigente es la
          publicada aquí con su fecha de revisión. Se rigen por la legislación española. Más información en el{" "}
          <Link href="/aviso-legal">aviso legal</Link> o escribiendo a <OwnerData value={LEGAL.email} />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
