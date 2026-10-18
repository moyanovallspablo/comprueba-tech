import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, LegalPage, LegalSection, OwnerData } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Qué datos trata comprueba.tech conforme al RGPD y la LOPDGDD: responsable, finalidades, bases legales, ausencia de cesiones a terceros y cómo ejercer tus derechos.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Política de Privacidad"
      intro={
        <p>
          En {LEGAL.siteName} tratamos los mínimos datos posibles: no hay registro, ni formularios, ni analítica, ni
          publicidad personalizada. Esta política, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica
          3/2018 (LOPDGDD), explica lo poco que sí ocurre.
        </p>
      }
    >
      <LegalSection id="responsable" title="1. Responsable del tratamiento">
        <DataTable
          head={["Dato", "Valor"]}
          rows={[
            ["Responsable", <OwnerData key="o" value={LEGAL.owner} />],
            ["NIF / CIF", <OwnerData key="t" value={LEGAL.taxId} />],
            ["Domicilio", <OwnerData key="a" value={LEGAL.address} />],
            ["Contacto de privacidad", <OwnerData key="e" value={LEGAL.email} />],
          ]}
        />
      </LegalSection>

      <LegalSection id="datos" title="2. Qué datos tratamos y para qué">
        <DataTable
          head={["", "Navegación", "Contacto por correo"]}
          rows={[
            [
              "Datos",
              "Dirección IP, fecha y hora, página solicitada y navegador (registros del servidor).",
              "Tu dirección de correo y lo que nos cuentes.",
            ],
            [
              "Finalidad",
              "Servir el sitio, garantizar su seguridad y prevenir abusos.",
              "Responder a tu consulta, corrección o solicitud.",
            ],
            [
              "Base legal",
              "Interés legítimo (art. 6.1.f RGPD).",
              "Tu consentimiento al escribirnos (art. 6.1.a) y, si ejerces derechos, obligación legal (art. 6.1.c).",
            ],
            [
              "Conservación",
              "El plazo técnico del proveedor de alojamiento, salvo incidente de seguridad.",
              "Lo necesario para atenderte y, después, los plazos legales de prescripción.",
            ],
          ]}
        />
        <p>
          <strong>Tu setup no sale de tu dispositivo.</strong> El perfil, presupuesto, equipo y medidas de mesa que
          introduces en el asesor se guardan solo en el almacenamiento local de tu navegador y las recomendaciones se
          calculan allí mismo. No los recibimos ni los tratamos. Los detalles están en la{" "}
          <Link href="/cookies">política de cookies</Link>.
        </p>
        <p>
          No tomamos decisiones automatizadas con efectos jurídicos sobre ti (art. 22 RGPD): las recomendaciones del
          motor son orientativas y las calcula tu navegador.
        </p>
      </LegalSection>

      <LegalSection id="destinatarios" title="3. Destinatarios: no cedemos tus datos">
        <p>
          No vendemos, alquilamos ni cedemos datos personales a terceros, salvo obligación legal (por ejemplo, un
          requerimiento judicial).
        </p>
        <p>
          Para alojar el sitio contamos con <a href={LEGAL.hosting.web} target="_blank" rel="noopener noreferrer">{LEGAL.hosting.name}</a> (
          {LEGAL.hosting.address}), que actúa como <strong>encargado del tratamiento</strong> y solo procesa los
          registros de navegación siguiendo nuestras instrucciones, con un contrato conforme al artículo 28 del RGPD.
          Como el proveedor está establecido en Estados Unidos, la transferencia internacional se ampara en el Marco de
          Privacidad de Datos UE-EE. UU. y en las cláusulas contractuales tipo de la Comisión Europea incluidas en su
          acuerdo de tratamiento de datos.
        </p>
      </LegalSection>

      <LegalSection id="amazon" title="4. Enlaces a Amazon">
        <p>
          Al pulsar un enlace de compra sales de {LEGAL.siteName} y entras en Amazon, que trata tus datos como
          responsable independiente según su propia política de privacidad. Amazon no nos comunica quién eres ni qué
          compras: solo recibimos informes agregados de ventas para calcular comisiones. Las fotografías de producto se
          sirven desde nuestro propio dominio, de modo que ver una página no conecta tu navegador con Amazon.
        </p>
      </LegalSection>

      <LegalSection id="derechos" title="5. Tus derechos">
        <p>Puedes ejercer en cualquier momento, de forma gratuita, los derechos que te reconoce el RGPD:</p>
        <ul>
          <li>
            <strong>Acceso:</strong> saber si tratamos datos tuyos y obtener una copia.
          </li>
          <li>
            <strong>Rectificación:</strong> corregir datos inexactos o incompletos.
          </li>
          <li>
            <strong>Supresión («derecho al olvido»):</strong> pedir que borremos tus datos.
          </li>
          <li>
            <strong>Oposición:</strong> oponerte a un tratamiento basado en interés legítimo.
          </li>
          <li>
            <strong>Limitación:</strong> pedir que conservemos tus datos sin usarlos mientras se resuelve una
            reclamación.
          </li>
          <li>
            <strong>Portabilidad:</strong> recibir tus datos en un formato estructurado y de uso común.
          </li>
          <li>
            <strong>Retirar tu consentimiento</strong> cuando el tratamiento se base en él, sin que afecte a lo
            anterior.
          </li>
        </ul>
        <p>
          Escríbenos a <OwnerData value={LEGAL.email} /> indicando el derecho que quieres ejercer. Responderemos en el
          plazo de un mes (prorrogable dos meses más en casos complejos, avisándote). Solo te pediremos acreditar tu
          identidad si tenemos dudas razonables sobre ella.
        </p>
        <p>
          Si consideras que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección
          de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).
        </p>
      </LegalSection>

      <LegalSection id="menores" title="6. Menores de edad">
        <p>
          El sitio no está dirigido a menores de 14 años. Si eres menor de esa edad, no nos envíes datos personales sin
          el consentimiento de tus padres o tutores (art. 7 LOPDGDD).
        </p>
      </LegalSection>

      <LegalSection id="cambios" title="7. Seguridad y cambios en esta política">
        <p>
          El sitio se sirve siempre por HTTPS y aplicamos medidas técnicas y organizativas proporcionadas al riesgo. Si
          cambiamos esta política (por ejemplo, si algún día incorporamos analítica), lo reflejaremos aquí con su nueva
          fecha de revisión y, cuando la ley lo exija, pediremos tu consentimiento antes.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
