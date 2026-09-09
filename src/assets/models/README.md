Modelos 3D (.glb / .gltf).

Colocá acá los modelos y cargalos con drei:

  import { useGLTF } from "@react-three/drei";
  const { scene, nodes, materials, animations } = useGLTF("/src/assets/models/tu-modelo.glb");

Optimizá antes de commitear:
  npx gltfjsx tu-modelo.glb --transform --types   # genera componente + versión comprimida
  npx @gltf-transform/cli optimize in.glb out.glb --texture-compress webp
