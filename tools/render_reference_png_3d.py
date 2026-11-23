"""Render genuine Blender screenshot of staged GLB. No synthetic poster."""
import bpy,os,sys
from mathutils import Vector
name=os.environ.get('CHARACTER','bricko')
base='emotional-support-brick-3d/staging/reference-png-cast/'+name+'/'
source=os.path.abspath(base+name+'-animated.glb')
assert os.path.isfile(source)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=source)
m=[ob for ob in bpy.context.scene.objects if ob.type=='MESH']
assert m
v=[o.matrix_world@Vector(c) for o in m for c in o.bound_box]
lo=Vector([min(q[i] for q in v) for i in range(3)])
hi=Vector([max(q[i] for q in v) for i in range(3)])
mid=(lo+hi)/2;extent=max(hi-lo)
assert extent>0
def point(o,t):o.rotation_euler=(t-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=mid+Vector((.2,-2.8,.12))*extent)
cam=bpy.context.object;point(cam,mid);cam.data.type='ORTHO';cam.data.ortho_scale=extent*1.45;bpy.context.scene.camera=cam
for offset,power,size in [((-2,-3,4),900,3),((2,1,3),600,3)]:
 bpy.ops.object.light_add(type='AREA',location=mid+Vector(offset)*extent)
 o=bpy.context.object;o.data.energy=power;o.data.size=size*extent;point(o,mid)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=False
scene.render.resolution_x=1080;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=os.path.abspath(base+name+'-actual-3d-render.png')
bpy.ops.render.render(write_still=True)
print('REAL_BLENDER_RENDER',scene.render.filepath,flush=True)
