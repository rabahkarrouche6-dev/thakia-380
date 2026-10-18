import { useEffect, useRef } from "react";
import * as THREE from "three";

type CyberParticleFieldProps = {
  className?: string;
};

export default function CyberParticleField({ className = "" }: CyberParticleFieldProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.z = 11;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const particleCount = 760;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const emerald = new THREE.Color("#00b879");
    const gold = new THREE.Color("#d4a017");

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      const radius = 2.4 + Math.random() * 5.8;
      const angle = Math.random() * Math.PI * 2;
      const band = (Math.random() - 0.5) * 3.5;
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius * 0.58 + band * 0.16;
      positions[i3 + 2] = (Math.random() - 0.5) * 3.8;

      const color = i % 9 === 0 ? gold : emerald;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(3.05, 3.075, 96),
      new THREE.MeshBasicMaterial({ color: 0x00b879, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI * 0.5;
    ring.rotation.z = 0.35;
    scene.add(ring);

    const pointer = { x: 0, y: 0 };
    const handlePointer = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    host.addEventListener("pointermove", handlePointer, { passive: true });

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    let frame = 0;
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      if (!reducedMotion) {
        points.rotation.y += 0.0009;
        points.rotation.x += 0.00025;
        ring.rotation.z += 0.0006;
        camera.position.x += (pointer.x * 0.34 - camera.position.x) * 0.025;
        camera.position.y += (-pointer.y * 0.2 - camera.position.y) * 0.025;
        camera.lookAt(0, 0, 0);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", handlePointer);
      geometry.dispose();
      material.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className={`cyber-particle-field ${className}`} />;
}
