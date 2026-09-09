/**
 * Datos de contacto de Quivorax. El canal principal es WhatsApp: todo lo que
 * diga "contactar / trabajemos / escribime" abre un chat directo.
 *
 * Número: +54 11 3912-8675 → formato wa.me para móvil argentino: 54 9 11 …
 */
const WA_MSG = 'Hola Tomás, quiero consultarte por un proyecto.';

export const WHATSAPP_NUMBER = '5491139128675';
export const WHATSAPP_DISPLAY = '+54 11 3912-8675';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WA_MSG)}`;

export const EMAIL = 'hola@quivorax.com';
export const EMAIL_URL = `mailto:${EMAIL}`;
