import bpy, math, pathlib
from mathutils import Vector
root=pathlib.Path("emotional-support-brick-3d/staging/real-3d")
bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/"bricko-sf3d.glb"))
meshes=[x for x in bpy.context.scene.objects if x.type=="MESH"]
assert meshes,"No rendered meshes"
for ob in meshes:ob.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
from mathutils import Vector
bounds=[ob.matrix_world@Vector(corner) for ob in meshes for corner in ob.bound_box]
mi=Vector([min(p[i] for p in bounds) for i in range(3)])
ma=Vector([max(p[i] for p in bounds) for i in range(3)])
center=(mi+ma)*.5;extent=max((ma-mi))
def aim(ob,target):ob.rotation_euler=(Vector(target)-ob.location).to_track_quat("-Z","Y").to_euler()
bpy.ops.object.camera_add(location=(center.x+extent*.35,center.y-extent*2.25,center.z+extent*.15))
cam=bpy.context.object;aim(cam,center);cam.data.type="ORTHO";cam.data.ortho_scale=extent*1.55;bpy.context.scene.camera=cam
for pos,power,size in [((-.9,-2.1,2.5),900,3),((2,1.3,2.0),600,4)]:
 bpy.ops.object.light_add(type="AREA",location=Vector(pos)*extent+center)
 ob=bpy.context.object;ob.data.energy=power;ob.data.shape="DISK";ob.data.size=size*extent;aim(ob,center)
scene=bpy.context.scene;scene.render.engine="CYCLES";scene.cycles.samples=28
scene.render.resolution_x=1200;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.world.color=(.07,.07,.08);scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(root/"bricko-sf3d-actual-render.png")
bpy.ops.render.render(write_still=True)
print("REAL_RENDER",scene.render.filepath)
