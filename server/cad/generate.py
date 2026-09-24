"""BRIGHTAL parametric manufacturing preparation, millimetres; never a mesh-to-STEP wrapper."""
import json, math, sys, pathlib, struct, zipfile, collections
import cadquery as cq
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BOPAlgo import BOPAlgo_ArgumentAnalyzer


def generate(p, out):
    out=pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    r=p['innerDiameter']/2; w=p['width']; t=p['thickness']; tolerance=p['tolerance']; allowance=p['allowance']
    minimum=p['minimumWall']; style=p['style']; stones=p['stones']; errors=[]
    if min(w,t,p['bezelWall'] if p['setting']=='bezel' else p['prongDiameter'])<minimum:
        raise ValueError('MINIMUM_MATERIAL_THICKNESS')
    if stones and p['settingHeight'] < max(s['depth'] for s in stones)*.7+t:
        raise ValueError('SETTING_TOO_LOW_FOR_STONE')
    # Smooth circular band with rounded or flat section, or a controlled spline sweep.
    center=r+t/2
    if style in ['contour','curvedoval','wavebezel']:
        # Open upper sweep joins a lower analytic annulus; avoids a coincident
        # periodic sweep seam when cutting multiple stone seats.
        points=[]
        for i in range(65):
            a=-math.pi/2-.06+(math.pi+.12)*i/64
            shift=p['sculpt']*max(0,math.cos(a))**4 if style=='contour' else p['sculpt']*.5*math.sin(2*a)*max(0,math.cos(a))
            points.append(cq.Vector(center*math.sin(a),shift,center*math.cos(a)))
        path=cq.Wire.assembleEdges([cq.Edge.makeSpline(points)])
        plane=cq.Plane(origin=points[0],xDir=(0,1,0),normal=(points[1]-points[0]).normalized())
        profile=cq.Workplane(plane).ellipse(w/2,t/2) if p['profile']=='round' else cq.Workplane(plane).rect(w,t)
        top=profile.sweep(path,isFrenet=False).val()
        bottom=cq.Workplane('XZ').circle(r+t).circle(r).extrude(w/2,both=True).val()
        # Leave a 0.2 mm overlap with the upper sweep. A merely coincident
        # join can remain as duplicate tessellation edges in otherwise valid
        # BREP output.
        cutter=cq.Workplane('XY').box(60,60,30).translate((0,0,14.8)).val()
        body=bottom.cut(cutter).fuse(top).clean()

    else:
        body=cq.Workplane('XZ').circle(r+t+allowance).circle(r).extrude(w/2,both=True).val()
        if p['profile']=='round':
            body=body.fillet(min(t,w)*.22,body.Edges())
        if p['profile']=='knife':
            body=body.chamfer(min(t,w)*.2,None,body.Edges())
    if style=='openpair':
        gap=p['gap']
        tool=cq.Workplane('XY').box(gap,60,30).translate((0,0,r+14)).val()
        body=body.cut(tool)
    if style=='split':
        # Two shoulders joined at the lower shank; slot remains below the head.
        slot=cq.Workplane('XZ').circle(r+t+2).circle(r-.1).extrude(w*.18,both=True).val()
        upper=cq.Workplane('XY').box(60,60,20).translate((0,0,r+4)).val()
        body=body.cut(slot.intersect(upper))
    gem_tools=[]; anchors=[]
    for s in stones:
        length=s['length']; width=s['width']; depth=s['depth']; x=s.get('x',0); y=s.get('y',0)
        z=r+p['settingHeight']; orientation=s.get('rotation',0)
        # Gem outline and pavilion are faceted by design; metal remains analytic CAD.
        outline=s['outline']
        def wire(scale,height,extra=0):
            if p['shape'] in ['round','oval']:
                return cq.Workplane('XY',origin=(0,0,height)).ellipse((width/2+extra)*scale,(length/2+extra)*scale).val()
            pts=[]
            for u,v in outline:
                px=u*(width/2+extra)*scale;py=v*(length/2+extra)*scale
                pts.append(cq.Vector(px,py,height))
            return cq.Wire.makePolygon(pts+[pts[0]])
        gem=cq.Solid.makeLoft([wire(.02,-depth*.68),wire(1,0),wire(.53,depth*.32)],ruled=True)
        # Seat clearance plus insertion opening, preserving a supported pavilion.
        seat=cq.Solid.makeLoft([wire(.02,-depth*.68-tolerance),wire(1,0,tolerance),wire(1,depth+1,tolerance)],ruled=True)
        transform=lambda obj:obj.rotate((0,0,0),(0,0,1),orientation).translate((x,y,z))
        gem=transform(gem);seat=transform(seat)
        base_z=math.sqrt(max(0,r*r-x*x))
        floor=z-depth*.68-minimum
        # Joined support from band to basket, with an axial access bore.
        support_bottom=min(base_z-.25,floor-.25)
        outer=cq.Solid.makeLoft([wire(1,support_bottom-z,p['bezelWall']+tolerance),wire(1,minimum*.3,p['bezelWall']+tolerance)],ruled=True)
        outer=transform(outer)
        if p['setting']=='claw':
            basket_top=z-depth*.3
            trim=cq.Workplane('XY').box(60,60,30).translate((x,y,basket_top+15)).val()
            outer=outer.cut(trim)
            for j in range(p['prongCount']):
                a=2*math.pi*j/p['prongCount']+math.radians(p['prongRotation'])
                px=(width/2+p['prongDiameter']*.25)*math.cos(a);py=(length/2+p['prongDiameter']*.25)*math.sin(a)
                prong=cq.Solid.makeCylinder(p['prongDiameter']/2,z+minimum*.25-support_bottom,cq.Vector(px,py,support_bottom-z))
                outer=outer.fuse(transform(prong))
        if body.intersect(outer).Volume()<.01:raise ValueError('FLOATING_SETTING')
        body=body.fuse(outer).cut(seat)
        bore=cq.Solid.makeCylinder(p['underOpening']/2,p['settingHeight']+t+10,cq.Vector(x,y,r-2))
        body=body.cut(bore)
        gem_tools.append(gem);anchors.append({'x':x,'y':y,'girdleZ':z,'length':length,'width':width,'depth':depth})
    body=body.clean()
    if not BRepCheck_Analyzer(body.wrapped).IsValid():errors.append('INVALID_BREP')
    if len(body.Solids())!=1:errors.append('DISCONNECTED_METAL')
    if any(not shell.Closed() for shell in body.Shells()):errors.append('OPEN_SHELL')
    analyzer=BOPAlgo_ArgumentAnalyzer();analyzer.SetShape1(body.wrapped);analyzer.Perform()
    if analyzer.HasFaulty():errors.append('SELF_INTERSECTION_OR_BOOLEAN_FAULT')
    collisions=[body.intersect(g).Volume() for g in gem_tools]
    if any(v>1e-5 for v in collisions):errors.append('STONE_METAL_COLLISION')
    for i,g in enumerate(gem_tools):
        if any(g.intersect(other).Volume()>1e-5 for other in gem_tools[i+1:]):errors.append('STONE_STONE_COLLISION')
    report={'status':'blocked' if errors else 'manufacturing-prepared','units':'mm','kernel':'OpenCascade / CadQuery 2.6.1','errors':errors,'solidCount':len(body.Solids()),'closedShells':all(s.Closed() for s in body.Shells()),'validBrep':body.isValid(),'selfIntersectionCheck':not analyzer.HasFaulty(),'stoneCollisionVolumesMm3':collisions,'volumeMm3':body.Volume(),'minimumConstructiveWallMm':minimum,'wallValidation':'Constructive band, bezel and prong bounds; no guarantee of global minimum after finishing.','stoneSchedule':anchors,'warning':'Gyártás-előkészített modell. Az ötvös végső műszaki jóváhagyása, foglalási és felületkezelési ellenőrzése szükséges.','parameters':p}
    (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    if errors:raise ValueError(','.join(errors))
    cq.exporters.export(body,str(out/'ring.step'))
    vertices,faces=body.tessellate(.015,.08)
    unique=[]; lookup={}; remap={}
    for i,v in enumerate(vertices):
        key=tuple(round(n,4) for n in v.toTuple())
        if key not in lookup: lookup[key]=len(unique);unique.append(key)
        remap[i]=lookup[key]
    triangles=[]; seen_faces=set()
    for f in faces:
        ids=tuple(remap[i] for i in f)
        if len(set(ids))<3:continue
        face_key=tuple(sorted(ids))
        if face_key in seen_faces:continue
        seen_faces.add(face_key)
        a,b,c=[cq.Vector(*unique[i]) for i in ids];normal=(b-a).cross(c-a)
        if normal.Length<1e-12:continue
        triangles.append((ids,normal.normalized().toTuple()))

    # OCCT may tessellate two adjacent analytic faces with a T-junction: one
    # face has a long edge while the neighbour has the same edge in two short
    # segments. Split the long boundary edge at existing collinear vertices so
    # the STL/3MF topology is a true two-manifold instead of a visual-only mesh.
    preliminary=collections.Counter()
    for ids,_ in triangles:
        for i in range(3):
            u,v=ids[i],ids[(i+1)%3];preliminary[tuple(sorted((u,v)))]+=1
    boundary_vertices={v for edge,count in preliminary.items() if count==1 for v in edge}
    split_edges={}
    for edge,count in preliminary.items():
        if count!=1:continue
        u,v=edge;a=cq.Vector(*unique[u]);b=cq.Vector(*unique[v]);ab=b-a;length2=ab.dot(ab)
        if length2<1e-12:continue
        points=[]
        for w in boundary_vertices-{u,v}:
            point_vec=cq.Vector(*unique[w]);t=(point_vec-a).dot(ab)/length2
            if 1e-6<t<1-1e-6 and (point_vec-(a+ab*t)).Length<2.5e-4:points.append((t,w))
        if points:split_edges[edge]=[w for _,w in sorted(points)]
    repaired=[]
    for ids,normal in triangles:
        split=False
        for i in range(3):
            u,v,k=ids[i],ids[(i+1)%3],ids[(i+2)%3];points=split_edges.get(tuple(sorted((u,v))))
            if not points:continue
            if u>v:points=list(reversed(points))
            chain=[u,*points,v]
            repaired.extend([((chain[j],chain[j+1],k),normal) for j in range(len(chain)-1)])
            split=True;break
        if not split:repaired.append((ids,normal))
    triangles=repaired
    edge_counts=collections.Counter();directions=collections.Counter();volume=0
    for ids,_ in triangles:
        a,b,c=[cq.Vector(*unique[i]) for i in ids];volume+=a.dot(b.cross(c))/6
        for i in range(3):
            u,v=ids[i],ids[(i+1)%3];key=tuple(sorted((u,v)));edge_counts[key]+=1;directions[key]+=1 if u<v else -1
    bad=sum(1 for e,n in edge_counts.items() if n!=2 or directions[e]!=0)
    if bad or volume<=0:raise ValueError('NON_MANIFOLD_TESSELLATION')
    with (out/'ring.stl').open('wb') as stream:
        stream.write(b'BRIGHTAL millimetres; goldsmith approval required'.ljust(80,b' '));stream.write(struct.pack('<I',len(triangles)))
        for ids,normal in triangles:stream.write(struct.pack('<12fH',*normal,*(x for i in ids for x in unique[i]),0))
    mesh='<vertices>'+''.join('<vertex x="%s" y="%s" z="%s"/>'%v for v in unique)+'</vertices><triangles>'+''.join('<triangle v1="%s" v2="%s" v3="%s"/>'%ids for ids,_ in triangles)+'</triangles>'
    with zipfile.ZipFile(out/'ring.3mf','w',zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
        archive.writestr('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
        archive.writestr('3D/3dmodel.model','<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><object id="1" type="model"><mesh>'+mesh+'</mesh></object></resources><build><item objectid="1"/></build></model>')
    report['meshValidation']={'closedManifold':True,'inconsistentEdges':bad,'positiveVolume':volume>0,'triangles':len(triangles)}
    # STEP roundtrip verifies a real CAD solid rather than a renamed mesh.
    restored=cq.importers.importStep(str(out/'ring.step')).val()
    volume_delta=abs(restored.Volume()-body.Volume())
    if not restored.isValid() or len(restored.Solids())!=1 or volume_delta>max(.1,body.Volume()*.0005):raise ValueError('STEP_ROUNDTRIP_FAILED')
    report['stepRoundtrip']=True
    report['stepRoundtripVolumeDeltaMm3']=volume_delta
    (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    (out/'parameters.json').write_text(json.dumps(p,ensure_ascii=False,indent=2))
    return report

if __name__=='__main__':
    try:generate(json.loads(pathlib.Path(sys.argv[1]).read_text()),sys.argv[2])
    except Exception as exc:print(str(exc),file=sys.stderr);sys.exit(1)
