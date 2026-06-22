import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

const vertexShader = `
uniform float uHover;
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Hiệu ứng uốn cong 3D nhẹ khi hover
  float bendX = sin(pos.y * 3.0 + uTime * 3.0) * 0.1 * uHover;
  float bendY = cos(pos.x * 3.0 + uTime * 3.0) * 0.1 * uHover;
  pos.z += bendX + bendY;
  
  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPosition.xyz;
  
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform float uHover;
uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vec2 uv = vUv;
  
  // Tính khoảng cách từ pixel hiện tại đến vị trí chuột
  float dist = distance(uv, uMouse);
  
  // Hiệu ứng gợn sóng (Ripple) tỏa ra từ vị trí chuột
  float ripple = sin(dist * 30.0 - uTime * 15.0) * exp(-dist * 6.0) * uHover;
  
  // Áp dụng biến dạng lên UV
  vec2 distortedUv = uv + (uv - uMouse) * ripple * 0.15;
  
  // Hiệu ứng phân tách màu (RGB Shift) rõ rệt tại tâm điểm
  float shiftStrength = 0.05 * uHover * exp(-dist * 4.0);
  float r = texture2D(uTexture, distortedUv + vec2(shiftStrength, 0.0)).r;
  float g = texture2D(uTexture, distortedUv).g;
  float b = texture2D(uTexture, distortedUv - vec2(shiftStrength, 0.0)).b;
  
  vec4 color = vec4(r, g, b, 1.0);
  
  // Tăng cường độ sáng nhẹ cho toàn bộ poster để ảnh rõ và trong trẻo hơn
  color.rgb += vec3(0.08);
  
  // Tăng độ sáng tại điểm chuột
  float glow = exp(-dist * 8.0) * 0.3 * uHover;
  color.rgb += vec3(glow);
  
  // Hiệu ứng mờ dần vào bóng tối cho các phim ở phía sau (Depth Fading)
  // Bắt đầu mờ từ z = 4.0 và chìm hẳn vào nền đen khi z = -6.0
  float depthFade = smoothstep(4.0, -6.0, vWorldPos.z);
  vec3 bgColor = vec3(0.008, 0.024, 0.090); // Màu #020617 (Slate blue dark)
  color.rgb = mix(color.rgb, bgColor, depthFade * 0.95);
  
  // Bo góc (Rounded corners)
  vec2 size = vec2(2.5, 3.75);
  vec2 pos = (uv - 0.5) * size;
  
  // Bán kính bo góc bất đối xứng (Top-Left to, còn lại nhỏ)
  float rTopLeft = 0.6;
  float rTopRight = 0.15;
  float rBottomRight = 0.15;
  float rBottomLeft = 0.15;
  
  float r = (pos.x > 0.0) 
            ? ((pos.y > 0.0) ? rTopRight : rBottomRight) 
            : ((pos.y > 0.0) ? rTopLeft : rBottomLeft);
            
  vec2 bounds = (size * 0.5) - r;
  float d = length(max(abs(pos) - bounds, 0.0)) - r;
  float alpha = 1.0 - smoothstep(0.0, 0.03, d);
  
  color.a *= alpha;
  
  gl_FragColor = color;
}
`;

const MoviePlane = ({ movie, pathImage, position, rotation, onHover, onUnhover }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const [texture, setTexture] = useState(null);

  const imageUrl = movie.thumb_url?.startsWith('http') ? movie.thumb_url : `${pathImage}${movie.thumb_url}`;

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      imageUrl,
      (tex) => {
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.error("Lỗi tải ảnh:", err);
        // Ảnh mặc định nếu lỗi
        loader.load('https://via.placeholder.com/300x400?text=No+Image', (fbTex) => {
          setTexture(fbTex);
        });
      }
    );
  }, [imageUrl]);

  const uniforms = useMemo(() => ({
    uTexture: { value: null },
    uHover: { value: 0 },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) }
  }), []);

  useFrame((state, delta) => {
    if (materialRef.current) {
      if (texture) {
        materialRef.current.uniforms.uTexture.value = texture;
      }
      materialRef.current.uniforms.uTime.value += delta;

      const targetHover = hovered ? 1 : 0;
      materialRef.current.uniforms.uHover.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uHover.value,
        targetHover,
        0.1
      );
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    navigate(`/phim/${movie.slug}`);
  };

  if (!texture) return null; // Không hiển thị gì cho đến khi tải ảnh xong

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        const worldPos = new THREE.Vector3();
        e.object.getWorldPosition(worldPos);
        if (worldPos.z < 0) return;

        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
        if (onHover) onHover(movie);
      }}
      onPointerMove={(e) => {
        const worldPos = new THREE.Vector3();
        e.object.getWorldPosition(worldPos);
        if (worldPos.z < 0) return;

        e.stopPropagation();
        if (materialRef.current && e.uv) {
          materialRef.current.uniforms.uMouse.value.set(e.uv.x, e.uv.y);
        }
      }}
      onPointerOut={(e) => {
        setHovered(false);
        document.body.style.cursor = 'grab';
        if (onUnhover) onUnhover();
      }}
      onClick={(e) => {
        const worldPos = new THREE.Vector3();
        e.object.getWorldPosition(worldPos);
        if (worldPos.z < 0) return;

        navigate(`/phim/${movie.slug}`);
      }}
    >
      <planeGeometry args={[2.5, 3.75, 16, 16]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
      />
      <Html 
        position={[0.7, -1.45, 0.01]} 
        transform 
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(4px)',
          color: '#fbbf24',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
          fontFamily: 'sans-serif'
        }}>
           {movie.episode_current || movie.year || '4.5'}
        </div>
      </Html>
    </mesh>
  );
};

export default MoviePlane;
