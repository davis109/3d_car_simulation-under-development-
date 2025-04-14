# Car Drive Simulator

A relaxing driving simulator created with Three.js and TypeScript.

## Getting Started

1. Install dependencies: `npm install`
2. Copy your car model to the public folder (see below)
3. Run the development server: `npx webpack serve --port 8081`
4. Open your browser to http://localhost:8081

## Vehicle Model Setup

**Important: Web browsers cannot directly access files from your local file system (like C:/Users/...) for security reasons**


## Troubleshooting

If the car model doesn't appear:
1. Check the browser console (F12) for errors
2. Verify the model file exists in the public/assets/models folder
3. Make sure the file is named exactly "porsche.glb"
4. Try another browser if CORS issues persist

## Environment Assets

### Vehicle Model
The game now uses a Porsche 718 Cayman GT4 model from the local path:
```
C:/Users/sebas/Downloads/2020-porsche-718-cayman-gt4/source/2020_porsche_718_cayman_gt4.glb
```

### Textures to Download

Download these textures and place them in the `public/assets/textures` directory:

#### Skybox Textures
- Skybox cube textures: https://github.com/mrdoob/three.js/tree/dev/examples/textures/cube/skybox
- Alternative park skybox: https://github.com/mrdoob/three.js/tree/dev/examples/textures/cube/Park3Med
- Cloud texture: https://github.com/mrdoob/three.js/blob/dev/examples/textures/clouds.jpg
- Alternative cloud: https://github.com/baronwatts/models/blob/master/cloud.png

#### Terrain Textures
- Grass texture: https://github.com/mrdoob/three.js/blob/dev/examples/textures/terrain/grasslight-big.jpg
- Alternative grass: https://github.com/baronwatts/models/blob/master/grass-texture.jpg
- Asphalt texture: https://github.com/baronwatts/models/blob/master/asphalt.jpg
- Road normal map: https://github.com/mrdoob/three.js/blob/dev/examples/textures/terrain/grasslight-big-nm.jpg

#### Tree Textures
- Tree bark: https://github.com/mrdoob/three.js/blob/dev/examples/textures/crate.gif
- Leaves: https://github.com/baronwatts/models/blob/master/leaf-texture.jpg

## Controls
- W/Up Arrow: Accelerate
- S/Down Arrow: Brake/Reverse
- A/Left Arrow: Steer Left
- D/Right Arrow: Steer Right
- R: Reset vehicle position
- ESC: Open menu

## Quality Settings
The game supports three quality levels that affect rendering:
- Low: Reduced shadows, textures, and terrain detail
- Medium: Balanced performance and visuals
- High: Enhanced shadows, full detail, and maximum draw distance

## Features

- Relaxing driving experience through procedurally generated landscapes
- Day/night cycle with realistic lighting
- Dynamic terrain generation
- Basic vehicle physics
- Customizable graphics settings
- Ambient soundscape

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Open http://localhost:8080 in your browser

## Build for Production

```
npm run build
```

This will create a `dist` folder with compiled files ready for deployment.

## Technologies Used

- Three.js - 3D graphics library
- TypeScript - Type-safe JavaScript
- Webpack - Module bundler
- WebGL - For hardware-accelerated rendering
