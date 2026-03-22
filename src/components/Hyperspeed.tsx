import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ── Road surface ──
function Road() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(12, 200, 1, 1), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: 0x080510, side: THREE.DoubleSide }), []);
  return <mesh ref={meshRef} geometry={geo} material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, -60]} />;
}

// ── Road lane markings ──
function LaneMarkings() {
  const count = 40;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, -1.19, -i * 5);
      dummy.scale.set(0.08, 1, 1.8);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={0x1a1525} transparent opacity={0.6} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// ── Side lights (road edge lights) ──
function SideLights({ side }: { side: 'left' | 'right' }) {
  const count = 50;
  const x = side === 'left' ? -5.5 : 5.5;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const offsets = useMemo(() => Array.from({ length: count }, (_, i) => i * 4), []);
  const color = new THREE.Color();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const z = ((offsets[i] + t * 25) % 200) - 180;
      const glow = Math.max(0.3, 1 - Math.abs(z + 20) / 80);
      dummy.position.set(x + Math.sin(z * 0.02) * 0.3, -1.1, z);
      dummy.scale.setScalar(0.06 + glow * 0.06);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      const hue = side === 'left' ? 0.92 : 0.95;
      color.setHSL(hue, 0.8, 0.4 + glow * 0.3);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
    </instancedMesh>
  );
}

// ── Car headlights / taillights ──
const CAR_COLORS = [0xec4899, 0xf9a8d4, 0xbe185d, 0xfda4af, 0xf43f5e, 0xff6b9d, 0xc026d3, 0xe879f9];

interface CarData {
  lane: number;
  z: number;
  speed: number;
  colorIdx: number;
  spacing: number;
}

function Cars({ direction }: { direction: 'towards' | 'away' }) {
  const count = 30;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = new THREE.Color();

  const cars = useMemo<CarData[]>(() => {
    const laneBase = direction === 'towards' ? [1.5, 3] : [-1.5, -3];
    return Array.from({ length: count }, (_, i) => ({
      lane: laneBase[i % 2],
      z: -(Math.random() * 180 + 10),
      speed: direction === 'towards' ? (15 + Math.random() * 20) : (8 + Math.random() * 15),
      colorIdx: Math.floor(Math.random() * CAR_COLORS.length),
      spacing: 0.35 + Math.random() * 0.15,
    }));
  }, [direction]);

  useFrame((_, delta) => {
    if (!meshRef.current || !trailRef.current) return;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < count; i++) {
      const car = cars[i];
      
      if (direction === 'towards') {
        car.z += car.speed * dt;
        if (car.z > 10) car.z = -(150 + Math.random() * 40);
      } else {
        car.z -= car.speed * dt;
        if (car.z < -190) car.z = -(Math.random() * 20);
      }

      // Main headlight
      const brightness = direction === 'towards'
        ? Math.max(0.4, 1 - Math.max(0, -car.z - 10) / 100)
        : Math.max(0.3, 1 - Math.max(0, -car.z) / 150);
      
      const sz = 0.08 + brightness * 0.12;
      dummy.position.set(car.lane, -0.9, car.z);
      dummy.scale.set(sz, sz, sz);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      color.set(CAR_COLORS[car.colorIdx]);
      color.multiplyScalar(0.6 + brightness * 0.6);
      meshRef.current.setColorAt(i, color);

      // Light trail (stretched along z)
      const trailLen = direction === 'towards' ? 1.5 + car.speed * 0.08 : 0.8 + car.speed * 0.05;
      const trailZ = direction === 'towards' ? car.z - trailLen * 0.5 : car.z + trailLen * 0.5;
      dummy.position.set(car.lane, -0.9, trailZ);
      dummy.scale.set(0.03, 0.03, trailLen);
      dummy.updateMatrix();
      trailRef.current.setMatrixAt(i, dummy.matrix);

      color.set(CAR_COLORS[car.colorIdx]);
      color.multiplyScalar(0.25 + brightness * 0.2);
      trailRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    trailRef.current.instanceMatrix.needsUpdate = true;
    if (trailRef.current.instanceColor) trailRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.95} />
      </instancedMesh>
      <instancedMesh ref={trailRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.4} />
      </instancedMesh>
    </>
  );
}

// ── Camera animation ──
function CameraRig() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    camera.position.y = 1.2 + Math.sin(t * 0.3) * 0.15;
    camera.position.x = Math.sin(t * 0.15) * 0.3;
    camera.lookAt(0, -0.5, -30);
  });
  return null;
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#070510']} />
      <fog attach="fog" args={['#070510', 20, 120]} />
      <CameraRig />
      <Road />
      <LaneMarkings />
      <SideLights side="left" />
      <SideLights side="right" />
      <Cars direction="towards" />
      <Cars direction="away" />
      {/* Ambient pink glow on horizon */}
      <mesh position={[0, 2, -100]}>
        <planeGeometry args={[80, 30]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.015} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

export default function Hyperspeed() {
  return (
    <div className="fixed inset-0 z-0" style={{ background: '#070510' }}>
      <Canvas
        camera={{ position: [0, 1.2, 5], fov: 70, near: 0.1, far: 200 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene />
      </Canvas>
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(7,5,16,0.5) 100%)',
        }}
      />
    </div>
  );
}
