"""Microsoft TRELLIS.2 ZeroGPU: real image-to-3D only. Never replace live game on failed run."""
import os,sys,json,struct,shutil,pathlib,requests
from PIL import Image
from gradio_client import Client,handle_file
names=('bricko','rusty','pulse','calm','spark','blocky','cozy','zapp','echo','gizmo')
boxes={
'bricko':(105,153,391,430),'rusty':(389,183,659,428),
'pulse':(657,187,908,430),'calm':(906,197,1162,430),
'spark':(1112,171,1414,431),'blocky':(106,499,387,756),
'cozy':(385,500,651,756),'zapp':(629,489,912,760),
'echo':(882,499,1162,751),'gizmo':(1144,490,1420,756)}
target=os.getenv('CHARACTER','bricko')
root=pathlib.Path('emotional-support-brick-3d/staging/trellis2')
root.mkdir(parents=True,exist_ok=True)
def validate(p):
 d=p.read_bytes()
 assert len(d)>20000 and d[:4]==b'glTF','Not a genuine GLB'
 assert struct.unpack_from('<I',d,8)[0]==len(d),'Broken GLB length'
 n=struct.unpack_from('<I',d,12)[0]
 assert d[16:20]==b'JSON','Missing glTF JSON'
 gltf=json.loads(d[20:20+n])
 assert gltf.get('meshes'),'GLB has no meshes'
 result={'bytes':len(d),'meshes':len(gltf['meshes']),'materials':len(gltf.get('materials',[])),'textures':len(gltf.get('textures',[]))}
 print('REAL 3D GLB validated:',result,flush=True)
 return result
try:
 assert target in names
 r=requests.get(os.environ['SOURCE_URL'],timeout=60);r.raise_for_status()
 photo=Image.open(__import__('io').BytesIO(r.content)).convert('RGB')
 assert photo.size==(1536,864),f'Unexpected reference resolution {photo.size}'
 for name in names:
  im=photo.crop(boxes[name])
  im.save(root/(name+'-reference.png'))
 print('Prepared ten character reference image crops',flush=True)
 c=Client('microsoft/TRELLIS.2',verbose=False)
 endpoints=[dep.get('api_name') for dep in c.config.get('dependencies',[]) if dep.get('api_name')]
 print('Public Gradio endpoints:',endpoints,flush=True)
 if 'image_to_3d' not in endpoints or 'extract_glb' not in endpoints:
  raise RuntimeError('Official space API does not expose image_to_3d/extract_glb')
 inp=handle_file(str(root/(target+'-reference.png')))
 if 'preprocess_image' in endpoints: inp=c.predict(inp,api_name='/preprocess_image')
 print('Requesting free TRELLIS.2 GPU model for',target,flush=True)
 c.predict(inp,0,'512',7.5,0.7,12,5.0,7.5,0.5,12,3.0,1.0,0.0,12,3.0,api_name='/image_to_3d')
 print('GPU stage done, exporting geometry and PBR textures',flush=True)
 out=c.predict(None,150000,2048,api_name='/extract_glb')
 paths=[p for p in (out if isinstance(out,(tuple,list)) else [out]) if isinstance(p,str) and p.endswith('.glb')]
 if not paths: raise RuntimeError('GLB export returned no model path: '+repr(out)[:500])
 path=root/(target+'.glb');shutil.copyfile(paths[0],path)
 info=validate(path)
 (root/(target+'-verified.json')).write_text(json.dumps(info,indent=2))
except Exception as e:
 print('TRELLIS2 GENERATION BLOCKED: '+repr(e),file=sys.stderr,flush=True)
 sys.exit(1)
