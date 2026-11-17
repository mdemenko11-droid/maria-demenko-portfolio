/* Signal background: quiet, still light under the whole page (no animation). No lines, dots or texture the eye can hold on to,
   so nothing competes with the type: three soft pools of warm pearl and dusky mauve light drift slowly along the screen's
   edges, the pointer warms the dark a little, and a fine grain keeps the black from looking flat.
   Earlier versions (silk, dots, contours) are kept in the scratchpad.
   Cheap on purpose: drawn at half resolution, capped near 30 fps, paused when the tab is hidden,
   one still frame under prefers-reduced-motion. */
(() => {
  if (window !== window.top) return;   // no background inside a frame (the variants board)
  const canvas = document.createElement('canvas');
  canvas.className = 'bg-fx';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const gl = canvas.getContext('webgl', {antialias:false, alpha:false, premultipliedAlpha:false, powerPreference:'low-power'});
  if (!gl){ canvas.remove(); return; }

  const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
  const fs = `
precision mediump float;
uniform vec2 r; uniform float t; uniform vec2 m; uniform float sy;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// a soft pool of light: gaussian falloff, no edge the eye can hold on to
float pool(vec2 p, vec2 c, float s){ vec2 d = p - c; return exp(-dot(d, d) / (s * s)); }
void main(){
  float a = r.x / r.y;
  vec2 p = gl_FragCoord.xy / r.y;
  float T = t * .035;
  float drift = sy * .12;                              // the light slides a touch with the scroll
  // three pools that wander slowly along the edges of the screen
  vec2 c1 = vec2(a * (.12 + .10 * sin(T * 1.3)),        .78 + .12 * cos(T)       - drift);
  vec2 c2 = vec2(a * (.88 + .08 * cos(T * 1.1)),        .22 + .14 * sin(T * .9)  + drift);
  vec2 c3 = vec2(a * (.55 + .30 * sin(T * .7 + 2.)),   -.05 + .08 * sin(T * 1.5));
  vec3 silver = vec3(.7, .66, .95), ice = vec3(.9, .5, .78);   // soft violet and rose pools of light
  vec3 col = vec3(.02, .02, .024);
  col += silver * pool(p, c1, .55) * .06;
  col += ice    * pool(p, c2, .60) * .06;
  col += mix(silver, ice, .5 + .5 * sin(T * 2.)) * pool(p, c3, .45) * .04;
  // the pointer only warms the dark a little around it
  col += silver * pool(p, m * vec2(a, 1.), .35) * .03;
  col += (h(gl_FragCoord.xy + fract(t) * 91.7) - .5) * .018;   // grain, so the black is not flat
  gl_FragColor = vec4(col, 1.);
}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = name => gl.getUniformLocation(pr, name);
  const uR = U('r'), uT = U('t'), uM = U('m'), uS = U('sy');

  const scale = .5;
  function size(){
    canvas.width = Math.max(1, Math.round(innerWidth * scale));
    canvas.height = Math.max(1, Math.round(innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uR, canvas.width, canvas.height);
  }
  size(); addEventListener('resize', size);

  // a still picture: the pools of light drawn once, no drift, no pointer, no scroll; redrawn only when the window resizes
  function draw(){
    gl.uniform1f(uT, 12);
    gl.uniform2f(uM, -10, -10);   // the pointer pool parked off screen
    gl.uniform1f(uS, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  draw(); addEventListener('resize', draw);
})();
