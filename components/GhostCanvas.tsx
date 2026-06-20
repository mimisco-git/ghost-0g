"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

function GhostOrb() {
  const bodyRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (bodyRef.current) {
      bodyRef.current.rotation.y = t * 0.12;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.04);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.12 + Math.sin(t * 0.8) * 0.04;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.15} floatIntensity={1.0}>
      <group>
        {/* Outer glow sphere - cyan halo */}
        <Sphere ref={glowRef} args={[1.18, 32, 32]}>
          <meshBasicMaterial
            color="#00FFD1"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
          />
        </Sphere>

        {/* Main body: pure white with glass feel */}
        <Sphere ref={bodyRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            color="#ffffff"
            emissive="#00FFD1"
            emissiveIntensity={0.06}
            roughness={0.06}
            metalness={0.04}
            transparent
            opacity={0.95}
            distort={0.07}
            speed={1.0}
          />
        </Sphere>

        {/* Left eye - black socket */}
        <Sphere args={[0.13, 32, 32]} position={[-0.27, 0.2, 0.9]}>
          <meshBasicMaterial color="#0a0a0a" />
        </Sphere>
        {/* Left eye - cyan iris */}
        <Sphere args={[0.065, 32, 32]} position={[-0.27, 0.2, 0.96]}>
          <meshBasicMaterial color="#00FFD1" />
        </Sphere>
        {/* Left eye - white shine */}
        <Sphere args={[0.022, 16, 16]} position={[-0.245, 0.225, 0.99]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>

        {/* Right eye - black socket */}
        <Sphere args={[0.13, 32, 32]} position={[0.27, 0.2, 0.9]}>
          <meshBasicMaterial color="#0a0a0a" />
        </Sphere>
        {/* Right eye - cyan iris */}
        <Sphere args={[0.065, 32, 32]} position={[0.27, 0.2, 0.96]}>
          <meshBasicMaterial color="#00FFD1" />
        </Sphere>
        {/* Right eye - white shine */}
        <Sphere args={[0.022, 16, 16]} position={[0.295, 0.225, 0.99]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>
      </group>
    </Float>
  );
}

export default function GhostCanvas() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        {/* Strong white key light from top-front for bright ghost body */}
        <pointLight position={[0, 4, 4]} intensity={4.0} color="#ffffff" />
        {/* Cyan rim from below */}
        <pointLight position={[0, -3, 2]} intensity={1.5} color="#00FFD1" />
        {/* Cyan fill from left */}
        <pointLight position={[-3, 1, 2]} intensity={1.0} color="#00FFD1" />
        {/* Soft white fill from right */}
        <pointLight position={[3, 2, -1]} intensity={0.5} color="#ffffff" />
        {/* Dark ambient so shadows stay deep */}
        <ambientLight intensity={0.2} color="#001a14" />
        <GhostOrb />
      </Canvas>
    </div>
  );
}
