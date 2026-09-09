Texturas (.png / .jpg / .webp / .ktx2).

  import { useTexture } from "@react-three/drei";
  const map = useTexture("/src/assets/textures/tu-textura.webp");

- Preferí .webp para color maps.
- Potencias de 2 si vas a generar mipmaps.
- Para PBR pesado, considerá .ktx2 (basis) con KTX2Loader.
