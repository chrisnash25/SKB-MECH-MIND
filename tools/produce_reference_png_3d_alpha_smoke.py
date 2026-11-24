"""One-character TripoSR preprocessing diagnostic using the Space's alpha-to-gray path.
This is a staging experiment only; it never deploys or approves a character.
"""
from pathlib import Path
from io import BytesIO
from PIL import Image
from gradio_client import Client, handle_file
import os, requests, json, struct, shutil, time
import numpy as np

URL = "https://d2ol7oe51mr4n9.cloudfront.net/user_3JtDd6TkegxRQaZ9ylE6tZv9gPq/07c25c9e-bf7d-4d2b-b9b4-6c13ca3591d4.png"
name = "gizmo"
out = Path("emotional-support-brick-3d/staging/reference-png-cast") / name
out.mkdir(parents=True, exist_ok=True)

response = requests.get(URL, timeout=65)
response.raise_for_status()
original = Image.open(BytesIO(response.content)).convert("RGBA")
assert original.width >= 600 and original.height >= 600, original.size
original.save(out / f"{name}-source.png")

bbox = original.getchannel("A").getbbox()
assert bbox, "Reference PNG has no visible alpha foreground"
foreground = original.crop(bbox)
foreground.thumbnail((680, 680), Image.Resampling.LANCZOS)

# Preserve transparency until the final composite. The TripoSR Space's own
# fill_background() composites RGBA over 50% neutral gray, not white.
rgba_canvas = Image.new("RGBA", (800, 800), (0, 0, 0, 0))
rgba_canvas.alpha_composite(
    foreground,
    ((800 - foreground.width) // 2, (800 - foreground.height) // 2),
)
rgba = np.asarray(rgba_canvas, dtype=np.float32) / 255.0
rgb = rgba[:, :, :3] * rgba[:, :, 3:4] + (1.0 - rgba[:, :, 3:4]) * 0.5
input_path = out / f"{name}-model-input.png"
Image.fromarray(np.clip(rgb * 255.0, 0, 255).astype(np.uint8), "RGB").save(input_path)
print("MODEL_INPUT_ALPHA_TO_NEUTRAL_GRAY", name, original.size, bbox, flush=True)

client = Client("AleenDG/3DGenTripoSR", verbose=False)
result = None
for attempt in range(1, 5):
    try:
        print("REQUESTING_REAL_MESH_ALPHA_TEST", name, "attempt", attempt, flush=True)
        result = client.predict(handle_file(str(input_path)), api_name="/generate")
        break
    except Exception as exc:
        text = (type(exc).__name__ + " " + str(exc)).lower()
        transient = any(token in text for token in (
            "timeout", "temporar", "incompletechunkedread", "peerclosedconnection",
            "remoteprotocolerror", "connectionreset", "connecterror", "networkerror",
            "readerror", "writeerror", "serverdisconnected", "protocolerror"
        ))
        if not transient or attempt == 4:
            raise
        print("TRANSIENT_REMOTE_ERROR", type(exc).__name__, str(exc)[:250], "retry", attempt, flush=True)
        time.sleep(10 * (2 ** (attempt - 1)))

if result is None:
    raise RuntimeError("3D generator returned no result after retries")
paths = [value for value in result if isinstance(value, str) and value.lower().endswith((".glb", ".obj"))]
glbs = [value for value in paths if value.lower().endswith(".glb")]
if not glbs:
    raise RuntimeError("3D generator did not return GLB " + repr(result)[:500])

source_glb = Path(glbs[0])
assert source_glb.is_file(), str(source_glb)
destination = out / f"{name}-raw.glb"
shutil.copyfile(source_glb, destination)
data = destination.read_bytes()
assert data[:4] == b"glTF" and len(data) > 100000
assert struct.unpack_from("<I", data, 8)[0] == len(data)
json_length = struct.unpack_from("<I", data, 12)[0]
document = json.loads(data[20:20 + json_length])
assert document.get("meshes"), "No 3D mesh data"
print(
    "ALPHA_TEST_3D_MODEL_GENERATED", name,
    "bytes", len(data),
    "meshes", len(document["meshes"]),
    "materials", len(document.get("materials", [])),
    "textures", len(document.get("textures", [])),
    "images", len(document.get("images", [])),
    flush=True,
)
