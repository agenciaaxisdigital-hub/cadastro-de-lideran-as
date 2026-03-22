import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 600;
const SPEED = 2.5;
const SPREAD = 18;
const DEPTH = 60;

function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      x: (Math.random() - 0.5) * SPREAD,
      y: (Math.random() - 0.5) * SPREAD * 0.6,
      z: Math.random() * DEPTH - DEPTH,
      speed: 0.5 + Math.random() * SPEED,
      scale: 0.02 + Math.random() * 0.04,
      lengthScale: 3 + Math.random() * 8,
    }));
  }, []);

  // Set random pink-spectrum colors per instance
  useMemo(() => {
    if (!meshRef.current) return;
    const color = new THREE.Color();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = Math.random();
      if (t < 0.4) {
        color.setRGB(0.85 + Math.random() * 0.15, 0.1 + Math.random() * 0.2, 0.3 + Math.random() * 0.3);
      } else if (t < 0.75) {
        color.setRGB(0.95 + Math.random() * 0.05, 0.25 + Math.random() * 0.25, 0.45 + Math.random() * 0.25);
      } else {
        color.setRGB(0.9 + Math.random() * 0.1, 0.7 + Math.random() * 0.3, 0.8 + Math.random() * 0.2);
      }
      meshRef.current.setColorAt(i, color);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [meshRef.current]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const clampedDelta = Math.min(delta, 0.05);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      p.z += p.speed * clampedDelta * 20;

      if (p.z > 5) {
        p.z = -DEPTH + Math.random() * 5;
        p.x = (Math.random() - 0.5) * SPREAD;
        p.y = (Math.random() - 0.5) * SPREAD * 0.6;
      }

      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.scale, p.scale, p.scale * p.lengthScale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.85} />
    </instancedMesh>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#070510']} />
      <fog attach="fog" args={['#070510', 15, 55]} />
      <Particles />
    </>
  );
}

export default function Hyperspeed() {
  return (
    <div className="fixed inset-0 z-0" style={{ background: '#070510' }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 75, near: 0.1, far: 100 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene />
      </Canvas>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(7,5,16,0.6) 100%)',
        }}
      />
    </div>
  );
}
