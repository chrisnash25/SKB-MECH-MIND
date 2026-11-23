"""Try the public Stability AI Stable Fast 3D Space without account login.
Only publish a genuine returned GLB; zeroGPU quota denial is a hard stop.
"""
import json,os,pathlib,requests,struct,shutil,sys,traceback
from PIL import Image
from gradio_client import Client,handle_file
from io import BytesIO
root=pathlib.Path("emotional-support-brick-3d/staging/real-3d")
root.mkdir(parents=True,exist_ok=True)
url=os.environ["SOURCE_URL"]
image=Image.open(BytesIO(requests.get(url,timeout=50).content)).convert("RGB")
assert image.size==(1536,864),image.size
# Bricko - retain full silhouette, cap, headphones and shoes
image.crop((105,153,391,430)).save(root/"bricko-reference.png")
c=Client("stabilityai/stable-fast-3d",verbose=False)
v=c.view_api(return_format="dict")
print("AVAILABLE_API",repr(v)[:5000],flush=True)
inp=handle_file(str(root/"bricko-reference.png"))
# Official SF3D public Gradio API has varied input layouts between versions.
endpoints=v.get('named_endpoints',{})
print("NAMED",list(endpoints),flush=True)
if not endpoints:raise RuntimeError("Space has no public named API")
preferred=('/run_button','/run','/generate','/image_to_3d','/predict')
chosen=next((p for p in preferred if p in endpoints),None)
if not chosen:raise RuntimeError("No supported generation endpoint - inspect AVAILABLE_API log")
spec=endpoints[chosen]
print('GENERATION_API',repr(spec)[:9000],flush=True)
params=spec.get("parameters",[])
args=[]
for i,p in enumerate(params):
 n=(p.get("parameter_name") or p.get("label") or "").lower()
 print("PARAM",i,n,p.get('parameter_default'),flush=True)
 if "image" in n:args.append(inp)
 elif "foreground_ratio" in n or n=="fr":args.append(.85)
 elif "remesh" in n:args.append('None')
 elif "vertex_count" in n:args.append(-1)
 elif "texture_resolution" in n:args.append(1024)
 elif "seed" in n:args.append(0)
 elif p.get("parameter_has_default"):args.append(p.get('parameter_default'))
 else:raise RuntimeError("Unknown required API parameter "+repr(p))
print("STARTING_REAL_3D",chosen,flush=True)
out=c.predict(*args,api_name=chosen)
print("MODEL_RESULT",repr(out)[:1500],flush=True)
def collect(item):
 if isinstance(item,dict):
  for k,v in item.items():yield from collect(v)
 elif isinstance(item,(list,tuple)):
  for v in item:yield from collect(v)
 elif isinstance(item,str) and item.lower().split("?")[0].endswith((".glb",".gltf",".obj")):
  yield item
paths=list(collect(out))
if not paths:raise RuntimeError("No actual geometry returned: "+repr(out)[:1000])
src=paths[0]
if src.startswith("http"): data=requests.get(src,timeout=100).content
else: data=pathlib.Path(src).read_bytes()
assert data[:4]==b"glTF" and len(data)>20000,"Not a textured GLB"
assert struct.unpack_from('<I',data,8)[0]==len(data),"GLB truncated"
jslen=struct.unpack_from('<I',data,12)[0]
doc=json.loads(data[20:20+jslen])
assert doc.get('meshes'),"Missing mesh"
target=root/"bricko-sf3d.glb";target.write_bytes(data)
print("SUCCESS",target,"size",len(data),"meshes",len(doc["meshes"]),"textures",len(doc.get("textures",[])),flush=True)
