import { RingRenderer } from './renderer.js';
import { GeometryClient } from './geometry-client.mjs';
import { unpackModel } from './progressive.mjs';
const {useRef,useState,useEffect}=React;
// Read-only view: render the immutable submitted configuration, never localStorage.
export function OrderViewer({design,onReady,lang="hu"}){
 const L=(hu,en,de)=>lang==="de"?de:lang==="en"?en:hu;
 const host=useRef(null),[error,setError]=useState(false);
 useEffect(()=>{
  let engine,worker;setError(false);onReady?.(false);
  try{
   engine=new RingRenderer(host.current,()=>{setError(true);onReady?.(false);});
   worker=new GeometryClient(packed=>{
    const valid=packed.engineering?.assemblyValidation?.valid===true;
    if(valid)engine.update(design.config,unpackModel(packed,engine.studioTexture));else engine.disposeModel();
    host.current.dataset.designHash=design.sha256;host.current.dataset.quality=valid?'detailed':'invalid';setError(!valid);onReady?.(valid);
   },()=>{setError(true);onReady?.(false);});
   worker.request(design.config);
  }catch{setError(true);onReady?.(false);}
  return()=>{worker?.dispose();engine?.dispose();};
 },[design.sha256]);
 return <section><div ref={host} className="order-3d" aria-label={L("A beküldött gyűrű 3D látványterve","3D view of your submitted ring","3D-Ansicht deines eingereichten Rings")}/>{error?<p role="alert">{L("A terv nem tölthető be vagy geometriai javítást igényel. Ne hagyd jóvá; kérj módosítást a műhelytől.","The design cannot load or needs geometry corrections. Do not approve it; request a revision from the workshop.","Der Entwurf kann nicht geladen werden oder benötigt geometrische Korrekturen. Gib ihn nicht frei; bitte die Werkstatt um eine Überarbeitung.")}</p>:<p className="hint">{L("A saját beküldött gyűrűd. Forgasd el és nagyítsd ki a részleteket.","Your submitted ring. Rotate and zoom to inspect the details.","Dein eingereichter Ring. Drehe und vergrößere ihn, um die Details zu prüfen.")}</p>}</section>;
}
