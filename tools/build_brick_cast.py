"""Generate individually rigged, textured glTF brick characters with Blender.
Run: blender -b -noaudio --python tools/build_brick_cast.py
Reference-art-inspired models, not exact reconstruction of the concept painting.
"""
import bpy, math, os, random
from mathutils import Vector
random.seed(81)
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
OUT=os.path.join(ROOT,'emotional-support-brick-3d','staging','cast')
# This branch builds in staging; the public game's existing models remain untouched.
os.makedirs(OUT,exist_ok=True)
CAST=[
 ('bricko',(0.74,.13,.10),'cap'),('rusty',(.47,.22,.12),'goggles'),
 ('pulse',(.06,.10,.29),'headphones'),('calm',(.30,.60,.82),'beanie'),
 ('spark',(.95,.57,.09),'stars'),('blocky',(.40,.43,.48),'glasses'),
 ('cozy',(.88,.39,.55),'scarf'),('zapp',(.34,.73,.07),'band'),
 ('echo',(.36,.13,.69),'headphones'),('gizmo',(.76,.31,.08),'tools')]
def material(name,color,rough=.48,metal=0,emission=None):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if emission:
  emission_input=p.inputs.get('Emission Color') or p.inputs.get('Emission')
  strength_input=p.inputs.get('Emission Strength')
  if emission_input:emission_input.default_value=(*emission,1)
  if strength_input:strength_input.default_value=.5
 return m
def cube(name,loc,scale,mat,bevel=.07):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=o.modifiers.new('Soft rounded edges','BEVEL');mod.width=bevel;mod.segments=3
 o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');o.data.materials.append(mat);return o
def sphere(name,loc,scale,mat):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat);return o
def cylinder(name,loc,r,depth,mat,rotation=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=depth,location=loc,rotation=rotation);o=bpy.context.object;o.name=name;o.data.materials.append(mat);return o
def bind(o,arm,bone):
 mod=o.modifiers.new('Armature deformation','ARMATURE');mod.object=arm
 vg=o.vertex_groups.new(name=bone);vg.add(list(range(len(o.data.vertices))),1,'REPLACE')
 o.parent=arm
