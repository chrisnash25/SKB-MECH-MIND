"""Render the actual exported TripoSR model. This never synthesizes a replacement picture."""
import bpy,math,pathlib
from mathutils import Vector
p=pathlib.Path('emotional-support-brick-3d/staging/triposr')
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(p/'bricko.glb'))
mesh=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert mesh,'No real 3D geometry'
corners=[o.matrix_world@Vector(q) for o in mesh for q in o.bound_box]
lo=Vector([min(v[i] for v in corners) for i in range(3)])
hi=Vector([max(v[i] for v in corners) for i in range(3)])
mid=(lo+hi)*.5
extent=max(hi-lo)
if extent<=0:raise ValueError('3D model has invalid bounds')
def aim(obj,target):obj.rotation_euler=(target-obj.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=mid+Vector((extent*.20,extent*.08,extent*2.8)))
cam=bpy.context.object;aim(cam,mid);cam.data.type='ORTHO';cam.data.ortho_scale=extent*1.45
bpy.context.scene.camera=cam
for delta,power,span in [((-1.6,2.5,1.8),900,3.5),((2,2,-1.5),750,3.5)]:
 bpy.ops.object.light_add(type='AREA',location=mid+Vector(delta)*extent)
 o=bpy.context.object;o.data.energy=power;o.data.size=span*extent;aim(o,mid)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1080;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.render.filepath=str(p/'bricko-real-3d-render.png')
bpy.ops.render.render(write_still=True)
print('RENDERED_FROM_ACTUAL_GLB',scene.render.filepath)
