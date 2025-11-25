"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function WebGLShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const refs = useRef<{
    scene: THREE.Scene | null
    camera: THREE.OrthographicCamera | null
    renderer: THREE.WebGLRenderer | null
    mesh: THREE.Mesh | null
    uniforms: any
    animationId: number | null
  }>({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;
      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        float d = length(p) * distortion;
        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);
        float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `

    const setup = () => {
      const renderer = new THREE.WebGLRenderer({ canvas })
      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setClearColor(new THREE.Color(0x000000))

      const uniforms = {
        resolution: { value: [window.innerWidth, window.innerHeight] },
        time: { value: 0.0 },
        xScale: { value: 1.0 },
        yScale: { value: 0.5 },
        distortion: { value: 0.05 },
      }

      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array([
        -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0,
      ])
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        side: THREE.DoubleSide,
      })

      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      refs.current = {
        scene,
        camera,
        renderer,
        mesh,
        uniforms,
        animationId: null,
      }

      handleResize()
      animate()
    }

    const animate = () => {
      const { renderer, scene, camera, uniforms } = refs.current
      if (uniforms) uniforms.time.value += 0.01
      if (renderer && scene && camera) {
        renderer.render(scene, camera)
      }
      refs.current.animationId = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      const { renderer, uniforms } = refs.current
      if (!renderer || !uniforms) return
      const width = window.innerWidth
      const height = window.innerHeight
      renderer.setSize(width, height, false)
      uniforms.resolution.value = [width, height]
    }

    setup()
    window.addEventListener("resize", handleResize)

    return () => {
      const { renderer, scene, mesh, animationId } = refs.current
      if (animationId) cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
      if (mesh) {
        scene?.remove(mesh)
        mesh.geometry.dispose()
        if (mesh.material instanceof THREE.Material) mesh.material.dispose()
      }
      renderer?.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 h-full w-full" />
}

