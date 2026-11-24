"""Free Blender rig for genuine TRELLIS.2 output. Staging only.
Run: blender -b -noaudio --python tools/rig_trellis_cast.py -- input.glb output.glb
Approximate automatic weighting; visual QA is mandatory before game integration.
"""
import bpy,math,os,sys
if '--' not in sys.argv:raise SystemExit('usage: -- input.glb output.glb')
src,dst=sys.argv[sys.argv.index('--')+1:][:2]
if not os.path.exists(src):raise SystemExit('No generated mesh: '+src)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=os.path.abspath(src))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
if not meshes:raise RuntimeError('Missing real mesh')
for obj in meshes:
 world=obj.matrix_world.copy();obj.data=obj.data.copy();obj.data.transform(world)
 obj.parent=None;obj.matrix_world.identity()
verts=[v.co for o in meshes for v in o.data.vertices]
mins=[min(v[i] for v in verts) for i in range(3)]
maxs=[max(v[i] for v in verts) for i in range(3)]
width=max(maxs[0]-mins[0],.0001);height=max(maxs[2]-mins[2],.0001)
cx=(mins[0]+maxs[0])/2;cy=(mins[1]+maxs[1])/2
scale=2.1/height;w=width*scale
for o in meshes:
 for v in o.data.vertices:v.co=((v.co.x-cx)*scale,(v.co.y-cy)*scale,(v.co.z-mins[2])*scale)
bpy.ops.object.armature_add(enter_editmode=True,location=(0,0,0))
rig=bpy.context.object;rig.name='TrellisRig'
rig.data.edit_bones.remove(rig.data.edit_bones[0])
def bone(name,head,tail,parent=None):
 b=rig.data.edit_bones.new(name);b.head=head;b.tail=tail
 if parent:b.parent=rig.data.edit_bones[parent]
bone('body',(0,0,.55),(0,0,1.8))
for side,s in [('left',-1),('right',1)]:
 bone(side+'Arm',(s*w*.3,0,1.39),(s*w*.45,0,.87),'body')
 bone(side+'Leg',(s*w*.2,0,.6),(s*w*.2,0,.14),'body')
bpy.ops.object.mode_set(mode='OBJECT')
for o in meshes:
 groups={n:o.vertex_groups.new(name=n) for n in ['body','leftArm','rightArm','leftLeg','rightLeg']}
 for v in o.data.vertices:
  x=v.co.x/w;z=v.co.z/2.1
  if z<.32:
   weight=max(0,min(1,(.34-z)/.14));n='leftLeg' if x<0 else 'rightLeg'
  elif abs(x)>.29 and .31<z<.77:
   weight=max(0,min(.99,(abs(x)-.28)/.17));n='leftArm' if x<0 else 'rightArm'
  else:weight=0;n='body'
  groups['body'].add([v.index],max(.001,1-weight),'REPLACE')
  if n!='body' and weight>0.001:groups[n].add([v.index],weight,'REPLACE')
 mod=o.modifiers.new('Articulated rig','ARMATURE');mod.object=rig;o.parent=rig
bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='POSE')
for label,frames in {
 'idle':[(1,0,0),(17,.02,0),(33,0,0)],
 'walk':[(1,.25,-.28),(9,-.25,.28),(17,.25,-.28)],
 'wave':[(1,0,0),(10,1.1,0),(20,.8,0),(30,1.1,0),(40,0,0)],
 'cheer':[(1,0,0),(10,1.1,0),(20,.9,0),(30,0,0)]
}.items():
 action=bpy.data.actions.new(label);rig.animation_data_create();rig.animation_data.action=action
 for frame,arms,legs in frames:
  for name,p in rig.pose.bones.items():
   p.rotation_mode='XYZ';p.rotation_euler=(0,0,0)
   if name=='rightArm':p.rotation_euler[1]=arms
   if name=='leftArm':p.rotation_euler[1]=-arms if label!='wave' else 0
   if name=='leftLeg':p.rotation_euler[0]=legs
   if name=='rightLeg':p.rotation_euler[0]=-legs
   p.keyframe_insert(data_path='rotation_euler',frame=frame,group=name)
  for fc in action.fcurves:
   for kp in fc.keyframe_points:kp.interpolation='BEZIER'
 track=rig.animation_data.nla_tracks.new();track.name=label
 strip=track.strips.new(label,frames[0][0],action);strip.action_frame_end=frames[-1][0]
 rig.animation_data.action=None
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=rig
os.makedirs(os.path.dirname(os.path.abspath(dst)),exist_ok=True)
bpy.ops.export_scene.gltf(filepath=os.path.abspath(dst),export_format='GLB',use_selection=True,export_animations=True,export_nla_strips=True)
print('ANIMATED_TRELLIS_GLB',dst,'meshes',len(meshes))
