import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { Lock, Unlock } from 'lucide-react';

interface LockScreenProps {
  isLocked: boolean;
  password: string;
  error: string;
  onPasswordChange: (value: string) => void;
  onUnlock: (e: React.FormEvent) => void;
  onErrorClear: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({
  isLocked,
  password,
  error,
  onPasswordChange,
  onUnlock,
  onErrorClear,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lockIconRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isLocked || !canvasRef.current) return;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create Particle System
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Position
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;

      // Color (red gradient)
      colors[i] = 0.8 + Math.random() * 0.2; // R
      colors[i + 1] = 0.2 + Math.random() * 0.1; // G
      colors[i + 2] = 0.2 + Math.random() * 0.1; // B
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Create Glowing Rings
    const ringGeometry = new THREE.TorusGeometry(2, 0.02, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0.3,
    });
    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
    const ring2 = new THREE.Mesh(ringGeometry, ringMaterial.clone());
    ring2.scale.set(1.3, 1.3, 1.3);
    scene.add(ring1, ring2);

    // Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Rotate particles
      particles.rotation.y = elapsedTime * 0.05;
      particles.rotation.x = elapsedTime * 0.03;

      // Rotate rings
      ring1.rotation.x = elapsedTime * 0.3;
      ring1.rotation.y = elapsedTime * 0.2;
      ring2.rotation.x = -elapsedTime * 0.2;
      ring2.rotation.y = -elapsedTime * 0.3;

      // Pulse rings
      const scale = 1 + Math.sin(elapsedTime * 2) * 0.1;
      ring1.scale.set(scale, scale, scale);
      ring2.scale.set(scale * 1.3, scale * 1.3, scale * 1.3);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // GSAP Animations
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.out' }
      );
    }

    if (lockIconRef.current) {
      gsap.fromTo(
        lockIconRef.current,
        { scale: 0, rotation: -180 },
        {
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: 'elastic.out(1, 0.5)',
          delay: 0.3,
        }
      );
    }

    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.6 }
      );
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
    };
  }, [isLocked]);

  // Error shake animation
  useEffect(() => {
    if (error && formRef.current) {
      gsap.fromTo(
        formRef.current,
        { x: -10 },
        {
          x: 10,
          duration: 0.1,
          repeat: 5,
          yoyo: true,
          ease: 'power1.inOut',
          onComplete: () => {
            gsap.set(formRef.current, { x: 0 });
          },
        }
      );
    }
  }, [error]);

  if (!isLocked) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
      }}
    >
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ opacity: 0.4 }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 text-center px-6 max-w-md w-full">
        {/* Lock Icon with Glow */}
        <div ref={lockIconRef} className="mb-8">
          <div className="relative inline-block">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-red-600 rounded-full blur-3xl opacity-50 animate-pulse" />
            
            {/* Lock Icon */}
            <div className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-red-600 via-red-500 to-orange-500 flex items-center justify-center shadow-2xl">
              <Lock className="w-16 h-16 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-white mt-8 mb-2 tracking-tight">
            RedLine CRM
          </h1>
          <p className="text-neutral-400 text-lg font-medium">System Locked</p>
        </div>

        {/* User Avatar */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 border-4 border-neutral-600 flex items-center justify-center shadow-xl">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
          <p className="text-xl font-semibold text-white mt-4">Admin User</p>
        </div>

        {/* Password Form */}
        <form ref={formRef} onSubmit={onUnlock} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                onPasswordChange(e.target.value);
                onErrorClear();
              }}
              placeholder="Enter password"
              autoFocus
              className={`w-full px-6 py-4 bg-white/5 backdrop-blur-xl border-2 ${
                error ? 'border-red-500' : 'border-white/10'
              } rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-all text-center text-lg font-medium shadow-2xl`}
              style={{
                boxShadow: error
                  ? '0 0 30px rgba(239, 68, 68, 0.3)'
                  : '0 10px 40px rgba(0, 0, 0, 0.3)',
              }}
            />
            <Unlock className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-medium animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full px-8 py-4 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              boxShadow: '0 10px 40px rgba(220, 38, 38, 0.4)',
            }}
          >
            Unlock
          </button>
        </form>

   

        {/* Time */}
        <div className="mt-8 text-neutral-400 text-sm font-mono">
          {new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </div>
      </div>

      {/* Ambient Light Effects */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
};

export default LockScreen;