def make(name,color,style):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 shell=material(name+' enamel',color,.36)
 dark=material('Charcoal rubber',(.045,.045,.07),.76)
 cream=material('Ivory',(.95,.88,.79),.45)
 eye=material('Eye whites',(.98,.96,.93),.22)
 pupil=material('Pupil',(.02,.045,.09),.18)
 accent=material('Accent',(.13,.72,.94) if name=='pulse' else (.95,.67,.24),.3,emission=(.03,.2,.36) if name=='pulse' else None)
 objs=[]
 def add(o,b):objs.append((o,b));return o
 add(cube('Body',(0,0,1.27),(1.60,.68,1.10),shell,.17),'body')
 for x in [-.49,0,.49]:add(cylinder('Top stud',(x,0,1.88),.20,.13,shell),'body')
 for x in [-.37,.37]:
  add(sphere('Eye white',(x,-.375,1.43),(.18,.045,.19),eye),'body')
  add(sphere('Pupil',(x,-.418,1.42),(.095,.035,.105),pupil),'body')
  add(sphere('Eye glint',(x-.035,-.45,1.47),(.029,.012,.03),eye),'body')
 add(sphere('Smile',(0,-.38,1.13),(.20,.035,.063),dark),'body')
 for sign,side in [(-1,'left'),(1,'right')]:
  x=sign*.89
  add(sphere(side+'Arm',(x,0,1.12),(.13,.15,.31),shell),side+'Arm')
  add(sphere(side+'Hand',(x+sign*.03,-.02,.86),(.18,.16,.17),cream),side+'Arm')
  add(sphere(side+'Leg',(sign*.40,0,.49),(.15,.16,.31),dark),side+'Leg')
  add(cube(side+'Shoe',(sign*.40,-.13,.22),(.48,.59,.24),dark,.09),side+'Leg')
  add(cube(side+'Sole',(sign*.40,-.14,.10),(.49,.61,.08),cream,.025),side+'Leg')
 if style in ('cap','tools'):
  add(cube('Cap crown',(0,0,1.98),(1.56,.71,.20),dark if style=='tools' else shell,.09),'body')
  add(cube('Cap brim',(0,-.38,1.93),(.90,.49,.08),dark,.035),'body')
 if style=='beanie':add(sphere('Soft beanie',(0,0,1.97),(.78,.41,.25),dark),'body')
 if style=='scarf':
  add(cube('Cozy scarf',(0,-.03,.77),(1.43,.77,.17),cream,.075),'body')
  add(cube('Scarf tail',(.50,-.4,.56),(.23,.08,.44),cream,.05),'body')
 if style=='band':add(cube('Sports band',(0,-.35,1.73),(1.52,.09,.13),dark,.03),'body')
 if style in ('headphones','goggles','glasses','stars'):
  for x in [-.41,.41]:
   if style=='headphones':add(sphere('Headphone cup',(x*2.05,0,1.49),(.18,.28,.33),accent),'body')
   else:add(sphere('Face accessory',(x,-.43,1.46),(.22,.06,.18),accent if style=='stars' else dark),'body')
 # Individually identifiable accessories and facial details for all ten cast members.
 # These are staged procedural prototypes; compare against the reference before release.
 if name=='bricko':
  add(cube('Red baseball cap crown',(0,-.02,2.02),(1.48,.75,.19),shell,.08),'body')
  add(cube('Headphones around neck',(0,-.37,.82),(1.04,.13,.17),dark,.07),'body')
  for x in (-.43,.43):add(sphere('Neck headphone earcup',(x,-.42,.82),(.19,.13,.22),dark),'body')
 if name=='rusty':
  add(cube('Leather tool harness',(0,-.40,.85),(1.32,.13,.17),dark,.04),'body')
  for x in (-.43,.43):add(cylinder('Blue goggle lens',(x,-.48,1.86),.19,.09,accent,(math.pi/2,0,0)),'body')
 if name=='pulse':
  for x in (-.48,0,.48):
   add(cube('Neon cyan circuit stripe',(x,-.36,.92),(.055,.045,.64),accent,.012),'body')
  add(cube('Neon forehead circuit',(0,-.38,1.77),(.75,.04,.06),accent,.012),'body')
 if name=='calm':
  add(cube('Hoodie chest panel',(0,-.39,.89),(.97,.09,.44),dark,.10),'body')
  add(sphere('Lotus hoodie emblem',(0,-.45,.91),(.19,.035,.13),cream),'body')
  add(cube('Knitted beanie brim',(0,-.02,1.92),(1.51,.78,.18),dark,.08),'body')
 if name=='spark':
  add(cube('Pink hoodie chest',(0,-.38,.90),(1.29,.12,.60),cream,.11),'body')
  add(sphere('Daisy flower centre',(0,-.46,.98),(.11,.035,.11),accent),'body')
  for i in range(8):
   a=i*math.pi/4
   add(sphere('Daisy petal',(math.cos(a)*.19,-.46, .98+math.sin(a)*.19),(.10,.027,.10),cream),'body')
 if name=='blocky':
  add(cube('Black reading book',(0,-.66,.75),(.62,.12,.52),dark,.03),'body')
  add(cube('Book page edges',(0,-.73,.75),(.49,.035,.43),cream,.01),'body')
 if name=='cozy':
  add(cube('Fluffy cream robe',(0,-.02,.80),(1.54,.77,.46),cream,.13),'body')
  add(cylinder('Heart mug',(0,-.67,.83),.19,.32,cream,(math.pi/2,0,0)),'body')
  add(sphere('Mug heart',(0,-.87,.83),(.09,.02,.08),accent),'body')
 if name=='zapp':
  add(cube('Yellow lightning chest emblem',(0,-.40,.93),(.16,.06,.43),accent,.02),'body')
  add(cube('Sport headband',(0,-.38,1.80),(1.49,.09,.14),dark,.03),'body')
 if name=='echo':
  for i in range(28):
   a=i*.59;r=.014*i
   add(sphere('Galaxy spiral point',(math.cos(a)*r,-.40,.96+math.sin(a)*r),(.035,.018,.035),accent),'body')
 if name=='gizmo':
  add(cube('Mechanic belt',(0,-.41,.75),(1.42,.13,.20),dark,.04),'body')
  for x in (-.48,.48):add(cube('Tool pouch',(x,-.47,.70),(.30,.15,.35),accent,.04),'body')
  add(cube('Wrench handle',(.93,-.11,1.04),(.10,.12,.66),cream,.03),'rightArm')
 # Armature: independent shoulder and hip joints, exportable glTF skinning.
 bpy.ops.object.armature_add(enter_editmode=True,location=(0,0,0))
 arm=bpy.context.object;arm.name=name+'_Rig';arm.data.edit_bones.remove(arm.data.edit_bones[0])
 def bone(n,head,tail,parent=None):
  b=arm.data.edit_bones.new(n);b.head=head;b.tail=tail
  if parent:b.parent=arm.data.edit_bones[parent]
 bone('body',(0,0,.67),(0,0,1.83))
 for side,sign in [('left',-1),('right',1)]:
  bone(side+'Arm',(sign*.80,0,1.40),(sign*.91,0,.88),'body')
  bone(side+'Leg',(sign*.39,0,.68),(sign*.39,0,.17),'body')
 bpy.ops.object.mode_set(mode='OBJECT')
 for obj,b in objs:bind(obj,arm,b)
 # Export distinct animation clips for the armature. Three.js can play these
 # directly, while the runtime also supports procedural bone movement.
 bpy.context.view_layer.objects.active=arm
 bpy.ops.object.mode_set(mode='POSE')
 bones=arm.pose.bones
 def clip(label,frames,poses):
  action=bpy.data.actions.new(name+'_'+label)
  arm.animation_data_create();arm.animation_data.action=action
  for frame in frames:
   for bname in ['body','leftArm','rightArm','leftLeg','rightLeg']:
    bone=bones[bname];bone.rotation_mode='XYZ'
    bone.rotation_euler=poses.get(frame,{}).get(bname,(0,0,0))
    bone.keyframe_insert(data_path='rotation_euler',frame=frame,group=bname)
  for fc in action.fcurves:
   for kp in fc.keyframe_points:kp.interpolation='BEZIER'
  track=arm.animation_data.nla_tracks.new();track.name=label
  strip=track.strips.new(label,frames[0],action);strip.action_frame_start=frames[0];strip.action_frame_end=frames[-1]
  arm.animation_data.action=None
 clip('idle',[1,25,49],{25:{'body':(0,0,.012)},49:{}})
 clip('walk',[1,9,17,25],{
  1:{'leftArm':(.24,0,0),'rightArm':(-.24,0,0),'leftLeg':(-.34,0,0),'rightLeg':(.34,0,0)},
  9:{'leftArm':(-.24,0,0),'rightArm':(.24,0,0),'leftLeg':(.34,0,0),'rightLeg':(-.34,0,0)},
  17:{'leftArm':(.24,0,0),'rightArm':(-.24,0,0),'leftLeg':(-.34,0,0),'rightLeg':(.34,0,0)},
  25:{'leftArm':(.24,0,0),'rightArm':(-.24,0,0),'leftLeg':(-.34,0,0),'rightLeg':(.34,0,0)}})
 clip('wave',[1,10,20,30,40],{
  1:{},10:{'rightArm':(0,0,-1.15)},20:{'rightArm':(0,0,-.85)},30:{'rightArm':(0,0,-1.15)},40:{}})
 bpy.ops.object.mode_set(mode='OBJECT')
 bpy.context.view_layer.objects.active=arm
 for obj in bpy.context.selected_objects:obj.select_set(False)
 arm.select_set(True)
 for obj,_ in objs:obj.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_apply=False,export_animations=True)
 print('EXPORTED',name,len(objs),'meshes')
for name,color,style in CAST:make(name,color,style)
