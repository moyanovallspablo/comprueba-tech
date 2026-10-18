import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "comprueba.tech no usa cookies de analítica ni de publicidad. Qué guarda el almacenamiento local de tu navegador, por qué es técnico y cómo borrarlo.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Política de Cookies"
      intro={
        <p>
          Resumen: {LEGAL.siteName} <strong className="font-semibold text-ink">no instala cookies</strong>, ni propias ni
          de terceros, y no usa analítica ni publicidad. Solo guarda en tu navegador las preferencias que tú introduces
          para no tener que repetirlas. Por eso no verás un banner de consentimiento.
        </p>
      }
    >
      <LegalSection id="que-son" title="1. Cookies y almacenamiento local">
        <p>
          Las cookies son pequeños archivos que un sitio guarda en tu navegador. El artículo 22.2 de la LSSI-CE se aplica
          también a tecnologías equivalentes, como el <strong>almacenamiento local</strong> (localStorage), que es lo
          único que usamos. A diferencia de una cookie, lo que se guarda en el almacenamiento local no viaja al servidor
          con cada visita.
        </p>
      </LegalSection>

      <LegalSection id="que-usamos" title="2. Qué guardamos en tu navegador">
        <DataTable
          head={["Clave", "Tipo", "Finalidad", "Duración"]}
          rows={[
            [
              <code key="k" className="font-mono text-xs">comprueba.setup.v1</code>,
              "Almacenamiento local · propio · técnico",
              "Recordar tu setup (uso, presupuesto, dispositivo, gráfica, monitor actual y medidas de la mesa) entre páginas y visitas.",
              "Hasta que lo borres.",
            ],
          ]}
        />
        <p>
          Estos datos se quedan en tu dispositivo: no los enviamos a nuestro servidor ni a nadie, y no sirven para
          identificarte ni para seguir tu navegación. Si tu navegador bloquea el almacenamiento local, el sitio funciona
          igual, pero olvidará tu setup al cerrar la pestaña.
        </p>
        <p>
          Al tratarse de un almacenamiento necesario para prestar una función que tú solicitas expresamente, está exento
          del deber de consentimiento según el artículo 22.2 de la LSSI-CE y la Guía sobre el uso de las cookies de la
          Agencia Española de Protección de Datos.
        </p>
      </LegalSection>

      <LegalSection id="terceros" title="3. Cookies de terceros">
        <p>
          Ninguna página de {LEGAL.siteName} carga contenido de terceros que instale cookies: las fuentes y las
          fotografías de producto se sirven desde nuestro propio dominio.
        </p>
        <p>
          Cuando pulsas un enlace de compra y entras en Amazon, es Amazon quien instala sus propias cookies en su
          dominio, incluida la que registra que llegaste desde nuestro enlace de afiliado. Esas cookies se rigen por el
          aviso de cookies de Amazon y las gestionas desde su web.
        </p>
      </LegalSection>

      <LegalSection id="control" title="4. Cómo controlarlo y borrarlo">
        <ul>
          <li>
            <strong>Desde el sitio:</strong> en el panel «Mi Setup», «Empezar de cero» restablece los valores por
            defecto.
          </li>
          <li>
            <strong>Desde el navegador:</strong> para eliminar la clave por completo, borra los datos del sitio{" "}
            {LEGAL.domain} en la configuración de privacidad de tu navegador (en Chrome, Edge, Firefox y Safari aparece
            como «datos de sitios» o «cookies y datos de sitios»).
          </li>
          <li>
            <strong>Navegación privada:</strong> en modo incógnito el almacenamiento local se borra al cerrar la ventana.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="cambios" title="5. Cambios en esta política">
        <p>
          Si algún día incorporamos cookies o tecnologías no exentas (por ejemplo, analítica), actualizaremos esta página
          y te pediremos consentimiento antes de activarlas. Más información sobre cómo tratamos los datos en la{" "}
          <Link href="/privacidad">política de privacidad</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
