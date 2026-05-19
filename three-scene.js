import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const container = document.getElementById('canvas-container');

if (container) {
    // 1. Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#fcfbf9');

    // 2. Cámara
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 6);

    // 3. Renderizador WebGL con sombras de alta resolución
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves realistas
    container.appendChild(renderer.domElement);

    // 4. Entorno de Iluminación de Estudio (RoomEnvironment)
    // Esto es lo que hace que los metales y texturas se vean súper detallados e hiperrealistas
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // 5. Controles Orbitales completos
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Inercia fluida
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;    // Hacer zoom con scroll
    controls.enablePan = true;     // Paneo con click derecho
    controls.minDistance = 1;
    controls.maxDistance = 15;

    // 6. Luces direccionales precisas
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; // Alta resolución en sombra
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 7. Cargar modelo GLB (con prevención de caché)
    const loader = new GLTFLoader();
    
    const handleError = (error) => {
        console.error('Error al cargar modelo:', error);
        const loadingMsg = document.getElementById('loading-msg');
        if (loadingMsg) {
            loadingMsg.innerHTML = '<b style="color:red">Error de carga</b><br>Revisa tu consola. Asegúrate de ejecutar <b>node server.js</b>.';
        }
    };

    loader.load('assets/modelo.glb?v=' + Date.now(), function (gltf) {
        const loadedModel = gltf.scene;
        
        // Auto-Centrado perfecto
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        loadedModel.position.x += (loadedModel.position.x - center.x);
        loadedModel.position.y += (loadedModel.position.y - center.y);
        loadedModel.position.z += (loadedModel.position.z - center.z);

        // Auto-Escala perfecta
        const box2 = new THREE.Box3().setFromObject(loadedModel);
        const size = box2.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 4 / maxDim; // 4 unidades de cámara
            loadedModel.scale.set(scale, scale, scale);
            
            // Recalcular Y para que descanse sobre el piso
            const box3 = new THREE.Box3().setFromObject(loadedModel);
            const minY = box3.min.y;
            loadedModel.position.y += (-2 - minY);
        }

        // Correcciones avanzadas de Materiales
        loadedModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    // Previene agujeros y caras invisibles en la geometría
                    child.material.side = THREE.DoubleSide;
                    // Mejora la reacción de colores si estaba muy oscuro
                    child.material.needsUpdate = true;
                }
            }
        });
        
        // Quitar mensaje de carga
        const loadingMsg = document.getElementById('loading-msg');
        if (loadingMsg) loadingMsg.remove();

        scene.add(loadedModel);
    }, undefined, handleError);

    // 8. Base invisible solo para proyectar sombras súper estéticas
    const planeGeo = new THREE.PlaneGeometry(50, 50);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.15 }); 
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -2;
    plane.receiveShadow = true;
    scene.add(plane);

    // -- INTERACCIONES PROGRAMADAS --
    
    // 1. Animación del modelo (Rotación Automática)
    const btnAnimacion = document.getElementById('btn-animacion');
    if (btnAnimacion) {
        btnAnimacion.addEventListener('click', () => {
            controls.autoRotate = !controls.autoRotate;
            controls.autoRotateSpeed = 2.0;
            if (controls.autoRotate) {
                btnAnimacion.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar Rotación';
                btnAnimacion.style.backgroundColor = 'var(--primary-color)';
                btnAnimacion.style.color = '#fff';
            } else {
                btnAnimacion.innerHTML = '<i class="fa-solid fa-rotate"></i> Rotación Automática';
                btnAnimacion.style.backgroundColor = 'transparent';
                btnAnimacion.style.color = 'var(--text-color)';
            }
        });
    }

    // 2. Ajuste de Iluminación (Cambio de color de luz)
    const btnLuz = document.getElementById('btn-luz');
    const coloresLuz = [0xffffff, 0xffa500, 0x00ff00, 0x0000ff, 0xff00ff];
    let colorLuzIndex = 0;
    if (btnLuz) {
        btnLuz.addEventListener('click', () => {
            colorLuzIndex = (colorLuzIndex + 1) % coloresLuz.length;
            directionalLight.color.setHex(coloresLuz[colorLuzIndex]);
            btnLuz.style.borderColor = '#' + coloresLuz[colorLuzIndex].toString(16).padStart(6, '0');
        });
    }

    // 3. Cambio de tema Claro/Oscuro
    const btnTema = document.getElementById('btn-tema');
    if (btnTema) {
        btnTema.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            
            if (isDark) {
                btnTema.innerHTML = '<i class="fa-solid fa-sun"></i> Modo Claro';
                scene.background = new THREE.Color('#1a1a1a');
                ambientLight.intensity = 0.1;
                directionalLight.intensity = 0.8;
            } else {
                btnTema.innerHTML = '<i class="fa-solid fa-moon"></i> Modo Oscuro';
                scene.background = new THREE.Color('#fcfbf9');
                ambientLight.intensity = 0.4;
                directionalLight.intensity = 1.2;
            }
        });
    }

    // 9. Loop de Renderizado
    function animate() {
        requestAnimationFrame(animate);
        controls.update(); 
        renderer.render(scene, camera);
    }
    
    animate();

    // 10. Redimensionar responsivo
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}
