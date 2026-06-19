import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import MoviePlane from './MoviePlane';

const Carousel = ({ movies, pathImage, radius = 10, isHovering }) => {
  const groupRef = useRef();
  const isDragging = useRef(false);
  const previousX = useRef(0);
  const rotationVelocity = useRef(0.001);
  const { gl } = useThree();

  const lastIndex = useRef(-1);

  // Custom Inertia Drag Logic
  useEffect(() => {
    const handlePointerDown = (e) => {
      isDragging.current = true;
      previousX.current = e.clientX ?? (e.touches?.[0]?.clientX) ?? 0;
      document.body.style.cursor = 'grabbing';

      // Stop momentum on grab
      rotationVelocity.current = 0;
    };

    const handlePointerMove = (e) => {
      if (isDragging.current && groupRef.current) {
        const currentX = e.clientX ?? (e.touches?.[0]?.clientX) ?? 0;
        const deltaX = currentX - previousX.current;

        // Instant 1:1 rotation attachment to mouse
        groupRef.current.rotation.y += deltaX * 0.006;

        // Store velocity for momentum when released
        rotationVelocity.current = deltaX * 0.006;

        previousX.current = currentX;
      }
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'grab';
    };

    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [gl]);

  useFrame((state, delta) => {
    if (groupRef.current && !isDragging.current) {
      if (!isHovering.current) {
        // Continually apply momentum and slowly return to auto-spin speed
        groupRef.current.rotation.y += rotationVelocity.current;
        rotationVelocity.current = THREE.MathUtils.lerp(rotationVelocity.current, 0.001, 0.05);
      } else {
        // Smooth braking when hovering instead of instant freeze
        groupRef.current.rotation.y += rotationVelocity.current;
        rotationVelocity.current = THREE.MathUtils.lerp(rotationVelocity.current, 0, 0.1);
      }

      // Auto-detect front-facing movie
      if (movies && movies.length > 0) {
        const floatIndex = (-groupRef.current.rotation.y / (Math.PI * 2)) * movies.length;
        let closestIndex = Math.round(floatIndex) % movies.length;
        if (closestIndex < 0) closestIndex += movies.length;

        if (closestIndex !== lastIndex.current) {
          lastIndex.current = closestIndex;
          document.dispatchEvent(new CustomEvent('movieFocus', { detail: movies[closestIndex] }));
        }
      }
    }
  });

  if (!movies || movies.length === 0) return null;

  return (
    <group ref={groupRef}>
      {movies.map((movie, index) => {
        const angle = (index / movies.length) * Math.PI * 2;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        return (
          <group key={movie._id || index} position={[x, 0, z]} rotation={[0, angle, 0]}>
            <MoviePlane
              movie={movie}
              pathImage={pathImage}
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
              onHover={(m) => {
                isHovering.current = true;
                document.dispatchEvent(new CustomEvent('movieHover', { detail: m }));
              }}
              onUnhover={() => {
                isHovering.current = false;
                document.dispatchEvent(new CustomEvent('movieHover', { detail: null }));
              }}
            />
          </group>
        );
      })}
    </group>
  );
};

const MouseParallax = () => {
  const { camera } = useThree();
  useFrame((state) => {
    const targetX = (state.pointer.x * 1.5);
    const targetY = (state.pointer.y * 1.5);

    if (!isNaN(targetX) && !isNaN(targetY)) {
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
    }
  });
  return null;
};

const MovieCanvas = ({ movies, pathImage }) => {
  const isHovering = useRef(false);
  const [hoveredMovie, setHoveredMovie] = useState(null);
  const [focusedMovie, setFocusedMovie] = useState(null);
  const [activeMovie, setActiveMovie] = useState(movies && movies.length > 0 ? movies[0] : null);

  useEffect(() => {
    const handleHover = (e) => {
      if (e.detail) {
        setActiveMovie(e.detail);
      } else if (focusedMovie) {
        setActiveMovie(focusedMovie);
      }
      setHoveredMovie(e.detail);
    };

    const handleFocus = (e) => {
      setFocusedMovie(e.detail);
      if (!isHovering.current && e.detail) {
        setActiveMovie(e.detail);
      }
    };

    document.addEventListener('movieHover', handleHover);
    document.addEventListener('movieFocus', handleFocus);
    return () => {
      document.removeEventListener('movieHover', handleHover);
      document.removeEventListener('movieFocus', handleFocus);
    };
  }, [focusedMovie]);

  return (
    <div
      id="movie-canvas-container"
      style={{ width: '100%', height: '80vh', position: 'relative', background: 'var(--bg-primary)', touchAction: 'none', overflow: 'hidden' }}
    >
      {/* Background Image (Hero Banner Style) */}
      {activeMovie && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${pathImage}${activeMovie.thumb_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          opacity: hoveredMovie ? 0.6 : 0.3,
          transition: 'background-image 0.5s ease-in-out, opacity 0.5s ease',
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, var(--bg-primary) 20%, transparent 80%)'
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 40%)'
          }} />
        </div>
      )}

      <div style={{
        position: 'absolute',
        right: '-5%',
        top: 0,
        width: '65%',
        height: '100%',
        zIndex: 1
      }}>
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: '60vw', height: '60vw',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, rgba(0,0,0,0) 70%)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}></div>

        <Canvas camera={{ position: [0, 0, 20], fov: 45 }} dpr={[1, 1.5]}>
          {/* <color attach="background" args={['#050505']} /> Removed to show HTML background */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />

          <Carousel movies={movies} pathImage={pathImage} radius={10} isHovering={isHovering} />

          <MouseParallax />

          <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={30} blur={2.5} far={5} resolution={256} frames={1} />
          <Environment preset="city" />
        </Canvas>
      </div>

      {/* HTML Overlay cho thông tin phim - Cinematic Hero Banner Style */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '5%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        textAlign: 'left',
        opacity: activeMovie ? 1 : 0,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        maxWidth: '550px',
        zIndex: 10,
        textShadow: '0 2px 10px rgba(0,0,0,0.8)'
      }}>
        {activeMovie && (
          <>
            <h4 style={{ color: '#ef4444', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '15px', fontSize: '0.9rem' }}>
              Phim Mới Nổi Bật
            </h4>

            <h1 style={{ margin: '0 0 15px 0', fontSize: '3.8rem', color: '#fff', fontWeight: '900', lineHeight: '1.1' }}>
              {activeMovie.name}
            </h1>

            <p style={{ color: '#e2e8f0', fontSize: '1.2rem', fontWeight: '500', marginBottom: '25px' }}>
              {activeMovie.origin_name} {activeMovie.year && `• ${activeMovie.year}`}
            </p>

            <div style={{ display: 'flex', gap: '15px', pointerEvents: 'auto' }}>
              <button
                onClick={() => window.location.href = `/phim/${activeMovie.slug}`}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#fff', color: '#000', border: 'none', borderRadius: '4px', fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Xem Ngay
              </button>

              <button
                onClick={() => window.location.href = `/phim/${activeMovie.slug}`}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: 'rgba(255,255,255,0.25)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'transform 0.2s, background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                Chi Tiết
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '30px',
        width: '100%',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
        pointerEvents: 'none',
        fontSize: '14px',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        fontFamily: 'sans-serif'
      }}>
        Kéo chuột sang hai bên để khám phá
      </div>

      {/* Lớp phủ Gradient (Mask) để tạo sự giao thoa mượt mà với phần giao diện bên dưới */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '150px',
        background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 20
      }} />
    </div>
  );
};

export default MovieCanvas;
