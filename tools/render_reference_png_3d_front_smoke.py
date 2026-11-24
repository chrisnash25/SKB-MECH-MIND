"""Render the baked diagnostic GLB from the character's face side."""
import bpy, os
from mathutils import Vector

name = "gizmo"
base = "emotional-support-brick-3d/staging/reference-png-cast/gizmo/"
source = os.path.abspath(base + "gizmo-pbr.glb")
assert os.path.isfile(source), source

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=source)
meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
assert meshes, "No mesh imported"

world_points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
low = Vector([min(point[i] for point in world_points) for i in range(3)])
high = Vector([max(point[i] for point in world_points) for i in range(3)])
mid = (low + high) / 2
extent = max(high - low)
assert extent > 0

def point_camera(camera, target):
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()

# The previous diagnostic camera looked at the rear; +Y is the face side
# after Blender's glTF import orientation conversion.
bpy.ops.object.camera_add(location=mid + Vector((0.2, 2.8, 0.12)) * extent)
camera = bpy.context.object
point_camera(camera, mid)
camera.data.type = "ORTHO"
camera.data.ortho_scale = extent * 1.45
bpy.context.scene.camera = camera

for offset, power, size in [((-2, 3, 4), 900, 3), ((2, 1, 3), 600, 3)]:
    bpy.ops.object.light_add(type="AREA", location=mid + Vector(offset) * extent)
    light = bpy.context.object
    light.data.energy = power
    light.data.size = size * extent
    point_camera(light, mid)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.use_denoising = False
for layer in scene.view_layers:
    layer.cycles.use_denoising = False
scene.render.resolution_x = 1080
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = os.path.abspath(base + "gizmo-pbr-front-render.png")
bpy.ops.render.render(write_still=True)
print("FRONT_PBR_RENDER", scene.render.filepath, flush=True)
