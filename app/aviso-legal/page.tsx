import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, LegalPage, LegalSection, OwnerData } from "@/components/legal/LegalPage";
import { monitors } from "@/data/monitors";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Aviso Legal y Marca",
  description:
    "Titularidad de comprueba.tech conforme a la LSSI-CE, propiedad intelectual e industrial, uso de marcas de terceros y exención de responsabilidad sobre contenidos externos.",
};

const THIRD_PARTY_BRANDS = [...new Set(monitors.map((m) => m.marca))].sort((a, b) => a.localeCompare(b, "es"));

export default function LegalNoticePage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Aviso Legal y Marca"
      intro={
        <p>
          En cumplimiento de la Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información y de comercio
          electrónico (LSSI-CE), estos son los datos del titular de {LEGAL.siteName} y las condiciones que rigen el
          contenido del sitio.
        </p>
      }
    >
      <LegalSection id="titular" title="1. Titular del sitio web">
        <DataTable
          head={["Dato", "Valor"]}
          rows={[
            ["Titular", <OwnerData key="o" value={LEGAL.owner} />],
            ["NIF / CIF", <OwnerData key="t" value={LEGAL.taxId} />],
            ["Domicilio", <OwnerData key="a" value={LEGAL.address} />],
            ["Correo electrónico", <OwnerData key="e" value={LEGAL.email} />],
            ["Sitio web", LEGAL.domain],
            ...(LEGAL.registry ? [["Datos registrales", LEGAL.registry]] : []),
          ]}
        />
      </LegalSection>

      <LegalSection id="objeto" title="2. Objeto y acceso">
        <p>
          {LEGAL.siteName} es un servicio gratuito de información y comparación de monitores. El acceso no requiere
          registro. El uso del sitio implica la aceptación de este aviso legal y de los{" "}
          <Link href="/terminos">términos de uso</Link>.
        </p>
      </LegalSection>

      <LegalSection id="propiedad" title="3. Propiedad intelectual e industrial">
        <p>
          Los textos, el diseño, el código fuente, el motor de puntuación, las ilustraciones a escala y la selección y
          estructura de los datos son obra del titular o se usan con licencia, y están protegidos por el Real Decreto
          Legislativo 1/1996 (Ley de Propiedad Intelectual).
        </p>
        <p>
          <strong>Marca propia.</strong> La denominación «{LEGAL.siteName}», su logotipo y su isotipo son signos
          distintivos del titular. No pueden utilizarse sin autorización expresa y por escrito.
        </p>
        <p>
          Puedes enlazar libremente a cualquier página del sitio y citar fragmentos breves indicando la fuente. Queda
          prohibida la reproducción sustancial del contenido o de la base de datos del catálogo sin autorización.
        </p>
      </LegalSection>

      <LegalSection id="marcas-terceros" title="4. Marcas y contenidos de terceros">
        <p>
          Las marcas y nombres comerciales que aparecen en el sitio —entre ellos {THIRD_PARTY_BRANDS.join(", ")} y
          Amazon— pertenecen a sus respectivos titulares. Se mencionan únicamente para identificar los productos
          analizados, de forma descriptiva y conforme a los usos leales en materia comercial (artículo 37 de la Ley
          17/2001, de Marcas). Su aparición no implica patrocinio, afiliación ni respaldo por parte de esas empresas.
        </p>
        <p>
          Las fotografías de producto pertenecen a sus fabricantes o a Amazon y se muestran a partir del catálogo de
          Amazon en el marco de su Programa de Afiliados. Cuando no hay fotografía disponible se muestra una
          ilustración propia a escala.
        </p>
      </LegalSection>

      <LegalSection id="responsabilidad" title="5. Exención de responsabilidad">
        <ul>
          <li>
            <strong>Información orientativa.</strong> Las especificaciones proceden de los fabricantes y los precios son
            orientativos. Pueden contener errores o cambiar sin aviso; compruébalos en la tienda antes de comprar.
          </li>
          <li>
            <strong>Enlaces externos.</strong> El titular no controla ni responde de los contenidos, precios,
            disponibilidad, condiciones de venta o políticas de privacidad de los sitios enlazados. Conforme al
            artículo 17 de la LSSI-CE, retirará cualquier enlace en cuanto tenga conocimiento efectivo de que apunta a
            contenido ilícito.
          </li>
          <li>
            <strong>Compras.</strong> {LEGAL.siteName} no vende productos. Cualquier compra se formaliza directamente con
            la tienda correspondiente, que es la única responsable del pedido, la entrega, la garantía y las
            devoluciones.
          </li>
          <li>
            <strong>Disponibilidad.</strong> Se procura que el sitio funcione sin interrupciones, pero no se garantiza
            su disponibilidad continua ni la ausencia de errores técnicos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="ley" title="6. Legislación aplicable y jurisdicción">
        <p>
          Este aviso legal se rige por la legislación española. Si eres consumidor, cualquier controversia podrá
          resolverse ante los juzgados y tribunales de tu domicilio, según la normativa de consumo aplicable. Para
          cualquier consulta, escríbenos a <OwnerData value={LEGAL.email} />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
