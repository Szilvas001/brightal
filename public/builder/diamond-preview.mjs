import {DiamondViewer} from './diamond-viewer.js';
window.renderDiamond=async stone=>{
 window.__diamondRenderer?.dispose();
 const host=document.getElementById('preview');
 const viewer=new DiamondViewer(host,stone,()=>{window.renderError=true;});
 window.__diamondRenderer=viewer;viewer.controls.autoRotate=false;viewer.controls.enableDamping=false;
 viewer.camera.position.set(1.2,19,-9);viewer.controls.target.set(0,0,0);viewer.controls.update();
 viewer.renderer.setPixelRatio(1.5);viewer.renderer.setSize(640,520);viewer.camera.aspect=640/520;viewer.camera.updateProjectionMatrix();
 viewer.shadow.visible=true;viewer.shadow.position.y=-stone.height/2-.25;viewer.shadow.scale.setScalar(.52);
 viewer.renderer.render(viewer.scene,viewer.camera);
 await new Promise(requestAnimationFrame);viewer.renderer.render(viewer.scene,viewer.camera);
 return viewer.renderer.domElement.toDataURL('image/png');
};
