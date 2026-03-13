# Virtual Tourist Explorer

A simple web-based 3D tourist exploration website built with HTML, CSS, JavaScript, and Three.js. Perfect for beginners learning web development and 3D graphics.

## Project Structure

```
virtual-tour/
├── index.html          # Landing page
├── explore.html        # Tourist destination cards
├── world.html          # 3D virtual world
├── README.md
├── css/
│   └── style.css       # All styles
├── js/
│   ├── script.js       # Landing & explore page logic
│   └── world.js        # 3D scene, controls, popup, screenshot
├── models/
│   └── (landmark.glb)  # Optional: add your own 3D models
└── assets/
    └── images/         # Optional: local images for cards
```

## How to Run Locally

### Option 1: Live Server (Recommended)

1. **Install a local server** – You need a server because some browsers restrict loading files directly:
   - **VS Code**: Install the "Live Server" extension, then right-click `index.html` → "Open with Live Server"
   - **Or** use Python: `python -m http.server 8000` then open `http://localhost:8000`

2. Open `http://localhost:8000` (or the port your server uses)

3. Navigate: Home → Explore → Pick a landmark → Enter 3D World

### Option 2: Python Simple HTTP Server

```bash
cd virtual-tour
python -m http.server 8000
```

Then open: `http://localhost:8000`

### Option 3: Node.js (if you have it)

```bash
cd virtual-tour
npx serve .
```

Then open the URL shown in the terminal.

---

## Features

| Feature | Description |
|--------|-------------|
| **Landing Page** | Title, nav bar, "Start Virtual Tour" button, feature highlights |
| **Explore Page** | Cards for Taj Mahal, Eiffel Tower, Great Wall of China |
| **3D World** | Ground plane, sky, lighting, WASD movement, mouse look |
| **Landmark Click** | Click the 3D landmark to see a popup with name, location, history, fun fact |
| **Screenshot** | Button to capture and download a PNG of the 3D scene |

## Controls in 3D World

| Action | Control |
|--------|---------|
| **Move** | W (forward), S (back), A (left), D (right) |
| **Look** | Move mouse (after clicking canvas to lock pointer) |
| **Start** | Click anywhere on the 3D canvas to enable mouse control |
| **Landmark info** | Look at landmark and click |
| **Screenshot** | Click the "📸 Screenshot" button in the nav bar |

---

## Code Overview (for Students)

### `index.html`
- Navigation bar with links
- Hero section with title and CTA button
- Feature cards explaining the project

### `explore.html`
- Three tourist cards with images (from Unsplash CDN)
- Each card links to `world.html?place=tajmahal` (or `eiffel`, `greatwall`)

### `world.html`
- Loads Three.js from CDN
- Contains the canvas container, controls hint, and landmark popup
- Loads `world.js` which does all 3D work

### `world.js` – Key Parts

1. **`init()`** – Creates scene, camera, renderer, ground, lights, and landmark
2. **`createLandmark()`** – Builds a simple 3D shape (cylinder, box, sphere) as a landmark
3. **WASD + Mouse** – `onKeyDown`/`onKeyUp` and `onMouseMove` update movement/rotation
4. **Pointer Lock** – `requestPointerLock()` so mouse controls the camera
5. **Raycaster** – On click, casts a ray from camera to detect if the landmark was clicked
6. **`showPopup()`** – Displays landmark info in a modal
7. **`takeScreenshot()`** – Uses `canvas.toDataURL('image/png')` to download the frame

### Using a Real 3D Model (GLB)

To use `models/landmark.glb` instead of primitives:

1. Add the GLTFLoader: `<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>`
2. In `world.js`, replace `createLandmark()` with a loader that loads the GLB
3. See [Three.js GLTF Loader docs](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)

---

## Tips for Customization

- **Colors**: Edit CSS variables in `:root` in `style.css`
- **New landmarks**: Add data to `LANDMARK_DATA` in `world.js` and a new card in `explore.html`
- **Movement speed**: Change `moveSpeed` in `world.js`
- **Images**: Replace Unsplash URLs in `explore.html` with paths to `assets/images/`

---

## Technologies Used

- **HTML5** – Structure
- **CSS3** – Gradients, flexbox, grid, animations
- **JavaScript (ES6+)** – Interactivity
- **Three.js r128** – 3D rendering (via CDN)

Enjoy exploring! 🌍
