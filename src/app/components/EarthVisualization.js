'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function EarthVisualization({ planetData }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Safety check for SSR and container
    if (typeof window === 'undefined' || !containerRef.current) return;
    
    let animationFrameId;
    let controls;
    
    // Clear any existing content
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    
    // Dynamically import OrbitControls to avoid SSR issues
    import('three/addons/controls/OrbitControls.js').then(({ OrbitControls }) => {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.5;
    }).catch(err => {
      console.log('OrbitControls could not be loaded, but Earth will still be visible');
    });

    // Create Earth sphere
    const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
    
    // Create a highly detailed and realistic Earth material
    const earthMaterial = new THREE.MeshStandardMaterial({
      // Base color (will be overridden by texture)
      color: 0xffffff,
      // Make the material more responsive to light
      roughness: 0.5,
      metalness: 0.1,
      // Increase the overall brightness
      emissive: 0x222222,
      emissiveIntensity: 0.2,
      // Enhance surface detail
      bumpScale: 0.05,
      // Increase contrast
      contrast: 1.5,
      // Enable physically correct lighting
      physicallyCorrectLights: true
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    
    // Add stars to the background with enhanced visual appeal
    const createStarField = (count, size, color, distance) => {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      const sizes = [];
      const colors = [];
      
      for (let i = 0; i < count; i++) {
        // Create stars in a spherical distribution around the camera
        const x = (Math.random() - 0.5) * distance;
        const y = (Math.random() - 0.5) * distance;
        const z = (Math.random() - 0.5) * distance;
        vertices.push(x, y, z);
        
        // Random size variation
        const starSize = Math.random() * size + size * 0.5;
        sizes.push(starSize);
        
        // Color variation
        const r = color.r + (Math.random() * 0.1 - 0.05);
        const g = color.g + (Math.random() * 0.1 - 0.05);
        const b = color.b + (Math.random() * 0.1 - 0.05);
        colors.push(r, g, b);
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      
      const material = new THREE.PointsMaterial({
        size: size,
        vertexColors: true,
        transparent: true,
        sizeAttenuation: true,
      });
      
      return new THREE.Points(geometry, material);
    };
    
    // Create three layers of stars with different characteristics
    // Distant stars (small, numerous)
    const distantStars = createStarField(
      15000, // More stars
      0.05,
      new THREE.Color(0.9, 0.9, 1), // Slightly blue tint
      2000
    );
    scene.add(distantStars);
    
    // Mid-distance stars (medium size, some color variation)
    const midStars = createStarField(
      5000,
      0.1,
      new THREE.Color(1, 0.95, 0.8), // Slightly yellow tint
      1500
    );
    scene.add(midStars);
    
    // Bright foreground stars (larger, more colorful)
    const brightStars = createStarField(
      1000,
      0.15,
      new THREE.Color(0.95, 0.9, 1), // Slightly purple tint
      1000
    );
    scene.add(brightStars);
    
    // Set a timeout to ensure loading state is cleared even if texture loading fails
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    // Load multiple textures for a highly realistic Earth
    const textureLoader = new THREE.TextureLoader();
    const texturePromises = [];
    
    // Load diffuse (color) map
    const diffusePromise = new Promise((resolve, reject) => {
      textureLoader.load(
        '/textures/earth/earth_daymap.jpg',
        (texture) => {
          // Enhance texture brightness and contrast
          texture.colorSpace = THREE.SRGBColorSpace; // Updated from deprecated sRGBEncoding
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          earthMaterial.map = texture;
          earthMaterial.needsUpdate = true;
          resolve();
        },
        undefined,
        reject
      );
    });
    texturePromises.push(diffusePromise);
    
    // Load specular map for shiny areas (oceans, etc.)
    const specularPromise = new Promise((resolve, reject) => {
      textureLoader.load(
        '/textures/earth/earth_specular.jpg',
        (texture) => {
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          earthMaterial.metalnessMap = texture;
          earthMaterial.roughnessMap = texture;
          earthMaterial.needsUpdate = true;
          resolve();
        },
        undefined,
        reject
      );
    });
    texturePromises.push(specularPromise);
    
    // Load normal map for terrain detail
    const normalPromise = new Promise((resolve, reject) => {
      textureLoader.load(
        '/textures/earth/earth_normal.jpg',
        (texture) => {
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          earthMaterial.normalMap = texture;
          earthMaterial.normalScale.set(0.05, 0.05); // Subtle but visible terrain
          earthMaterial.needsUpdate = true;
          resolve();
        },
        undefined,
        reject
      );
    });
    texturePromises.push(normalPromise);
    
    // Handle all texture loading
    Promise.all(texturePromises)
      .then(() => {
        clearTimeout(loadingTimeout);
        setLoading(false);
      })
      .catch(() => {
        // On error, revert to default color
        clearTimeout(loadingTimeout);
        console.error('Failed to load one or more Earth textures');
        setLoading(false);
      });
    

    // Add very bright ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x909090); // Much brighter ambient light
    scene.add(ambientLight);

    // Add strong directional light (sun) with warm color for realistic sunlight
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0); // Higher intensity
    sunLight.position.set(5, 3, 5);
    sunLight.color.setHex(0xfffaf0); // Warm white sunlight color
    // Add shadows for more realism
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);
    
    // Add a strong hemisphere light to simulate atmospheric scattering
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x6666ff, 0.6); // Increased intensity with blue ground reflection
    scene.add(hemiLight);
    
    // Add a stronger point light on the opposite side for rim lighting
    const backLight = new THREE.PointLight(0x4080ff, 0.8); // Brighter with blue tint
    backLight.position.set(-5, -3, -5);
    scene.add(backLight);
    
    // Add a subtle fill light to brighten up shadowed areas
    const fillLight = new THREE.PointLight(0xffffcc, 0.5); // Soft yellow fill light
    fillLight.position.set(0, -5, 0); // Position below
    scene.add(fillLight);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      if (!containerRef.current) return; // Stop animation if component unmounted
      
      animationFrameId = requestAnimationFrame(animate);
      
      // Slowly rotate the Earth - realistic rotation speed
      earth.rotation.y += 0.0005;
      
      // Add slight wobble to simulate Earth's axial tilt
      earth.rotation.x = Math.sin(Date.now() * 0.0000005) * 0.02;
      
      // Update controls if available
      if (controls) controls.update();
      
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      // Cancel animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      window.removeEventListener('resize', handleResize);
      
      // Clean up scene
      if (backLight) backLight.dispose();
      scene.clear();
      
      // Dispose geometries and materials
      earthGeometry.dispose();
      earthMaterial.dispose();
      
      // Dispose star field resources
      if (distantStars) {
        distantStars.geometry.dispose();
        distantStars.material.dispose();
      }
      if (midStars) {
        midStars.geometry.dispose();
        midStars.material.dispose();
      }
      if (brightStars) {
        brightStars.geometry.dispose();
        brightStars.material.dispose();
      }
      
      // Dispose of the fill light
      if (fillLight) fillLight.dispose();
      
      // Dispose renderer
      renderer.dispose();
      
      // Remove renderer from DOM
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Loading Earth visualization...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          {error}
        </div>
      )}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />
      {planetData && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded shadow-lg">
          <h3 className="text-xl font-bold mb-2 flex items-center">
            <span className="inline-block w-6 h-6 rounded-full bg-blue-500 mr-2"></span>
            {planetData.name}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-semibold">Mass:</div><div>{planetData.mass} M⊕</div>
            <div className="font-semibold">Radius:</div><div>{planetData.radius} R⊕</div>
            <div className="font-semibold">Period:</div><div>{planetData.period} days</div>
            <div className="font-semibold">Temperature:</div><div>{planetData.temperature} K</div>
            {planetData.host_star_mass && (
              <>
                <div className="font-semibold">Star Mass:</div><div>{planetData.host_star_mass} M☉</div>
              </>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-600 text-xs text-gray-400">
            Drag to rotate • Scroll to zoom
          </div>
        </div>
      )}
    </div>
  );
}
