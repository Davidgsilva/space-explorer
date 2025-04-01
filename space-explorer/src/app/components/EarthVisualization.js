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
    
    // Create a more realistic Earth material with land and water colors
    const earthMaterial = new THREE.MeshPhongMaterial({
      // Using a more natural blue-green color as base
      color: 0x1a4d7c,
      shininess: 25,
      specular: 0x333333,
      // Add some ambient occlusion for depth
      aoMapIntensity: 1.0,
      // Make it slightly reflective like water
      reflectivity: 0.5
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    
    // Add stars to the background
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Set a timeout to ensure loading state is cleared even if texture loading fails
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    // Ensure the texture is applied correctly and update material settings
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/land_shallow_topo_2048.jpg',
      (texture) => {
        clearTimeout(loadingTimeout);
        earthMaterial.map = texture;
        earthMaterial.needsUpdate = true;
        setLoading(false);
      },
      undefined,
      () => {
        // On error, revert to default color
        clearTimeout(loadingTimeout);
        setLoading(false);
      }
    );

    // Add ambient light - slightly warmer tone for more natural look
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Add directional light (sun) - slightly yellow tint like real sunlight
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    sunLight.color.setHex(0xfff5e0); // Slightly warm sunlight color
    scene.add(sunLight);
    
    // Add a subtle hemisphere light to simulate atmospheric scattering
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
    scene.add(hemiLight);

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
      scene.clear();
      
      // Dispose geometries and materials
      earthGeometry.dispose();
      earthMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      
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
