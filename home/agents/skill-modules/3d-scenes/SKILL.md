---
name: 3d-scenes
description: Build and visually verify real-time 3D on the web with three.js or React Three Fiber, including hero scenes, product visuals, data or concept visualizations, and 3D films. Use when WebGL or WebGPU rendering is part of the deliverable.
---

# 3D scenes

A good scene is a composed photograph that moves. Most weak WebGL work fails for the same reasons: one default light, gray materials, a centered object, a static camera, and motion too small to see. Decide the look first, then build it, then look at it.

## Decide the shot

- **Subject and idea:** what the scene shows and the one thing it should make the viewer understand or feel.
- **Camera:** lens (a field of view of 25–45° reads as cinematic; 60–75° reads as a game), framing, and path. Place the subject off-center with foreground, midground, and background layers.
- **Light and mood:** time of day or studio setup, key-to-fill contrast, and one accent color.
- **Loop:** what moves continuously so the scene is alive without input, and how the loop closes seamlessly.

## Build

- Use the project's existing stack. For a new plain page, use three.js with Vite or an import map. In React, use `@react-three/fiber` with `@react-three/drei`. Read the installed version's docs, because three.js renames and removes APIs across releases.
- **Color pipeline:** sRGB output color space, ACES Filmic or AgX tone mapping with a tuned exposure, and color textures tagged as sRGB.
- **Lighting:** start from an environment map (`RoomEnvironment` through `PMREMGenerator`, or drei `<Environment>`) for believable reflections. Add a key light and a rim light that separates the silhouette from the background. Cast shadows from one light at most; use soft or contact shadows under objects.
- **Materials:** `MeshStandardMaterial` or `MeshPhysicalMaterial` with deliberate roughness and metalness, plus clearcoat, transmission, or sheen when the subject calls for it. Vary the surfaces; one uniform material across everything reads as a placeholder.
- **Depth:** fog or a gradient background, depth of field when the shot calls for it, and scale contrast between near and far elements.
- **Post-processing, used sparingly:** subtle bloom on genuine emitters, a vignette, and antialiasing (SMAA, or MSAA through the renderer). Each pass must earn its cost.
- **Procedural detail:** noise-driven displacement, instanced particles, and shader gradients add richness without asset files. Seed the randomness so the result is repeatable.

## Motion

- Drive animation from elapsed time (`clock.getElapsedTime()` or the R3F `state.clock`), not per-frame increments, so speed is identical at 30 and 120 fps.
- An idle loop runs by default: camera drift, a slow orbit, a breathing scale, flowing particles, or light that sweeps. Size it so the change is obvious in a thumbnail over two seconds. Pointer and scroll input add to the loop; they do not start it.
- Ease every move (damp toward targets with `THREE.MathUtils.damp` or `maath/easing`). Linear camera motion reads as mechanical.
- With `prefers-reduced-motion`, keep the composition and slow or stop the loop.

## Performance and robustness

- Clamp the device pixel ratio to at most 2, and to 1.5 on large canvases. Use instancing for repeated meshes and merge static geometry. Keep draw calls in the low hundreds.
- Pause rendering when the canvas is offscreen or the tab is hidden (an `IntersectionObserver`, or R3F `frameloop="demand"` for static scenes). Dispose of geometries, materials, and textures on unmount.
- Handle resize without distortion, show a designed loading state rather than a blank box, and fall back to a poster image when WebGL is unavailable. Page text stays real HTML over or beside the canvas.
- Target a steady 60 fps on a recent laptop. Check `renderer.info` and a frame-time readout when a scene grows.

## Look at it

Headless Chrome needs a software GL flag to render WebGL: launch it with `--use-angle=swiftshader --enable-unsafe-swiftshader`, or run it headed.

1. Capture the canvas at three or more moments (for example 0 s, 2 s, and 5 s) at desktop and mobile viewports, then view the images.
2. Confirm no frame is black or empty, the frames differ visibly (the loop is running), and the console has no WebGL errors or warnings.
3. Judge the thumbnail for idea, silhouette, and contrast. Then judge full size for aliasing, blown highlights, muddy shadows, and clipping through the camera's near plane.
4. Fix, re-render the affected moments, and look again until a fresh look finds nothing to change.

## 3D films

For a rendered film, make every frame a pure function of its frame number, with no accumulated state. Seek frames deterministically and encode them with ffmpeg. The drawing-canvas-films module (`~/.agents/skill-modules/drawing-canvas-films/SKILL.md`) has a renderer, a treatment format, and a look loop that also fit a WebGL canvas.
