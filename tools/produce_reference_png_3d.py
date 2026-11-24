"""Reconstruct one actual 3D GLB from the approved individual character PNG.
Free public TripoSR model; no token, no billed provider; stages instead of deploying.
"""
from pathlib import Path
from io import BytesIO
from PIL import Image
from gradio_client import Client,handle_file
import os,requests,json,struct,shutil,time
import numpy as np

URLS={
  'bricko': "https://d2ol7oe51mr4n9.cloudfront.net/user_3JtDd6TkegxRQaZ9ylE6tZv9gPq/2bb45103-402a-4239-bd11-c57267b6137a.png",
  'rusty': "https://d2ol7oe51mr4n9.cloudfront.net/user_3JtDd6TkegxRQaZ9ylE6tZv9gPq/9d44fafa-d5eb-44f9-8a4d-3f92d3af16f3.png",
  'pulse': "https://d2ol7oe51mr4n9.cloudfront.net/user_3JtDd6TkegxRQaZ9ylE6tZv9gPq/8cb78149-2eaf-45ac-a382-d521f4327095.png",
  'calm': "https://d2ol7oe51mr4n9.cloudfront.net/user_3JtDd6TkegxRQaZ9ylE6tZv9gPq/9e8cd3a2-7017-482e-a49f-467a26e907b2.png",
  'spark': "https://d2ol7oe51mr4n9.cloudfront.net/user_3JtDd6TkegxRQaZ9ylE6tZv9gPq/54a2d39c-4d92-45bc-b4bd-3024135c6dbd.png",
  'blocky': "https://d2ol7oe51mr4n9.cloudfront.net/user_3JtDd6TkegxRQaZ9ylE6tZv9gPq/fe301605-eb64-4a69-99cd-f429e632eec2.png",
  'cozy': "https://d2ol7oe51mr4n9.cloudfront.net/user_3JtDd6TkegxRQaZ9ylE6tZv9gPq/113224cc-aebf-4f1d-987d-82b4b0f87007.png",
  'zapp': "https://d2ol7oe51mr4n9.cloudfront.net/user_3JtDd6TkegxRQaZ9ylE6tZv9gPq/4164c385-6813-434b-9971-9b428f94a765.png",
  'echo': "https://d2ol7oe51mr4n9.cloudfront.net/user_3JtDd6TkegxRQaZ9ylE6tZv9gPq/142ca4b1-da6a-4239-ba91-2c31b69cbb6d.png",
  'gizmo': "https://d2ol7oe51mr4n9.cloudfront.net/user_3JtDd6TkegxRQaZ9ylE6tZv9gPq/07c25c9e-bf7d-4d2b-b9b4-6c13ca3591d4.png"
}

def is_transient_remote_error(exc):
    """Inspect exception type names and chained causes; httpx.ReadTimeout has an empty message."""
    pending=[exc]
    seen=set()
    tokens=(
        "timeout","temporar","incompletechunkedread","peerclosedconnection",
        "remoteprotocolerror","connectionreset","connecterror","networkerror",
        "readerror","writeerror","serverdisconnected","protocolerror"
    )
    while pending:
        current=pending.pop()
        if current is None or id(current) in seen:
            continue
        seen.add(id(current))
        typename=type(current).__name__.lower()
        message=str(current).lower()
        if any(token in typename or token in message for token in tokens):
            return True
        pending.extend([
            getattr(current,"__cause__",None),
            getattr(current,"__context__",None)
        ])
        pending.extend(getattr(current,"exceptions",[]) or [])
    return False

name=os.environ.get("CHARACTER","bricko").lower()
if name not in URLS:
    raise SystemExit("Unknown character: "+name)
out=Path("emotional-support-brick-3d/staging/reference-png-cast")/name
out.mkdir(parents=True,exist_ok=True)
r=requests.get(URLS[name],timeout=65)
r.raise_for_status()
original=Image.open(BytesIO(r.content)).convert('RGBA')
assert original.width>=600 and original.height>=600, original.size
original.save(out/(name+"-source.png"))
bbox=original.getchannel('A').getbbox()
assert bbox
im=original.crop(bbox)
im.thumbnail((680,680),Image.Resampling.LANCZOS)
# Keep the transparent foreground intact until the final composite.
# AleenDG/3DGenTripoSR's own RGBA preprocessing fills transparent pixels
# with 50% neutral gray; the old white canvas was reconstructed as large
# background sheets around the character.
canvas=Image.new('RGBA',(800,800),(0,0,0,0))
canvas.alpha_composite(im,((800-im.width)//2,(800-im.height)//2))
rgba=np.asarray(canvas,dtype=np.float32)/255.0
rgb=rgba[:,:,:3]*rgba[:,:,3:4]+(1.0-rgba[:,:,3:4])*0.5
input_path=out/(name+"-model-input.png")
Image.fromarray(np.clip(rgb*255.0,0,255).astype(np.uint8),'RGB').save(input_path)
print("MODEL_INPUT",name,original.size,bbox,flush=True)

result=None
for attempt in range(1,5):
    try:
        client=Client("AleenDG/3DGenTripoSR",verbose=False)
        print("REQUESTING_REAL_MESH",name,"attempt",attempt,flush=True)
        result=client.predict(handle_file(str(input_path)),api_name="/generate")
        break
    except Exception as exc:
        if not is_transient_remote_error(exc) or attempt==4:
            raise
        print(
            "TRANSIENT_REMOTE_ERROR",name,
            "type",type(exc).__name__,
            "message",str(exc)[:250],
            "retry",attempt,
            flush=True
        )
        time.sleep(10*(2**(attempt-1)))

if result is None:
    raise RuntimeError("3D generator returned no result after retries")
paths=[v for v in result if isinstance(v,str) and v.lower().endswith(('.glb','.obj'))]
glbs=[p for p in paths if p.lower().endswith('.glb')]
if not glbs:
    raise RuntimeError("3D generator did not return GLB "+repr(result)[:500])
p=Path(glbs[0])
assert p.is_file(),str(p)
dst=out/(name+"-raw.glb")
shutil.copyfile(p,dst)
b=dst.read_bytes()
assert b[:4]==b'glTF' and len(b)>100000
assert struct.unpack_from('<I',b,8)[0]==len(b)
j=struct.unpack_from('<I',b,12)[0]
doc=json.loads(b[20:20+j])
assert doc.get("meshes"), "No 3D mesh data"
print(
    "3D_MODEL_GENERATED",name,
    "bytes",len(b),
    "meshes",len(doc["meshes"]),
    "materials",len(doc.get("materials",[])),
    "textures",len(doc.get("textures",[])),
    "images",len(doc.get("images",[])),
    flush=True
)
