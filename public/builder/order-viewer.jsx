import { RingRenderer } from './renderer.js';
import { GeometryClient } from './geometry-client.mjs';
import { previewModel, unpackModel } from './progressive.mjs';
const {useRef,useState,useEffect}=React;
// Read-only view: render the immutable submitted configuration, never localStorage.
export function OrderViewer({design,onReady}){
 const host=useRef(null),[error,setError]=useState(false);
 useEffect(()=>{
  let engine,worker;setError(false);onReady?.(false);
  try{
   engine=new RingRenderer(host.current,()=>{setError(true);onReady?.(false);});
   engine.update(design.config,previewModel(design.config,engine.studioTexture));
   worker=new GeometryClient(packed=>{
    engine.update(design.config,unpackModel(packed,engine.studioTexture));
    host.current.dataset.designHash=design.sha256;host.current.dataset.quality='detailed';onReady?.(true);
   },()=>{setError(true);onReady?.(false);});
   worker.request(design.config);
  }catch{setError(true);onReady?.(false);}
  return()=>{worker?.dispose();engine?.dispose();};
 },[design.sha256]);
 return <section><div ref={host} className="order-3d" aria-label="A beküldött gyűrű 3D látványterve"/>{error?<p role="alert">A 3D nézet nem tölthető be. Kapcsold be a böngésző grafikus gyorsítását, és töltsd újra az oldalt.</p>:<p className="hint">A saját beküldött gyűrűd. Forgasd el és nagyítsd ki a részleteket.</p>}</section>;
}
