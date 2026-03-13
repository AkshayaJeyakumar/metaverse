/**
 * world.js - Virtual Tourist Explorer 3D World
 *
 * A simple metaverse-style tourist exploration scene.
 * Loads real 3D monument models (.glb) using GLTFLoader.
 *
 * URL Parameters (monument switching):
 *   world.html?place=eiffel  → loads models/SM - Eiffel Tower.glb
 *   world.html?place=taj     → loads models/Palace.glb
 *   world.html?place=wall    → loads models/Castle Fortress.glb
 */

// ========== Monument Configuration ==========
// Maps URL param to model file
const MONUMENT_CONFIG = {
    eiffel: {
        modelPath: 'models/SM - Eiffel Tower.glb',
        name: 'Eiffel Tower',
        location: 'Paris, France',
        description: 'An iconic iron lattice tower completed in 1889 for the World\'s Fair. Designed by Gustave Eiffel, it stands 330 meters tall and is a global symbol of France.'
    },
    taj: {
        modelPath: 'models/Palace.glb',
        name: 'Taj Mahal',
        location: 'Agra, India',
        description: 'A stunning white marble mausoleum built by Mughal Emperor Shah Jahan (1632–1653) in memory of his wife Mumtaz Mahal. One of the finest examples of Mughal architecture.'
    },
    wall: {
        modelPath: 'models/Castle Fortress.glb',
        name: 'Great Wall of China',
        location: 'China',
        description: 'An ancient series of walls and fortifications spanning over 13,000 miles. The best-preserved sections date from the Ming dynasty (1368–1644).'
    }
};

// Scale factors per monument (all set to 3 for simplicity)
const MODEL_SCALE = {
    eiffel: { x: 3, y: 3, z: 3 },
    taj: { x: 3, y: 3, z: 3 },
    wall: { x: 3, y: 3, z: 3 }
};

// ========== Scene Variables ==========
let scene, camera, renderer, controls;
let landmarkGroup;
let currentPlace;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// WASD movement
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const moveSpeed = 0.15;

// ========== Monument Switching (URL Parameter) ==========
/**
 * Reads ?place= from URL to determine which monument to load.
 * Valid values: eiffel, taj, wall
 * Default: taj
 */
function getPlaceFromURL() {
    const params = new URLSearchParams(window.location.search);
    const place = params.get('place');
    if (place && MONUMENT_CONFIG[place]) {
        return place;
    }
    return 'taj';
}

// ========== Initialize 3D World ==========
function init() {
    const container = document.getElementById('canvas-container');
    currentPlace = getPlaceFromURL();
    const config = MONUMENT_CONFIG[currentPlace];

    // ----- 1. SCENE SETUP -----
    scene = new THREE.Scene();

    // Sky blue background
    scene.background = new THREE.Color(0x87ceeb);

    // Fog for depth (color, near, far) - creates atmospheric perspective
    scene.fog = new THREE.Fog(0x87ceeb, 30, 300);

    // ----- 2. CAMERA -----
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 8);

    // ----- 3. RENDERER -----
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance: cap pixel ratio
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ----- 4. LIGHTING -----
    // Ambient light - soft fill, no shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Directional light - simulates sun, casts shadows
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(20, 40, 20);
    sunLight.castShadow = true;
    // Shadow map setup for quality and performance
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // ----- 5. ENVIRONMENT - Ground (Grass) -----
    // Large 500x500 plane for terrain - rotated to lie flat (horizontal)
    const groundSize = 500;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d5a27,      // Natural grass green
        roughness: 0.9,
        metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;  // Rotate: vertical plane → horizontal floor
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // ----- 6. MODEL LOADING -----
    loadMonumentModel(config);

    // ----- 7. CAMERA CONTROLS - OrbitControls + WASD -----
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // ----- 8. EVENT LISTENERS -----
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    container.addEventListener('click', onCanvasClick);
    document.getElementById('screenshot-btn').addEventListener('click', takeScreenshot);
    document.getElementById('close-popup').addEventListener('click', hidePopup);
    document.getElementById('popup-overlay').addEventListener('click', hidePopup);
    window.addEventListener('resize', onWindowResize);

    animate();
}

