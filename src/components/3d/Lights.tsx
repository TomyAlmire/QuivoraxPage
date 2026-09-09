import { useAppStore } from '@/store/useAppStore';

/**
 * Iluminación base de la escena. Las sombras se activan solo desde 'mid' para
 * arriba (el <Canvas> decide `shadows` según el tier; acá ajustamos el mapa).
 */
export function Lights() {
  const shadowMapSize = useAppStore((s) => s.device.shadowMapSize);
  const withShadows = useAppStore((s) => s.quality() !== 'low');

  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#a9c6ff', '#20140f', 0.4]} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={2.4}
        color="#fff4e8"
        castShadow={withShadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-6, 6, 6, -6, 0.1, 20]} />
      </directionalLight>
      <pointLight position={[-5, -2, -4]} intensity={12} color="#5e8bff" distance={16} decay={2} />
    </>
  );
}
