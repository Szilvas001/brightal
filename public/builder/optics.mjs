import * as T from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

export const GEM_TONES = {
  ice: { color: '#ffffff', ior: 2.417, dispersion: .044, absorption: [0.008, .006, .003] },
  champagne: { color: '#e9bb78', ior: 2.417, dispersion: .044, absorption: [.02, .17, .48] },
  blush: { color: '#f8a9c5', ior: 2.417, dispersion: .044, absorption: [.015, .34, .14] },
  canary: { color: '#f8df73', ior: 2.417, dispersion: .044, absorption: [.01, .04, .8] },
  sapphire: { color: '#396ebf', ior: 1.77, dispersion: .018, absorption: [1.2, .55, .035] },
  emeraldGreen: { color: '#299872', ior: 1.58, dispersion: .014, absorption: [.95, .025, .5] },
  ruby: { color: '#b52a55', ior: 1.77, dispersion: .018, absorption: [.02, 1.35, .8] },
};

// Outline is also used to place prongs and metal seats around the actual cut.
export function outline(shape, a) {
  let x=Math.cos(a), z=Math.sin(a);
  if(shape==='oval')z*=1.35;
  if(shape==='marquise'){x*=.78*(.68+.32*Math.abs(x));z*=1.65;}
  if(shape==='pear'){x*=.82*(1-.3*z);z*=1.42;}
  if(['princess','cushion','radiant'].includes(shape)){
    const power=shape==='cushion'?.5:.24;
    x=Math.sign(x)*Math.pow(Math.abs(x),power)*.9;
    z=Math.sign(z)*Math.pow(Math.abs(z),power)*(shape==='radiant'?1.25:.9);
  }
  if(shape==='emerald'||shape==='asscher'){
    // Intersect the radial ray with a clipped rectangle (a true octagon).
    const height=shape==='emerald'?1.32:1;
    const t=Math.min(1/Math.max(Math.abs(x),.0001),height/Math.max(Math.abs(z),.0001),(1+height-.28)/Math.max(Math.abs(x)+Math.abs(z),.0001));
    x*=t;z*=t;
  }
  return [x,z];
}

export function gemGeometry(shape) {
  const points=[];
  const ring=(count,r,y,offset=0)=>{for(let i=0;i<count;i++){const [x,z]=outline(shape,2*Math.PI*(i+offset)/count);points.push(new T.Vector3(x*r,y,z*r));}};
  if(shape==='emerald'||shape==='asscher'){
    const h=shape==='emerald'?1.32:1;
    const oct=[[-.72,-h],[.72,-h],[1,-h+.28],[1,h-.28],[.72,h],[-.72,h],[-1,h-.28],[-1,-h+.28]];
    // Separate step-crown and pavilion planes, rather than a brilliant cut stretched into a rectangle.
    for(const [r,y] of [[.52,.35],[.8,.21],[1,.025],[1,-.025],[.72,-.31],[.35,-.56],[.03,-.7]])
      for(const [x,z] of oct)points.push(new T.Vector3(x*r,y,z*r));
  }else{
    ring(8,.53,.35);ring(8,.77,.235,.5);
    ring(16,1,.018);ring(16,1,-.018);
    ring(8,.53,-.4,.5);ring(8,.015,-.7);
  }
  const geometry=new ConvexGeometry(points);
  const pos=geometry.attributes.position,normal=geometry.attributes.normal,planes=[];
  for(let i=0;i<pos.count;i+=3){
    const n=new T.Vector3().fromBufferAttribute(normal,i),p=new T.Vector3().fromBufferAttribute(pos,i);
    const plane=new T.Vector4(n.x,n.y,n.z,n.dot(p));
    if(!planes.some(q=>Math.abs(q.x-plane.x)+Math.abs(q.y-plane.y)+Math.abs(q.z-plane.z)+Math.abs(q.w-plane.w)<.0001))planes.push(plane);
  }
  if(planes.length>128)throw new Error('Cut exceeds the optical shader plane budget');
  return {geometry,planes};
}

