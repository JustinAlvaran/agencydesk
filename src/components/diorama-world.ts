import {
  AmbientLight, BoxGeometry, CylinderGeometry, DirectionalLight, EdgesGeometry,
  FogExp2, Group, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial,
  PerspectiveCamera, PlaneGeometry, PointLight, RingGeometry, Scene, SRGBColorSpace,
  TorusGeometry, Vector3, WebGLRenderer, AgXToneMapping, PCFShadowMap,
  type BufferGeometry, type Material,
} from 'three';

export type WorldController={dispose:()=>void;setPaused:(paused:boolean)=>void;setExploded:(exploded:boolean)=>void};
const noWorld:WorldController={dispose(){},setPaused(){},setExploded(){}};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
/** Original procedural agency world; cinematic composition informed by Dioramas (MIT). */
export function createDioramaWorld(host:HTMLElement,initial:{paused:boolean;exploded:boolean},onUnavailable:()=>void):WorldController {
  let renderer:WebGLRenderer;
  try { renderer=new WebGLRenderer({alpha:true,antialias:host.clientWidth>700,powerPreference:'low-power'}); }
  catch { onUnavailable();return noWorld; }
  const geometry=new Set<BufferGeometry>(),materials=new Set<Material>();
  const releases:Array<()=>void>=[];
  let stopped=false,paused=initial.paused,frame=0,observer:ResizeObserver|undefined;
  const release=(operation:()=>void)=>{try{operation();}catch{/* Continue releasing other owned resources after a context failure. */}};
  const dispose=()=>{
    if(stopped)return;stopped=true;cancelAnimationFrame(frame);
    release(()=>observer?.disconnect());releases.forEach(release);
    geometry.forEach(value=>release(()=>value.dispose()));materials.forEach(value=>release(()=>value.dispose()));
    release(()=>renderer.dispose());release(()=>renderer.forceContextLoss());
    renderer.domElement.remove();delete host.dataset.rendered;
  };
  try {
  const mobile=host.clientWidth<700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1:1.5));
  renderer.outputColorSpace=SRGBColorSpace;renderer.toneMapping=AgXToneMapping;renderer.toneMappingExposure=1.35;
  renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=PCFShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.style.display='block';
  host.appendChild(renderer.domElement);
  const scene=new Scene();scene.fog=new FogExp2('#080f0b',.035);
  const camera=new PerspectiveCamera(mobile?47:38,1,.1,80);
  const geo=<T extends BufferGeometry>(value:T)=>{geometry.add(value);return value;};
  const mat=(color:string,metalness=.4,roughness=.38,emission?:string)=>{
    const value=new MeshStandardMaterial({color,metalness,roughness,...(emission?{emissive:emission,emissiveIntensity:1.5}:{})});materials.add(value);return value;
  };
  const graphite=mat('#14271f',.82,.28),edgeMetal=mat('#496b57',.85,.25),ceramic=mat('#a1c5b0',.5,.35);
  const green=mat('#79edb1',.2,.25,'#207448'),dark=mat('#07100c',.3,.7),glass=mat('#2c7356',.65,.2);
  const lineMaterial=new LineBasicMaterial({color:'#81d2a5',transparent:true,opacity:.22});materials.add(lineMaterial);
  scene.add(new AmbientLight('#b1d0b9',1.7));
  const key=new DirectionalLight('#f0ffe3',5);key.position.set(-3,9,6);key.castShadow=!mobile;
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;key.shadow.bias=-.001;
  scene.add(key);scene.add(key.target);releases.push(()=>key.shadow.map?.dispose());
  const rim=new DirectionalLight('#56ecab',5);rim.position.set(6,4,-6);scene.add(rim);
  const fill=new PointLight('#86ddff',22,14,2);fill.position.set(-4,3,-2);scene.add(fill);
  const world=new Group();scene.add(world);
  const box=geo(new BoxGeometry(1,1,1));
  function block(parent:Group,w:number,h:number,d:number,x:number,y:number,z:number,material:Material,outlined=false) {
    const mesh=new Mesh(box,material);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=!mobile;mesh.receiveShadow=true;parent.add(mesh);
    if(outlined){const edge=new LineSegments(geo(new EdgesGeometry(box)),lineMaterial);edge.scale.copy(mesh.scale);edge.position.copy(mesh.position);parent.add(edge);}
    return mesh;
  }
  const plinth=new Mesh(geo(new CylinderGeometry(3.5,3.65,.28,64)),graphite);plinth.position.y=-.3;plinth.receiveShadow=true;world.add(plinth);
  const rimRing=new Mesh(geo(new TorusGeometry(3.52,.025,6,100)),green);rimRing.rotation.x=Math.PI/2;rimRing.position.y=-.14;world.add(rimRing);
  const innerRing=new Mesh(geo(new RingGeometry(2.92,2.94,96)),edgeMetal);innerRing.rotation.x=-Math.PI/2;innerRing.position.y=-.14;world.add(innerRing);
  const floor=new Mesh(geo(new PlaneGeometry(100,100)),mat('#080f0b',.4,.8));floor.rotation.x=-Math.PI/2;floor.position.y=-.48;floor.receiveShadow=true;scene.add(floor);
  const layers:Group[]=[];
  for(let i=0;i<3;i++) {
    const layer=new Group();layers.push(layer);world.add(layer);
    block(layer,3.15,.14,2.4,0,0,0,graphite,true);
    block(layer,3.03,.025,2.28,0,.082,0,edgeMetal);
    block(layer,2.98,.022,.045,0,.1,1.1,green);
    // Structural interface rails illustrate a workflow, never customer records or figures.
    for(let k=0;k<3;k++)block(layer,.62,.045,.045,-.92+k*.88,.12,-.88,ceramic);
    for(let k=0;k<3;k++)block(layer,.03,.035,1.55,-1+k*1,.13,.03,graphite);
    if(i===0) {
      for(let k=0;k<3;k++){block(layer,.72,.05,.4,-.95+k*.95,.16,-.22,glass,true);block(layer,.48,.018,.035,-.95+k*.95,.2,-.27,ceramic);}
      block(layer,2.55,.05,.51,0,.16,.53,graphite,true);
    } else if(i===1) {
      block(layer,1.25,.055,1.25,-.68,.16,.07,dark,true);
      for(let k=0;k<4;k++)block(layer,.75-k*.1,.02,.035,-.68,.2,-.35+k*.23,ceramic);
      block(layer,.88,.09,.5,.82,.17,-.3,glass,true);block(layer,.88,.09,.5,.82,.17,.42,glass,true);
    } else {
      for(let k=0;k<3;k++){block(layer,.68,.07,1.18,-.92+k*.92,.17,0,glass,true);block(layer,.39,.02,.04,-.92+k*.92,.22,-.38,green);}
    }
  }
  const satellite=new Group();world.add(satellite);satellite.position.set(-2.45,.1,1.5);satellite.rotation.y=-.32;
  block(satellite,1.15,.13,.85,0,0,0,edgeMetal,true);block(satellite,.98,.035,.7,0,.09,0,graphite);
  const orb=new Mesh(geo(new TorusGeometry(.24,.065,10,32)),green);orb.position.set(0,.35,0);orb.rotation.x=-Math.PI/3;satellite.add(orb);
  const tower=new Group();world.add(tower);tower.position.set(2.35,.1,-1.5);tower.rotation.y=.24;
  block(tower,.8,.12,.8,0,0,0,edgeMetal,true);block(tower,.48,1.25,.48,0,.67,0,graphite,true);
  for(let k=0;k<4;k++)block(tower,.5,.035,.5,0,.22+k*.28,0,green);
  const orbit=new Mesh(geo(new TorusGeometry(4.2,.014,4,100)),edgeMetal);orbit.rotation.x=Math.PI/2;orbit.position.y=-.32;world.add(orbit);
  const poses=[
    {eye:[8,6,10],target:[-2.1,.6,0],turn:-.35,gap:.38},
    {eye:[-5,5,9],target:[-2,1.1,0],turn:.45,gap:.82},
    {eye:[7,6,8],target:[2.6,1,0],turn:-.6,gap:1.2},
    {eye:[3,8,12],target:[0,1.1,0],turn:.2,gap:1.1},
    {eye:[-5,4,9],target:[-1.7,1,0],turn:.45,gap:.7},
    {eye:[6,8,12],target:[0,1.5,0],turn:0,gap:.45},
  ];
  let exploded=initial.exploded,last=0,time=0,scrollDirty=true,scroll=0,gap=.38,turn=-.35;
  let sectionStarts:number[]=[];const pointer=new Vector3(),eye=new Vector3(...poses[0].eye as [number,number,number]),look=new Vector3(...poses[0].target as [number,number,number]);
  const targetEye=eye.clone(),targetLook=look.clone();
  const measure=()=>{const sections=[...document.querySelectorAll<HTMLElement>('[data-world-step]')];sectionStarts=sections.map(el=>el.getBoundingClientRect().top+window.scrollY-window.innerHeight*.22);scrollDirty=true;};
  const resize=()=>{if(stopped)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);measure();if(paused&&host.dataset.rendered==='true')renderStill();};
  observer=new ResizeObserver(resize);observer.observe(host);resize();
  const onScroll=()=>{scrollDirty=true;if(paused)renderStill();};
  const onPointer=(event:PointerEvent)=>{if(event.pointerType==='touch')return;pointer.set(event.clientX/Math.max(innerWidth,1)-.5,event.clientY/Math.max(innerHeight,1)-.5,0);};
  const onLost=()=>{if(!stopped)onUnavailable();};
  const onResize=()=>measure();
  releases.push(()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('pointermove',onPointer);window.removeEventListener('resize',onResize);renderer.domElement.removeEventListener('webglcontextlost',onLost);});
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('pointermove',onPointer,{passive:true});window.addEventListener('resize',onResize,{passive:true});
  renderer.domElement.addEventListener('webglcontextlost',onLost);
  function pose() {
    if(scrollDirty){let index=0;while(index<sectionStarts.length-1&&window.scrollY>=sectionStarts[index+1])index++;const start=sectionStarts[index]??0,end=sectionStarts[index+1]??start+innerHeight;scroll=Math.min(poses.length-1,index+clamp((window.scrollY-start)/Math.max(1,end-start)));scrollDirty=false;}
    const a=poses[Math.floor(scroll)],b=poses[Math.min(poses.length-1,Math.floor(scroll)+1)],t=scroll-Math.floor(scroll),eased=t*t*(3-2*t);
    targetEye.set(...a.eye as [number,number,number]).lerp(new Vector3(...b.eye as [number,number,number]),eased);
    targetLook.set(...a.target as [number,number,number]).lerp(new Vector3(...b.target as [number,number,number]),eased);
    if(mobile){targetEye.multiplyScalar(1.16);targetLook.x=0;targetLook.y+=1.2;}
    return {gap:a.gap+(b.gap-a.gap)*eased,turn:a.turn+(b.turn-a.turn)*eased};
  }
  function compose(dt:number,still=false) {
    const next=pose(),alpha=still?1:1-Math.exp(-dt*4);
    gap+=(next.gap+(exploded?1.05:0)-gap)*alpha;turn+=(next.turn-turn)*alpha;
    layers.forEach((layer,i)=>{layer.position.set((i-1)*(exploded?.19:0),.08+i*gap,0);layer.rotation.y=(i-1)*(exploded?.09:0);});
    world.rotation.y=turn+(paused?0:pointer.x*.12);world.position.y=paused?0:Math.sin(time*.35)*.04;
    eye.lerp(targetEye,alpha);look.lerp(targetLook,alpha);camera.position.copy(eye);camera.lookAt(look);
    renderer.render(scene,camera);
  }
  function renderStill(){if(!stopped)compose(0,true);}
  const draw=(stamp:number)=>{if(stopped||paused)return;frame=requestAnimationFrame(draw);const elapsed=stamp-last;if(elapsed<(mobile?42:33))return;const dt=Math.min(.08,elapsed/1000);last=stamp;time+=dt;compose(dt);};
  renderStill();host.dataset.rendered='true';if(!paused)frame=requestAnimationFrame(draw);
  return {
    setPaused(value){if(stopped)return;paused=value;cancelAnimationFrame(frame);if(paused)renderStill();else{last=performance.now();frame=requestAnimationFrame(draw);}},
    setExploded(value){if(stopped)return;exploded=value;if(paused)renderStill();},
    dispose,
  };
  } catch {
    dispose();onUnavailable();return noWorld;
  }
}
