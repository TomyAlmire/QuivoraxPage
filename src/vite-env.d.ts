/// <reference types="vite/client" />

// Shaders GLSL importados como string (vite-plugin-glsl)
declare module '*.glsl' {
  const value: string;
  export default value;
}
declare module '*.vert' {
  const value: string;
  export default value;
}
declare module '*.frag' {
  const value: string;
  export default value;
}
declare module '*.vs' {
  const value: string;
  export default value;
}
declare module '*.fs' {
  const value: string;
  export default value;
}

// Assets 3D importados como URL
declare module '*.glb' {
  const src: string;
  export default src;
}
declare module '*.gltf' {
  const src: string;
  export default src;
}
declare module '*.hdr' {
  const src: string;
  export default src;
}
declare module '*.exr' {
  const src: string;
  export default src;
}