// ========== Model Loading (GLTFLoader) ==========
/**
 * Loads .glb model from models folder using GLTFLoader.
 * Scales to 3,3,3 and positions at center.
 * If loading fails, logs error to console.
 */
function loadMonumentModel(config) {
    const loader = new THREE.GLTFLoader();

    loader.load(
        config.modelPath,
        function (gltf) {
            const model = gltf.scene;
            landmarkGroup = model;

            // Store popup info on every mesh for click detection
            const info = { name: config.name, location: config.location, description: config.description };
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData.landmarkInfo = info;
                    child.castShadow = true;   // Monument casts shadow
                    child.receiveShadow = true;
                }
            });

            // Scale and position model at center
            model.position.set(0, 0, 0);
            const scale = MODEL_SCALE[currentPlace] || { x: 3, y: 3, z: 3 };
            model.scale.set(scale.x, scale.y, scale.z);

            // Center model (some GLBs have offset pivot)
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);

            scene.add(model);
        },
        undefined,
        function (error) {
            console.error('Failed to load model:', config.modelPath, error);
        }
    );
}

// ========== Movement Controls (WASD) ==========
/**
 * WASD moves the OrbitControls target = moves through the scene.
 * Mouse drag rotates camera around the target (OrbitControls handles this).
 */
function updateMovement() {
    if (!controls) return;

    const target = controls.target;
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    cameraDir.y = 0;
    cameraDir.normalize();
    const right = new THREE.Vector3().crossVectors(cameraDir, new THREE.Vector3(0, 1, 0));

    if (moveForward) target.addScaledVector(cameraDir, moveSpeed);
    if (moveBackward) target.addScaledVector(cameraDir, -moveSpeed);
    if (moveRight) target.addScaledVector(right, moveSpeed);
    if (moveLeft) target.addScaledVector(right, -moveSpeed);

    target.y = 0;
}

function onKeyDown(e) {
    switch (e.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
    }
}

