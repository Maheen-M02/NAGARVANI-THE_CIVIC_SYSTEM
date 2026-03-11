import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import './GridDistortion.css';

const vertexShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  
  // Add subtle time-based movement
  vec3 pos = position;
  pos.z += sin(pos.x * 5.0 + time * 0.5) * cos(pos.y * 5.0 + time * 0.3) * 0.02;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const fragmentShader = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
uniform float time;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec4 offset = texture2D(uDataTexture, vUv);
  
  // Increase distortion intensity
  vec2 distortion = offset.rg * 0.08;
  
  // Add some wave-like distortion for more visual effect
  float wave = sin(uv.x * 10.0 + time * 0.5) * cos(uv.y * 10.0 + time * 0.3) * 0.01;
  distortion += wave;
  
  // Create grid pattern similar to the existing one
  vec2 gridUv = (uv - distortion) * 48.0; // 48px grid size
  vec2 grid = abs(fract(gridUv - 0.5) - 0.5) / fwidth(gridUv);
  float line = min(grid.x, grid.y);
  
  // Grid color (blue tint like the original)
  vec3 gridColor = vec3(1.0, 1.0, 1.0) * 0.07; // White with low opacity
  vec3 backgroundColor = vec3(0.051, 0.106, 0.251); // #0D1B40 background
  
  // Mix grid and background
  vec3 color = mix(gridColor, backgroundColor, smoothstep(0.0, 2.0, line));
  
  gl_FragColor = vec4(color, 1.0);
}`;

const GridDistortion = ({ 
  grid = 15, 
  mouse = 0.1, 
  strength = 0.15, 
  relaxation = 0.9, 
  className = '' 
}) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const planeRef = useRef(null);
  const animationIdRef = useRef(null);
  const resizeObserverRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
    camera.position.z = 2;
    cameraRef.current = camera;

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      uDataTexture: { value: null }
    };

    // Remove texture loading since we're generating the grid in the shader
    const size = grid;
    const data = new Float32Array(4 * size * size);
    for (let i = 0; i < size * size; i++) {
      // Increase initial distortion values for more visible effect
      data[i * 4] = (Math.random() - 0.5) * 500;
      data[i * 4 + 1] = (Math.random() - 0.5) * 500;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 1;
    }

    const dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    dataTexture.needsUpdate = true;
    uniforms.uDataTexture.value = dataTexture;

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true
    });

    const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
    const plane = new THREE.Mesh(geometry, material);
    planeRef.current = plane;
    scene.add(plane);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) return;

      const containerAspect = width / height;
      renderer.setSize(width, height);

      if (plane) {
        plane.scale.set(containerAspect, 1, 1);
      }

      const frustumHeight = 1;
      const frustumWidth = frustumHeight * containerAspect;

      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();

      uniforms.resolution.value.set(width, height, 1, 1);
    };

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
      resizeObserverRef.current = resizeObserver;
    } else {
      window.addEventListener('resize', handleResize);
    }

    const mouseState = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      vX: 0,
      vY: 0
    };

    const handleMouseMove = e => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;

      mouseState.vX = x - mouseState.prevX;
      mouseState.vY = y - mouseState.prevY;

      Object.assign(mouseState, { x, y, prevX: x, prevY: y });
    };

    const handleMouseLeave = () => {
      if (dataTexture) {
        dataTexture.needsUpdate = true;
      }
      Object.assign(mouseState, {
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        vX: 0,
        vY: 0
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    handleResize();

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (!renderer || !scene || !camera) return;

      uniforms.time.value += 0.05;

      const data = dataTexture.image.data;
      for (let i = 0; i < size * size; i++) {
        data[i * 4] *= relaxation;
        data[i * 4 + 1] *= relaxation;
      }

      const gridMouseX = size * mouseState.x;
      const gridMouseY = size * mouseState.y;
      const maxDist = size * mouse;

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const distSq = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2);
          if (distSq < maxDist * maxDist) {
            const index = 4 * (i + size * j);
            const power = Math.min(maxDist / Math.sqrt(distSq), 15);
            
            // Increase the multiplier for more visible distortion
            data[index] += strength * 200 * mouseState.vX * power;
            data[index + 1] -= strength * 200 * mouseState.vY * power;
          }
        }
      }

      dataTexture.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }

      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);

      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }

      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (dataTexture) dataTexture.dispose();

      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      planeRef.current = null;
    };
  }, [grid, mouse, strength, relaxation]);

  return (
    <div
      ref={containerRef}
      className={`distortion-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        minWidth: '0',
        minHeight: '0'
      }}
    />
  );
};

export default GridDistortion;