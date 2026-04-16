import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { TextureLoader, ShaderMaterial, type Mesh } from "three";
import { vertex, fragment } from "./DisintegrateShader";

interface DisintegrateMeshProps {
  progressRef: RefObject<number>;
  imageA: string;
  imageB: string;
  noise: string;
  segments?: number;
}

export default function DisintegrateMesh({
  progressRef,
  imageA,
  imageB,
  noise,
  segments = 64,
}: DisintegrateMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const viewport = useThree((s) => s.viewport);

  const [texA, texB, texNoise] = useLoader(TextureLoader, [imageA, imageB, noise]);

  const material = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        uImageA: { value: texA },
        uImageB: { value: texB },
        uNoise:  { value: texNoise },
        uProgress: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
    });
  }, [texA, texB, texNoise]);

  // Dispose the previous ShaderMaterial when it's replaced (Important #3: GPU leak fix)
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame((_state, delta) => {
    material.uniforms.uProgress.value = progressRef.current;
    material.uniforms.uTime.value += delta;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
