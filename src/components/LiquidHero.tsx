"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshTransmissionMaterial, Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

function GlassLogo() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <Center>
      <Text3D
        ref={meshRef}
        font="/fonts/Inter_Bold.json"
        size={1.2}
        height={0.2}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.01}
        bevelOffset={0}
        bevelSegments={5}
      >
        Kronos
        <MeshTransmissionMaterial
          backside
          samples={16}
          resolution={256}
          transmission={1}
          roughness={0.1}
          thickness={0.2}
          ior={1.5}
          chromaticAberration={0.05}
          distortion={0.3}
          distortionScale={0.5}
          temporalDistortion={0.1}
          color="#ffffff"
        />
      </Text3D>
    </Center>
  );
}

function LiquidBubble({ position, scale }: { position: [number, number, number]; scale: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.3;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshTransmissionMaterial
          backside
          samples={16}
          resolution={256}
          transmission={1}
          roughness={0.05}
          thickness={0.2}
          ior={1.5}
          chromaticAberration={0.05}
          distortion={0.3}
          distortionScale={0.3}
          temporalDistortion={0.1}
          color="#c0e0ff"
        />
      </mesh>
    </Float>
  );
}

export default function LiquidHero() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-3, 2, 4]} intensity={0.5} color="#7c9e6c" />

        <GlassLogo />

        <LiquidBubble position={[-3.5, 1.5, -1]} scale={0.5} />
        <LiquidBubble position={[3.8, -1, -2]} scale={0.7} />
        <LiquidBubble position={[2, 2.5, -1.5]} scale={0.35} />
        <LiquidBubble position={[-2.5, -2, -1]} scale={0.45} />

        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