function onKeyUp(e) {
    switch (e.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

// ========== Interaction - Click Monument for Popup ==========
function onCanvasClick(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const meshes = [];
    if (landmarkGroup) {
        landmarkGroup.traverse((child) => {
            if (child.isMesh) meshes.push(child);
        });
    }

    const intersects = raycaster.intersectObjects(meshes);
    if (intersects.length > 0 && intersects[0].object.userData.landmarkInfo) {
        showPopup(intersects[0].object.userData.landmarkInfo);
    }
}

function showPopup(info) {
    document.getElementById('popup-title').textContent = info.name;
    document.getElementById('popup-country').textContent = info.location;
    document.getElementById('popup-description').textContent = info.description;
    document.getElementById('landmark-popup').classList.remove('hidden');
}

function hidePopup() {
    document.getElementById('landmark-popup').classList.add('hidden');
}

// ========== Window Resize ==========
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ========== Screenshot ==========
function takeScreenshot() {
    renderer.render(scene, camera);
    const link = document.createElement('a');
    link.download = 'virtual-tour-' + currentPlace + '.png';
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();
}

// ========== Animation Loop ==========
function animate() {
    requestAnimationFrame(animate);
    updateMovement();
    if (controls) controls.update();
    renderer.render(scene, camera);
}

init();

    // Directional light - simulates sun, casts shadows
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(20, 40, 20);
    sunLight.castShadow = true;
    // Shadow map setup for quality and performance
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // ----- 5. ENVIRONMENT - Ground (Grass) -----
    // Large 500x500 plane for terrain - rotated to lie flat (horizontal)
    const groundSize = 500;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d5a27,      // Natural grass green
        roughness: 0.9,
        metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;  // Rotate: vertical plane → horizontal floor
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // ----- 6. MODEL LOADING -----
    loadMonumentModel(config);

    // ----- 7. CAMERA CONTROLS - OrbitControls + WASD -----
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // ----- 8. EVENT LISTENERS -----
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    container.addEventListener('click', onCanvasClick);
    document.getElementById('screenshot-btn').addEventListener('click', takeScreenshot);
    document.getElementById('close-popup').addEventListener('click', hidePopup);
    document.getElementById('popup-overlay').addEventListener('click', hidePopup);
    window.addEventListener('resize', onWindowResize);

    animate();
}

// ========== Model Loading (GLTFLoader) ==========
/**
 * Loads .glb model from models folder using GLTFLoader.
 * Scales to 3,3,3 and positions at center.
 * If loading fails, logs error to console.
 */
function loadMonumentModel(config) {
    const loader = new THREE.GLTFLoader();

    loader.load(
        config.modelPath,
        function (gltf) {
            const model = gltf.scene;
            landmarkGroup = model;

            // Store popup info on every mesh for click detection
            const info = { name: config.name, location: config.location, description: config.description };
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData.landmarkInfo = info;
                    child.castShadow = true;   // Monument casts shadow
                    child.receiveShadow = true;
                }
            });

            // Scale and position model at center
            model.position.set(0, 0, 0);
            const scale = MODEL_SCALE[currentPlace] || { x: 5, y: 5, z: 5 };
            model.scale.set(scale.x, scale.y, scale.z);

            // Center model (some GLBs have offset pivot)
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);

            scene.add(model);
        },
        undefined,
        function (error) {
            console.error('Failed to load model:', config.modelPath, error);
        }
    );
}

// ========== Movement Controls (WASD) ==========
/**
 * WASD moves the OrbitControls target = moves through the scene.
 * Mouse drag rotates camera around the target (OrbitControls handles this).
 */
function updateMovement() {
    if (!controls) return;

    const target = controls.target;
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    cameraDir.y = 0;
    cameraDir.normalize();
    const right = new THREE.Vector3().crossVectors(cameraDir, new THREE.Vector3(0, 1, 0));

    if (moveForward) target.addScaledVector(cameraDir, moveSpeed);
    if (moveBackward) target.addScaledVector(cameraDir, -moveSpeed);
    if (moveRight) target.addScaledVector(right, moveSpeed);
    if (moveLeft) target.addScaledVector(right, -moveSpeed);

    target.y = 0;
}

function onKeyDown(e) {
    switch (e.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
    }
}

function onKeyUp(e) {
    switch (e.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

// ========== Interaction - Click Monument for Popup ==========
function onCanvasClick(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const meshes = [];
    if (landmarkGroup) {
        landmarkGroup.traverse((child) => {
            if (child.isMesh) meshes.push(child);
        });
    }

    const intersects = raycaster.intersectObjects(meshes);
    if (intersects.length > 0 && intersects[0].object.userData.landmarkInfo) {
        showPopup(intersects[0].object.userData.landmarkInfo);
    }
}

function showPopup(info) {
    document.getElementById('popup-title').textContent = info.name;
    document.getElementById('popup-country').textContent = info.location;
    document.getElementById('popup-description').textContent = info.description;
    document.getElementById('landmark-popup').classList.remove('hidden');
}

function hidePopup() {
    document.getElementById('landmark-popup').classList.add('hidden');
}

// ========== Window Resize ==========
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ========== Screenshot ==========
function takeScreenshot() {
    renderer.render(scene, camera);
    const link = document.createElement('a');
    link.download = 'virtual-tour-' + currentPlace + '.png';
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();
}

// ========== Animation Loop ==========
function animate() {
    requestAnimationFrame(animate);
    updateMovement();
    if (controls) controls.update();
    renderer.render(scene, camera);
}

init();
