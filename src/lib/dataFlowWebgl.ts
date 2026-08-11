export interface DataFlowController {
  setActive: (active: boolean) => void;
  destroy: () => void;
}

const vertexSource = `
  attribute vec4 a_particle;
  uniform float u_time;
  uniform float u_point_size;
  uniform bool u_points;
  varying float v_alpha;
  varying float v_progress;

  void main() {
    float progress = fract(a_particle.x + u_time * a_particle.z - a_particle.w * 0.024);
    float spread = mix(0.72, 0.11, smoothstep(0.08, 0.72, progress));
    float wave = sin(progress * 18.0 + a_particle.y * 7.0) * 0.026;
    float x = mix(-1.18, 1.18, progress);
    float y = a_particle.y * spread + wave;

    gl_Position = vec4(x, y, 0.0, 1.0);
    gl_PointSize = u_points ? u_point_size * mix(0.65, 1.35, progress) : 1.0;
    v_progress = progress;
    v_alpha = mix(0.08, 0.8, 1.0 - a_particle.w);
  }
`;

const fragmentSource = `
  precision mediump float;
  uniform bool u_points;
  varying float v_alpha;
  varying float v_progress;

  void main() {
    float edge = smoothstep(0.0, 0.08, v_progress) * (1.0 - smoothstep(0.9, 1.0, v_progress));
    float alpha = v_alpha * edge;
    if (u_points) {
      float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
      if (distanceToCenter > 0.5) discard;
      alpha *= smoothstep(0.5, 0.08, distanceToCenter);
    }
    vec3 cyan = mix(vec3(0.08, 0.43, 0.92), vec3(0.25, 0.95, 1.0), v_progress);
    gl_FragColor = vec4(cyan, alpha);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader error";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create WebGL program");
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link WebGL program");
  }
  return program;
}

function createParticleData(count: number, includeTrails: boolean): Float32Array {
  const verticesPerParticle = includeTrails ? 2 : 1;
  const data = new Float32Array(count * verticesPerParticle * 4);
  for (let index = 0; index < count; index += 1) {
    const seed = Math.random();
    const vertical = Math.random() * 2 - 1;
    const speed = 0.035 + Math.random() * 0.045;
    const base = index * verticesPerParticle * 4;
    data.set([seed, vertical, speed, 0], base);
    if (includeTrails) data.set([seed, vertical, speed, 1], base + 4);
  }
  return data;
}

function createBuffer(gl: WebGLRenderingContext, data: Float32Array): WebGLBuffer {
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("Unable to create WebGL buffer");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

export function createDataFlow(canvas: HTMLCanvasElement, compact: boolean): DataFlowController {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
    premultipliedAlpha: true,
  });
  if (!gl) throw new Error("WebGL is unavailable");

  const particleCount = compact ? 180 : 480;
  const trailData = createParticleData(particleCount, true);
  const pointData = createParticleData(Math.round(particleCount * 0.55), false);
  const trailBuffer = createBuffer(gl, trailData);
  const pointBuffer = createBuffer(gl, pointData);
  const program = createProgram(gl);
  const particleAttribute = gl.getAttribLocation(program, "a_particle");
  const timeUniform = gl.getUniformLocation(program, "u_time");
  const pointSizeUniform = gl.getUniformLocation(program, "u_point_size");
  const pointsUniform = gl.getUniformLocation(program, "u_points");
  let active = true;
  let frame = 0;
  let destroyed = false;

  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.enableVertexAttribArray(particleAttribute);

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const bind = (buffer: WebGLBuffer) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(particleAttribute, 4, gl.FLOAT, false, 0, 0);
  };

  const render = (timestamp: number) => {
    if (destroyed) return;
    if (active && document.visibilityState === "visible") {
      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(timeUniform, timestamp * 0.001);
      gl.uniform1f(pointSizeUniform, compact ? 2.2 : 3.2);

      bind(trailBuffer);
      gl.uniform1i(pointsUniform, 0);
      gl.drawArrays(gl.LINES, 0, trailData.length / 4);

      bind(pointBuffer);
      gl.uniform1i(pointsUniform, 1);
      gl.drawArrays(gl.POINTS, 0, pointData.length / 4);
    }
    frame = requestAnimationFrame(render);
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    active = false;
    document.documentElement.classList.add("webgl-fallback");
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  frame = requestAnimationFrame(render);

  return {
    setActive(nextActive) {
      active = nextActive;
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteBuffer(trailBuffer);
      gl.deleteBuffer(pointBuffer);
      gl.deleteProgram(program);
    },
  };
}