// Original HDR light rig: photographic softboxes plus small high-intensity sources.
// The same linear HDR texture illuminates metals and is traced inside gemstones.
export function createStudioEnvironment() {
  const width=1024,height=512,pixels=new Float32Array(width*height*4);
  const boxes=[[-2.2,.78,.30,.30,12],[-.4,.42,.065,.38,18],[1.45,.62,.24,.2,9],[2.5,-.2,.025,.38,6],[-1.1,-.45,.18,.1,4]];
  const stars=[[-2.65,.28],[-1.75,1.1],[-.8,.9],[.4,.3],[1.95,.15],[2.75,.82]];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const az=x/width*Math.PI*2-Math.PI,el=y/height*Math.PI-Math.PI/2;
    const base=.065+Math.max(0,Math.sin(el))*.25;
    let r=base,g=base*1.025,b=base*1.06;
    for(const [a,e,w,h,power] of boxes){const dx=Math.min(Math.abs(az-a),2*Math.PI-Math.abs(az-a));const fall=Math.exp(-Math.pow(dx/w,8)-Math.pow((el-e)/h,8));r+=fall*power;g+=fall*power*.985;b+=fall*power*.96;}
    for(const [a,e] of stars){const dx=Math.min(Math.abs(az-a),2*Math.PI-Math.abs(az-a));const fall=Math.exp(-(dx*dx+(el-e)*(el-e))/.00055)*38;r+=fall;g+=fall;b+=fall;}
    const i=(y*width+x)*4;pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b;pixels[i+3]=1;
  }
  const texture=new T.DataTexture(pixels,width,height,T.RGBAFormat,T.FloatType);
  texture.mapping=T.EquirectangularReflectionMapping;texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;texture.wrapS=T.RepeatWrapping;texture.needsUpdate=true;
  return texture;
}

const vertex=`varying vec3 localPosition; varying vec3 localNormal; uniform vec3 localEye;
void main(){localPosition=position;localNormal=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment=`precision highp float;
varying vec3 localPosition; varying vec3 localNormal;
uniform vec4 planes[128];uniform int count;uniform vec3 localEye;uniform mat3 worldRotation;
uniform sampler2D environment;uniform vec3 absorption;uniform float ior;uniform float dispersion;uniform float lightAngle;uniform float lightPower;
vec3 radiance(vec3 d){
 d=normalize(worldRotation*d);float a=atan(d.z,d.x)+lightAngle;
 vec2 uv=vec2(a/6.2831853+.5,asin(clamp(d.y,-1.,1.))/3.14159265+.5);
 return texture2D(environment,uv).rgb*lightPower;
}
float fresnel(float c,float eta){float r=(eta-1.)/(eta+1.);r*=r;return r+(1.-r)*pow(1.-clamp(c,0.,1.),5.);}
void main(){
 vec3 n=normalize(localNormal),incident=normalize(localPosition-localEye);
 float f=fresnel(dot(-incident,n),ior);
 vec3 total=radiance(reflect(incident,n))*f;
 vec3 ray=refract(incident,n,1./ior),pos=localPosition+ray*.0004;
 vec3 throughput=vec3(1.-f);
 for(int bounce=0;bounce<7;bounce++){
  float nearest=10000.;vec3 normal=n;
  for(int i=0;i<128;i++){if(i>=count)break;float denom=dot(planes[i].xyz,ray);
   if(denom>.00001){float t=(planes[i].w-dot(planes[i].xyz,pos))/denom;if(t>.0001&&t<nearest){nearest=t;normal=planes[i].xyz;}}}
  if(nearest>9000.)break;
  pos+=ray*nearest;throughput*=exp(-absorption*nearest);
  vec3 outGreen=refract(ray,-normal,ior);
  if(dot(outGreen,outGreen)>.001){
   vec3 outRed=refract(ray,-normal,ior-dispersion*.45),outBlue=refract(ray,-normal,ior+dispersion*.55);
   float fr=fresnel(abs(dot(ray,normal)),ior);
   vec3 spectrum=vec3(radiance(length(outRed)>.01?outRed:outGreen).r,radiance(outGreen).g,radiance(length(outBlue)>.01?outBlue:outGreen).b);
   total+=throughput*spectrum*(1.-fr);throughput*=fr;
  }
  ray=reflect(ray,normal);pos+=ray*.0004;
 }
 total+=throughput*radiance(ray)*.12;
 gl_FragColor=vec4(total,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export function gemstoneMaterial(planes,environment,tone='ice',color='F',light='studio',fire=1) {
  const data=GEM_TONES[tone]||GEM_TONES.ice,list=planes.slice();while(list.length<128)list.push(new T.Vector4());
  const absorption=new T.Vector3(...data.absorption);
  if(tone==='ice')absorption.add(new T.Vector3(0,(color.charCodeAt(0)-68)*.003,(color.charCodeAt(0)-68)*.012));
  return new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{planes:{value:list},count:{value:planes.length},localEye:{value:new T.Vector3()},worldRotation:{value:new T.Matrix3()},environment:{value:environment},absorption:{value:absorption},ior:{value:data.ior},dispersion:{value:data.dispersion*fire},lightAngle:{value:light==='evening'?.7:light==='daylight'?-.5:0},lightPower:{value:light==='evening'?1.2:1}}});
}
