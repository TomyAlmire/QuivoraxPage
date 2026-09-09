Environment maps (.hdr / .exr) para iluminación basada en imagen.

  import { Environment } from "@react-three/drei";
  <Environment files="/src/assets/environments/studio.hdr" />

La escena de demo usa un Environment PROCEDURAL (Lightformers, sin fetch).
Usá HDR reales solo cuando necesites reflejos fotográficos.
