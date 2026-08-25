import { LegalDocument } from '../../domain/models/legal.model';

// ─────────────────────────────────────────────────────────────────────────────
// Términos y condiciones del sitio. El texto describe lo que el sitio hace de
// verdad —formulario de contacto por correo, preferencias guardadas en el
// navegador, sin analítica ni publicidad—; si eso cambia, este documento
// cambia con él.
//
// [COMPLETAR] Redacción general, no revisada por un estudio jurídico. Antes de
// publicar: que un abogado la valide y se complete el CUIT en la cláusula
// 'holder', el único dato que falta acá.
// ─────────────────────────────────────────────────────────────────────────────
export const TERMS: LegalDocument = {
  updatedAt: '2026-08-25',
  clauses: [
    {
      id: 'purpose',
      copy: {
        es: {
          heading: 'Objeto y aceptación',
          paragraphs: [
            'Estos términos y condiciones regulan el acceso y el uso del sitio bytektechnology.com y de los formularios que ofrece. Navegar el sitio implica aceptarlos en su totalidad.',
            'Quien no esté de acuerdo con alguna de estas cláusulas debe abstenerse de utilizar el sitio.',
          ],
        },
        en: {
          heading: 'Purpose and acceptance',
          paragraphs: [
            'These terms and conditions govern access to and use of bytektechnology.com and the forms it offers. Browsing the site implies full acceptance of them.',
            'Anyone who disagrees with any of these clauses should refrain from using the site.',
          ],
        },
      },
    },
    {
      id: 'holder',
      copy: {
        es: {
          heading: 'Titular del sitio',
          paragraphs: [
            'El sitio es operado por Bytek Technology, con domicilio en Buenos Aires, Argentina, CUIT [COMPLETAR: CUIT], en adelante «Bytek».',
            'Para cualquier consulta relacionada con estos términos, el canal de contacto es bytektechnology@gmail.com.',
          ],
        },
        en: {
          heading: 'Site owner',
          paragraphs: [
            'The site is operated by Bytek Technology, domiciled in Buenos Aires, Argentina, tax ID [COMPLETAR: CUIT], hereinafter “Bytek”.',
            'For any question regarding these terms, the contact channel is bytektechnology@gmail.com.',
          ],
        },
      },
    },
    {
      id: 'use',
      copy: {
        es: {
          heading: 'Uso del sitio',
          paragraphs: [
            'El sitio es informativo y su uso es gratuito. El usuario se compromete a utilizarlo conforme a la ley, a la buena fe y a estos términos.',
            'Queda prohibido intentar acceder a áreas o datos no públicos, interferir con el funcionamiento del sitio o de su infraestructura, enviar contenido ilícito, ofensivo o malicioso a través de los formularios, y extraer contenido de forma automatizada con fines comerciales sin autorización previa y por escrito.',
          ],
        },
        en: {
          heading: 'Use of the site',
          paragraphs: [
            'The site is informational and free to use. Users undertake to use it in accordance with the law, good faith and these terms.',
            'It is forbidden to attempt to access non-public areas or data, interfere with the operation of the site or its infrastructure, submit unlawful, offensive or malicious content through the forms, or extract content in an automated way for commercial purposes without prior written authorisation.',
          ],
        },
      },
    },
    {
      id: 'services',
      copy: {
        es: {
          heading: 'Servicios, presupuestos y contratación',
          paragraphs: [
            'La información sobre servicios, plazos, procesos y cifras publicada en el sitio tiene carácter descriptivo y orientativo. No constituye una oferta contractual vinculante ni garantiza resultados concretos.',
            'Cada proyecto se rige por el contrato o la propuesta comercial firmada entre Bytek y el cliente, donde se fijan alcance, plazos, precio, condiciones de pago, propiedad del código y garantías. Ante cualquier discrepancia, prevalece ese contrato por sobre lo publicado en el sitio.',
          ],
        },
        en: {
          heading: 'Services, quotes and engagement',
          paragraphs: [
            'Information about services, timelines, processes and figures published on the site is descriptive and indicative. It does not constitute a binding contractual offer nor does it guarantee specific results.',
            'Each project is governed by the contract or commercial proposal signed between Bytek and the client, which sets out scope, timelines, price, payment terms, code ownership and warranties. In case of discrepancy, that contract prevails over what is published on the site.',
          ],
        },
      },
    },
    {
      id: 'ip',
      copy: {
        es: {
          heading: 'Propiedad intelectual',
          paragraphs: [
            'La marca «Bytek Technology», su logotipo, el diseño del sitio, los textos, el código fuente y demás elementos que lo componen son propiedad de Bytek o se utilizan con licencia, y están protegidos por la Ley 11.723 de Propiedad Intelectual y por la normativa marcaria aplicable.',
            'Se permite la reproducción parcial de contenidos citando la fuente y enlazando al sitio. Cualquier otro uso —reproducción total, distribución, modificación o explotación comercial— requiere autorización previa y por escrito.',
            'Los nombres y las marcas de los clientes mencionados pertenecen a sus respectivos titulares y se muestran únicamente a título de referencia.',
          ],
        },
        en: {
          heading: 'Intellectual property',
          paragraphs: [
            'The «Bytek Technology» brand, its logo, the site design, the texts, the source code and the other elements that make it up are owned by Bytek or used under licence, and are protected by Argentine Intellectual Property Law 11,723 and by applicable trademark regulations.',
            'Partial reproduction of content is permitted provided the source is cited and linked. Any other use — full reproduction, distribution, modification or commercial exploitation — requires prior written authorisation.',
            'The names and trademarks of the clients mentioned belong to their respective owners and are shown for reference purposes only.',
          ],
        },
      },
    },
    {
      id: 'data',
      copy: {
        es: {
          heading: 'Datos personales',
          paragraphs: [
            'El formulario de contacto recoge nombre, correo electrónico, empresa (opcional) y el mensaje escrito por el usuario. Esos datos se usan con una única finalidad: responder la consulta y, si prospera, avanzar con la propuesta comercial. No se venden, no se ceden a terceros con fines publicitarios ni se usan para enviar comunicaciones no solicitadas.',
            'El mensaje se entrega a la casilla de Bytek a través del proveedor de envío de correo Resend, que actúa como encargado del tratamiento. La infraestructura del sitio está alojada en Vercel. Ambos proveedores pueden procesar los datos fuera de la Argentina.',
            'El tratamiento se realiza conforme a la Ley 25.326 de Protección de los Datos Personales. El titular de los datos puede ejercer sus derechos de acceso, rectificación, actualización y supresión escribiendo a bytektechnology@gmail.com. La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende las denuncias y los reclamos de quienes vean afectados sus derechos.',
          ],
        },
        en: {
          heading: 'Personal data',
          paragraphs: [
            'The contact form collects name, email address, company (optional) and the message written by the user. That data is used for a single purpose: replying to the enquiry and, if it moves forward, progressing with the commercial proposal. It is not sold, not transferred to third parties for advertising purposes, and not used to send unsolicited communications.',
            'The message is delivered to the Bytek inbox through the email provider Resend, acting as data processor. The site infrastructure is hosted on Vercel. Both providers may process the data outside Argentina.',
            'Processing is carried out in accordance with Argentine Personal Data Protection Law 25,326. Data subjects may exercise their rights of access, rectification, update and deletion by writing to bytektechnology@gmail.com. The Agencia de Acceso a la Información Pública, the supervisory authority under Law 25,326, handles complaints and claims from those whose rights are affected.',
          ],
        },
      },
    },
    {
      id: 'storage',
      copy: {
        es: {
          heading: 'Almacenamiento en el navegador',
          paragraphs: [
            'El sitio no utiliza cookies de seguimiento, de publicidad ni de analítica de terceros.',
            'Guarda en el almacenamiento local del navegador dos preferencias del usuario —el idioma y el tema claro u oscuro— para respetarlas en la próxima visita. No identifican a la persona y pueden borrarse en cualquier momento desde el propio navegador.',
          ],
        },
        en: {
          heading: 'Browser storage',
          paragraphs: [
            'The site does not use tracking, advertising or third-party analytics cookies.',
            'It stores two user preferences in the browser local storage — the language and the light or dark theme — so they are respected on the next visit. They do not identify the person and can be cleared at any time from the browser itself.',
          ],
        },
      },
    },
    {
      id: 'availability',
      copy: {
        es: {
          heading: 'Disponibilidad y responsabilidad',
          paragraphs: [
            'Bytek procura que el sitio esté disponible de forma continua, pero no garantiza que funcione sin interrupciones ni errores. Puede suspender el acceso por tareas de mantenimiento, actualizaciones o causas ajenas a su control.',
            'Bytek no responde por los daños derivados del uso del sitio, de la imposibilidad de acceder a él ni de decisiones tomadas exclusivamente sobre la base de su contenido informativo. Esta limitación no alcanza a las obligaciones asumidas en los contratos firmados con clientes.',
          ],
        },
        en: {
          heading: 'Availability and liability',
          paragraphs: [
            'Bytek aims to keep the site continuously available, but does not guarantee uninterrupted or error-free operation. Access may be suspended for maintenance, updates or reasons beyond its control.',
            'Bytek is not liable for damages arising from use of the site, from being unable to access it, or from decisions taken solely on the basis of its informational content. This limitation does not extend to the obligations assumed in signed client contracts.',
          ],
        },
      },
    },
    {
      id: 'third-parties',
      copy: {
        es: {
          heading: 'Enlaces a sitios de terceros',
          paragraphs: [
            'El sitio enlaza a perfiles y servicios de terceros, como redes sociales. Bytek no controla esos destinos ni responde por sus contenidos, sus prácticas de privacidad o su disponibilidad. Al seguirlos, rigen los términos de cada uno.',
          ],
        },
        en: {
          heading: 'Links to third-party sites',
          paragraphs: [
            'The site links to third-party profiles and services, such as social networks. Bytek does not control those destinations and is not responsible for their content, privacy practices or availability. Following them means their own terms apply.',
          ],
        },
      },
    },
    {
      id: 'changes',
      copy: {
        es: {
          heading: 'Modificaciones',
          paragraphs: [
            'Bytek puede actualizar estos términos en cualquier momento para reflejar cambios en el sitio, en sus servicios o en la normativa aplicable. La versión vigente es siempre la publicada en esta página, con su fecha de última actualización a la vista.',
            'El uso del sitio después de una modificación implica la aceptación de la nueva versión.',
          ],
        },
        en: {
          heading: 'Changes',
          paragraphs: [
            'Bytek may update these terms at any time to reflect changes in the site, its services or applicable regulations. The version in force is always the one published on this page, with its last-updated date in plain sight.',
            'Continued use of the site after a change implies acceptance of the new version.',
          ],
        },
      },
    },
    {
      id: 'law',
      copy: {
        es: {
          heading: 'Ley aplicable y jurisdicción',
          paragraphs: [
            'Estos términos se rigen por las leyes de la República Argentina.',
            'Para toda controversia derivada de su interpretación o aplicación, las partes se someten a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, renunciando a cualquier otro fuero o jurisdicción que pudiera corresponder.',
          ],
        },
        en: {
          heading: 'Governing law and jurisdiction',
          paragraphs: [
            'These terms are governed by the laws of the Argentine Republic.',
            'For any dispute arising from their interpretation or application, the parties submit to the ordinary courts of the Autonomous City of Buenos Aires, waiving any other venue or jurisdiction that might apply.',
          ],
        },
      },
    },
  ],
};
