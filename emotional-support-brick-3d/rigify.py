"""Separate the textured GLB into articulated body/limb nodes.
Build-time tool; no runtime Python needed.
"""
import sys
from collections import defaultdict
from pathlib import Path
import numpy as np
import trimesh

src, dst = sys.argv[1:3]
real = "rusty" in Path(src).stem.lower()
mesh = next(iter(trimesh.load(src, force="scene").geometry.values()))
parts = defaultdict(list)
for component in mesh.split(only_watertight=False):
    lo, hi = component.bounds
    x, y, z = (lo + hi) * .5
    if (x < -.29 and (lo[0] < -.35 or z > -.07)) or (x < -.25 and lo[0] < -.42):
        group = "leftArm"
    elif (x > .29 and (hi[0] > .35 or z > -.07)) or (x > .25 and hi[0] > .42):
        group = "rightArm"
    elif y < -.135 and z > .04:
        group = "leftLeg" if x < 0 else "rightLeg"
    else:
        group = "body"
    parts[group].append(component)

if real:
    pivots = {
        "body": [0, 0, 0], "leftArm": [-.34, -.1, -.03],
        "rightArm": [.34, -.1, -.03], "leftLeg": [-.15, -.21, .1],
        "rightLeg": [.15, -.21, .1]
    }
else:
    pivots = {
        "body": [0, 0, 0], "leftArm": [-.285, -.04, -.12],
        "rightArm": [.285, -.04, -.12], "leftLeg": [-.13, -.14, .07],
        "rightLeg": [.13, -.14, .07]
    }

out = trimesh.Scene()
for group in ("body", "leftArm", "rightArm", "leftLeg", "rightLeg"):
    if not parts[group]:
        raise ValueError("Missing articulated segment: " + group)
    item = trimesh.util.concatenate(parts[group])
    pivot = np.asarray(pivots[group])
    item.vertices -= pivot
    out.add_geometry(item, geom_name=group, node_name=group,
                     transform=trimesh.transformations.translation_matrix(pivot))
out.export(dst)
assert len(out.geometry) == 5
print("Created textured articulated GLB", dst)
