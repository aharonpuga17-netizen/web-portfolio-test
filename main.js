import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- CONFIGURACIÓN BÁSICA DE LA ESCENA ---
const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();

// Añadir niebla para profundidad
scene.fog = new THREE.FogExp2(0x050505, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true, // Fondo transparente para ver el CSS debajo (aunque usamos un oscuro por defecto)
    antialias: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// Tone mapping para luces más realistas
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// --- GEOMETRÍA PLACEHOLDER PREMIUN ---
// Crearemos algo espectacular en código mientras configuras tus modelos Blender

const geometry = new THREE.IcosahedronGeometry(3, 1); // Figura elegante
const material = new THREE.MeshPhysicalMaterial({
    color: 0x7a32ff, // Morado neón
    emissive: 0x220055, // Brillo propio
    roughness: 0.1, // Muy pulido
    metalness: 0.8, // Aspecto metálico
    transmission: 0.9, // Aspecto de cristal (Glassmorphism 3D)
    thickness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
});

const mainObject = new THREE.Mesh(geometry, material);
scene.add(mainObject);

// Crearemos pequeños "satélites" de cristal para rellenar
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 200;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 40;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x00d2ff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- CÓDIGO PARA TUS MODELOS DE BENDER ---
/* 
INSTRUCCIONES PARA AÑADIR MODELOS DE BLENDER (.GLB)
1. Exporta tu modelo desde Blender en formato glTF 2.0 (.glb)
2. Coloca el archivo en la misma carpeta o en una carpeta "models"
3. Descomenta el código de abajo y reemplaza 'tu_modelo.glb'
*/

/*
const loader = new GLTFLoader();
let blenderModel = null;

loader.load(
    'tu_modelo.glb', 
    function (gltf) {
        blenderModel = gltf.scene;
        // Ajusta la escala si tu modelo de Blender sale muy grande o pequeño
        blenderModel.scale.set(1.5, 1.5, 1.5);
        scene.add(blenderModel);
        
        // Ocultar el objeto placeholder
        mainObject.visible = false;
    },
    undefined,
    function (error) {
        console.error('Error cargando el modelo de Blender:', error);
    }
);
*/

// --- ILUMINACIÓN ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x7a32ff, 50, 100);
pointLight1.position.set(5, 5, 5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x00d2ff, 50, 100);
pointLight2.position.set(-5, -5, 5);
scene.add(pointLight2);


// --- CONTROLES MOUSE (OrbitControls) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Movimiento suave
controls.dampingFactor = 0.05;
controls.enableZoom = false; // Desactivar zoom para no arruinar el scroll de la web


// --- ANIMACIÓN AL HACER SCROLL ---
let scrollY = window.scrollY;
let currentSection = 0;

window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    
    // Cambiar el color o posición del objeto según el scroll (animación programática)
    const newSection = Math.round(scrollY / window.innerHeight);
    if (newSection !== currentSection) {
        currentSection = newSection;
        
        // Efecto "Flash" al cambiar de sección
        material.emissive.setHex(Math.random() > 0.5 ? 0x002255 : 0x220055);
    }
});


// --- CICLO DE RENDERIZADO (TICK) ---
const clock = new THREE.Clock();

let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
});

function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    
    // Rotar objeto principal
    mainObject.rotation.y += 0.005;
    mainObject.rotation.x += 0.002;
    
    // Animar las partículas suavemente
    particlesMesh.rotation.y = -time * 0.05;
    particlesMesh.rotation.x = time * 0.02;

    // Movimiento sutil de la cámara con el ratón (Parallax)
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    // Actualizar controles
    controls.update();
    
    renderer.render(scene, camera);
}

// Empezar animación
animate();


// --- RESPONSIVE DESING ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
