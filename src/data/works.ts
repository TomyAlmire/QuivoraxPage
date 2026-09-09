/**
 * Trabajos del portfolio. Viven "dentro del núcleo": se abren desde el orbe
 * central (modo `works`) en una galería interactiva.
 *
 * Las imágenes están en public/assets/ (work-* = desktop, m-* = mobile).
 * Editá acá los textos / URLs a medida que haya sitios publicados.
 */
export interface Work {
  id: string;
  name: string;
  /** Rubro corto, para la etiqueta */
  kind: string;
  /** Una línea */
  blurb: string;
  /** Qué se hizo (2-3 items) */
  points: string[];
  /** Link al sitio, si está publicado */
  url?: string;
  shot: string;
  mobileShot: string;
  /** Acento del proyecto (aprox. su paleta) */
  accent: string;
}

export const WORKS: Work[] = [
  {
    id: 'lashes',
    name: 'LashesByMiri',
    kind: 'Estudio de pestañas',
    blurb: 'Sitio para un estudio de extensiones de pestañas, pensado primero para el celular.',
    points: ['Diseño y desarrollo del sitio', 'Turnos y contacto directo', 'Galería de trabajos y opiniones'],
    url: 'https://miriespeche.github.io/LashesByMiri/',
    shot: '/assets/work-lashes.png',
    mobileShot: '/assets/m-lashes.png',
    accent: '#d1789a',
  },
  {
    id: 'claricolor',
    name: 'Clari Color',
    kind: 'Indumentaria',
    blurb: 'Marca de indumentaria con catálogo ordenado y una compra simple de mantener.',
    points: ['Catálogo de productos', 'Carrito y checkout directo', 'Fácil de actualizar sin tocar código'],
    shot: '/assets/work-claricolor.png',
    mobileShot: '/assets/m-claricolor.png',
    accent: '#e08a3c',
  },
  {
    id: 'espacioromero',
    name: 'Espacio Romero',
    kind: 'Sitio institucional',
    blurb: 'Una sola página: qué ofrecen, dónde están y cómo contactar, sin vueltas.',
    points: ['Landing de una sola página', 'Secciones claras y navegación simple', 'Contacto y ubicación a la vista'],
    shot: '/assets/work-espacioromero.png',
    mobileShot: '/assets/m-espacioromero.png',
    accent: '#7a9b76',
  },
  {
    id: 'dalmata',
    name: 'Dálmata',
    kind: 'Landing de marca',
    blurb: 'Landing con identidad propia, hecha para que se entienda rápido y te escriban.',
    points: ['Identidad visual fuerte', 'Mensaje directo al grano', 'Foco en el contacto'],
    shot: '/assets/work-dalmata.png',
    mobileShot: '/assets/m-dalmata.png',
    accent: '#8b90a0',
  },
];
