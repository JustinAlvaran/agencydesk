import {AdditiveBlending,BufferAttribute,BufferGeometry,PerspectiveCamera,Points,Scene,ShaderMaterial,Vector2,WebGLRenderer} from 'three';
/** Decorative fixed-seed geometry; no CRM records, remote assets or requests. */
export function createEmeraldField(host:HTMLElement,onUnavailable:()=>void):()=>void {
  let renderer:WebGLRenderer;
  try {renderer=new WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});} catch {onUnavailable();return()=>{};}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  const scene=new Scene(),camera=new PerspectiveCamera(50,1,.1,30);camera.position.z=8;
  const count=window.matchMedia('(max-width:650px)').matches?100:320;
  const positions=new Float32Array(count*3),scales=new Float32Array(count);
  let seed=73;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<count;i++){positions[i*3]=(random()-.5)*18;positions[i*3+1]=(random()-.5)*7;positions[i*3+2]=(random()-.5)*4;scales[i]=8+random()*15;}
  const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(positions,3));geometry.setAttribute('scale',new BufferAttribute(scales,1));
  const uniforms={uTime:{value:0},uPointer:{value:new Vector2()}};
  const material=new ShaderMaterial({transparent:true,depthWrite:false,blending:AdditiveBlending,uniforms,
    vertexShader:`attribute float scale;uniform float uTime;uniform vec2 uPointer;varying float vAlpha;void main(){vec3 p=position;p.y+=sin(p.x*.7+uTime*.12+p.z)*.15;p.x+=uPointer.x*.14;p.y+=uPointer.y*.09;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=scale*(4./-mv.z);vAlpha=.18+.22*sin(p.x+uTime*.25);}`,
    fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);float glow=pow(max(0.,1.-d*2.),2.);gl_FragColor=vec4(.22,.87,.61,glow*vAlpha);}`,
  });
  scene.add(new Points(geometry,material));host.appendChild(renderer.domElement);
  const resize=()=>{const width=host.clientWidth,height=host.clientHeight;if(width<1||height<1)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const pointer=(event:PointerEvent)=>{const rect=host.getBoundingClientRect();if(event.clientY<rect.top||event.clientY>rect.bottom)return;uniforms.uPointer.value.set((event.clientX-rect.left)/Math.max(rect.width,1)-.5,-((event.clientY-rect.top)/Math.max(rect.height,1)-.5));};
  window.addEventListener('pointermove',pointer,{passive:true});
  const lost=()=>onUnavailable();renderer.domElement.addEventListener('webglcontextlost',lost);
  let frame=0,last=0,disposed=false;
  const draw=(time:number)=>{if(disposed)return;frame=requestAnimationFrame(draw);if(time-last<33)return;last=time;uniforms.uTime.value=time/1000;renderer.render(scene,camera);};frame=requestAnimationFrame(draw);
  return()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('pointermove',pointer);renderer.domElement.removeEventListener('webglcontextlost',lost);geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
}
