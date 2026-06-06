export const baseVert = /* glsl */ `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const fieldFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDensity;
  uniform vec2  uMouse;
  uniform float uScroll;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;
  uniform vec2  uRes;

  vec2 hash(vec2 p){ p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(dot(hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),
                   dot(hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),
               mix(dot(hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),
                   dot(hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);
  }

  void main(){
    vec2 uv = vUv;
    vec2 aspect = vec2(uRes.x/uRes.y, 1.0);
    vec2 p = (uv - 0.5) * aspect;
    float t = uTime * uSpeed;

    float md = distance(uv, uMouse);
    float ripple = 0.15 / (md + 0.25);

    float n = 0.0;
    n += noise(p * (2.0 + uDensity*2.0) + vec2(t, t*0.6));
    n += 0.5 * noise(p * (4.0) - vec2(t*0.8, t));
    n += ripple * 0.4;
    n = n * 0.5 + 0.5;

    vec3 col = uColorC;
    col = mix(col, uColorA, smoothstep(0.35, 0.75, n) * 0.5);
    col = mix(col, uColorB, smoothstep(0.7, 0.95, n) * 0.28);

    col += (uScroll - 0.5) * 0.02;

    gl_FragColor = vec4(col, 1.0);
  }
`;
