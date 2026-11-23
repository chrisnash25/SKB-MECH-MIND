"""Public no-login TripoSR model test; preserve real geometry, no synthetic preview."""
import json,os,pathlib,requests,sys,zipfile,shutil
from PIL import Image
from io import BytesIO
import cv2,numpy as np
from gradio_client import Client,handle_file
root=pathlib.Path("emotional-support-brick-3d/staging/triposr")
root.mkdir(parents=True,exist_ok=True)
p=Image.open(BytesIO(requests.get(os.environ["SOURCE_URL"],timeout=40).content)).convert('RGB')
assert p.size==(1536,864),p.size
# Full-figure isolation: preserve raised hand, red cap, headphones and red shoes.
# Previous 286px rectangular image included background and caused model-face fusion.
raw=np.array(p)
x0,y0,x1,y1=(42,74,352,405)
crop=raw[y0:y1,x0:x1].copy();h,w=crop.shape[:2]
poly=[(.19,.02),(.77,.01),(.89,.19),(.93,.48),(1,.60),(.94,.79),(.79,.81),(.91,.95),(.76,.99),(.18,.99),(.05,.95),(.15,.81),(0,.70),(.08,.52),(.19,.42)]
coords=np.array([[int(x*(w-1)),int(y*(h-1))] for x,y in poly],np.int32)
sil=np.zeros((h,w),np.uint8);cv2.fillPoly(sil,[coords],255)
mask=np.full((h,w),cv2.GC_BGD,np.uint8);mask[sil>0]=cv2.GC_PR_FGD
core=np.zeros((h,w),np.uint8)
cv2.ellipse(core,(w//2,int(h*.48)),(int(w*.15),int(h*.24)),0,0,360,255,-1)
mask[core>0]=cv2.GC_FGD
bg=np.zeros((1,65),np.float64);fg=np.zeros((1,65),np.float64)
cv2.grabCut(crop,mask,None,bg,fg,6,cv2.GC_INIT_WITH_MASK)
alpha=np.where((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD),255,0).astype(np.uint8)
n,labels,stats,_=cv2.connectedComponentsWithStats(alpha,8)
keep=np.zeros_like(alpha)
for idx in range(1,n):
 if stats[idx,cv2.CC_STAT_AREA]>=40: keep[labels==idx]=255
alpha=cv2.GaussianBlur(cv2.morphologyEx(keep,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8)),(3,3),.65)
rgba=Image.fromarray(np.dstack((crop,alpha)),'RGBA')
canvas=Image.new('RGBA',(768,768),(0,0,0,0))
scale=min(690/w,690/h)
cut=rgba.resize((round(w*scale),round(h*scale)),Image.Resampling.LANCZOS)
canvas.alpha_composite(cut,((768-cut.width)//2,(768-cut.height)//2))
# TripoSR may interpret transparent-black areas as dark background geometry.
# Composite against neutral white to avoid modelling the alpha canvas as a solid slab.
white=Image.new('RGBA',canvas.size,(255,255,255,255))
white.alpha_composite(canvas)
white.convert('RGB').save(root/"bricko-reference.png")
print("ISOLATED_REFERENCE",canvas.size, "foreground_pixels",int((alpha>128).sum()),flush=True)
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
