import * as T from 'three';
import { RingRenderer } from './renderer.js';
import { gemGeometry,gemstoneMaterial } from './optics.mjs';
export class DiamondViewer extends RingRenderer {
 view(){this.camera.position.set(14,12,20);this.controls.target.set(0,0,0);this.controls.update();this.dirty=true;}
 constructor(host,stone,onError){
  super(host,onError);
  const {geometry,planes}=gemGeometry(stone.shape);
  const gem=new T.Mesh(geometry,gemstoneMaterial(planes,this.studioTexture,'ice',stone.color));
  gem.scale.setScalar(4);gem.userData.gem=true;this.group.add(gem);this.gems=[gem];
  this.shadow.visible=false;this.camera.position.set(14,12,20);this.controls.target.set(0,0,0);this.controls.minDistance=3;this.controls.maxDistance=35;
  this.controls.autoRotate=!matchMedia('(prefers-reduced-motion: reduce)').matches;this.controls.update();
 }
}
