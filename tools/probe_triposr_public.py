"""Public no-login TripoSR model test; preserve real geometry, no synthetic preview."""
import json,os,pathlib,requests,sys,zipfile,shutil
from PIL import Image
from io import BytesIO
from gradio_client import Client,handle_file
root=pathlib.Path("emotional-support-brick-3d/staging/triposr")
root.mkdir(parents=True,exist_ok=True)
p=Image.open(BytesIO(requests.get(os.environ["SOURCE_URL"],timeout=40).content)).convert('RGB')
assert p.size==(1536,864),p.size
p.crop((105,153,391,430)).save(root/"bricko-reference.png")
client=Client('AleenDG/3DGenTripoSR',verbose=False)
api=client.view_api(return_format='dict')
endpoints=api.get('named_endpoints',{})
print("TRIPOSR_APIS",list(endpoints),flush=True)
for name,ep in endpoints.items():
 print("API",name,"INPUT",[(p.get('parameter_name'),p.get('parameter_default'),p.get('component')) for p in ep.get('parameters',[])],"OUTPUT",[(p.get('label'),p.get('component')) for p in ep.get('returns',[])],flush=True)
possible=['/generate','/run_button','/run','/process','/predict','/process_image','/generate_3d']
chosen=next((n for n in possible if n in endpoints),None)
if not chosen:
 chosen=next((n for n in endpoints if any(t in n.lower() for t in ('generate','run','process','predict'))),None)
if not chosen:raise RuntimeError("No supported model generation endpoint. This is a public API inspection only.")
args=[]
for i,a in enumerate(endpoints[chosen].get('parameters',[])):
 key=(a.get('parameter_name') or a.get('label') or '').lower()
 if 'image' in key or a.get('component') in ('Image','ImageEditor'):args.append(handle_file(str(root/"bricko-reference.png")))
 elif 'foreground' in key or 'ratio' in key:args.append(.85)
 elif 'resolution' in key:args.append(256)
 elif 'seed' in key:args.append(42)
 elif 'background' in key or 'remove_bg' in key:args.append(True)
 elif a.get('parameter_has_default'):args.append(a.get('parameter_default'))
 else:raise RuntimeError('Unknown required argument '+repr(a))
print("TRYING_PUBLIC_GENERATION",chosen,repr(args)[:350],flush=True)
out=client.predict(*args,api_name=chosen)
print("TRIPOSR_RESULT",repr(out)[:2500],flush=True)
def walk(o):
 if isinstance(o,(list,tuple)):
  for v in o:yield from walk(v)
 elif isinstance(o,dict):
  for v in o.values():yield from walk(v)
 elif isinstance(o,str) and o.split('?')[0].lower().endswith(('.glb','.obj','.ply','.zip','.gltf')):
  yield o
candidates=list(walk(out));assert candidates,"No 3D asset returned"
for src in candidates:
 if src.startswith('http'):data=requests.get(src,timeout=100).content;ext=src.split('?')[0].rsplit('.',1)[-1]
 else:data=pathlib.Path(src).read_bytes();ext=src.rsplit('.',1)[-1]
 dest=root/('bricko.'+ext);dest.write_bytes(data)
 print("SAVED_MODEL",dest,len(data),flush=True)
 if ext=='zip':
  with zipfile.ZipFile(dest) as z:z.extractall(root/"extracted")
assert any(root.rglob('*.obj')) or any(root.rglob('*.glb')),"Did not receive real mesh"
