"""Bricko reference-specific prototype. Blender 3.x/4.x: blender -b -P tools/build_bricko_reference.py
Staging ONLY: never overwrites the live cast. Source reference: user's original 10-brick poster.
"""
import bpy, math, os
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'emotional-support-brick-3d','staging','bricko')
os.makedirs(OUT,exist_ok=True)
def mat(name, rgb, rough=.55, metallic=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metallic
 return m
orange=mat('Bricko orange porous ceramic',(.92,.19,.065),.72)
red=mat('Cap and trainer red fabric',(.68,.035,.045),.83)
black=mat('Headphones black rubber',(.025,.027,.035),.53)
silver=mat('Headphone silver rings',(.45,.47,.52),.28,.65)
white=mat('Eyes and trainer soles',(.96,.94,.89),.28)
brown=mat('Warm brown irises',(.29,.13,.035),.24)
pink=mat('Cheeks',(.98,.30,.24),.55)
mouth=mat('Mouth interior',(.14,.012,.025),.8)
tongue=mat('Tongue',(.89,.19,.26),.65)
def cube(n,loc,dim,material,bevel=.05):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.dimensions=dim
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Rounded manufactured edges','BEVEL');mod.width=bevel;mod.segments=4
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 o.data.materials.append(material);return o
def ball(n,loc,scale,material):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=loc)
 o=bpy.context.object;o.name=n;o.scale=scale;o.data.materials.append(material);return o
def cyl(n,loc,r,depth,material,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=depth,location=loc,rotation=rot)
 o=bpy.context.object;o.name=n;o.data.materials.append(material);return o
meshes=[]
def part(obj,bone='torso'):meshes.append((obj,bone));return obj
part(cube('Bricko rounded orange body',(0,0,1.23),(1.22,.70,1.42),orange,.15))
for x in (-.38,0,.38):part(cyl('Brick top stud',(x,0,2.00),.17,.10,orange))
# Face: distinct eyes, irises, catchlights, brows, rosy cheeks and wide open smile
for x in (-.29,.29):
 part(ball('Eye white',(x,-.364,1.51),(.225,.070,.265),white))
 part(ball('Iris',(x,-.433,1.48),(.135,.042,.165),brown))
 part(ball('Pupil',(x,-.467,1.48),(.078,.025,.107),black))
 part(ball('Eye catchlight',(x-.044,-.493,1.55),(.037,.014,.046),white))
 brow=part(cube('Expressive dark eyebrow',(x,-.395,1.83),(.33,.065,.070),black,.03))
 brow.rotation_euler[1]=-.09 if x<0 else .09
 part(ball('Rosy cheek',(x*1.62,-.364,1.20),(.13,.037,.075),pink))
part(ball('Nose',(0,-.407,1.36),(.075,.07,.07),orange))
part(ball('Open smiling mouth',(0,-.392,1.07),(.33,.055,.20),mouth))
part(ball('Lower teeth',(0,-.447,1.175),(.25,.016,.045),white))
part(ball('Tongue',(0,-.450,.974),(.18,.019,.060),tongue))
# Red backwards/sideways cap, black BRICKO patch, fabric panel and curved visor
part(ball('Red cap crown',(0,0,2.045),(.61,.39,.22),red))
part(cube('Cap front black label',(0,-.35,2.11),(.46,.035,.17),black,.02))
part(cube('Cap brim left',(-.51,-.37,1.99),(.53,.34,.075),red,.06))
# Neck headphones, individually modelled ear cups and metallic rims
for s in (-1,1):
 part(ball('Headphone earpiece',(s*.52,-.29,.87),(.24,.14,.26),black))
 part(ball('Headphone silver disc',(s*.52,-.416,.87),(.16,.035,.18),silver))
 part(ball('Headphone black inner',(s*.52,-.450,.87),(.12,.025,.14),black))
# Articulated limbs, black sleeves, orange hands, red trainers
for s,side in ((-1,'left'),(1,'right')):
 part(ball(side+' black sleeve',(s*.70,0,1.07),(.22,.23,.30),black),side+'_arm')
 part(ball(side+' orange hand',(s*.76,-.08,.78),(.18,.17,.18),orange),side+'_arm')
 part(ball(side+' dark leg',(s*.32,0,.40),(.17,.19,.28),black),side+'_leg')
 part(cube(side+' red trainer',(s*.32,-.17,.18),(.43,.67,.27),red,.10),side+'_leg')
 part(cube(side+' white sole',(s*.32,-.18,.075),(.45,.69,.075),white,.025),side+'_leg')
# Bone structure
bpy.ops.object.armature_add(enter_editmode=True,location=(0,0,0))
rig=bpy.context.object;rig.name='Bricko_Rig'
rig.data.edit_bones.remove(rig.data.edit_bones[0])
def bone(n,head,tail,parent=None):
 b=rig.data.edit_bones.new(n);b.head=head;b.tail=tail
 if parent:b.parent=rig.data.edit_bones[parent]
bone('torso',(0,0,.55),(0,0,1.95))
for s,side in ((-1,'left'),(1,'right')):
 bone(side+'_arm',(s*.57,0,1.30),(s*.79,0,.80),'torso')
 bone(side+'_leg',(s*.32,0,.58),(s*.32,0,.14),'torso')
bpy.ops.object.mode_set(mode='OBJECT')
for obj,b in meshes:
 mod=obj.modifiers.new('Rig','ARMATURE');mod.object=rig
 vg=obj.vertex_groups.new(name=b);vg.add(list(range(len(obj.data.vertices))),1,'REPLACE')
 obj.parent=rig
bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='POSE')
for label,keys in {
 'idle':[(1,0,0),(16,.02,0),(31,0,0)],
 'walk':[(1,0,.34),(9,0,-.34),(17,0,.34)],
 'wave':[(1,0,0),(9,-1.0,0),(18,-.7,0),(27,-1.0,0),(36,0,0)],
 'cheer':[(1,0,0),(10,-1.4,0),(20,-1.4,0),(30,0,0)]
}.items():
 act=bpy.data.actions.new('bricko_'+label)
 rig.animation_data_create();rig.animation_data.action=act
 for frame,armangle,legangle in keys:
  for name in ('torso','left_arm','right_arm','left_leg','right_leg'):
   p=rig.pose.bones[name];p.rotation_mode='XYZ';p.rotation_euler=(0,0,0)
   if name=='right_arm':p.rotation_euler[1]=armangle
   if name=='left_arm' and label=='walk':p.rotation_euler[0]=legangle*.7
   if name=='right_arm' and label=='walk':p.rotation_euler[0]=-legangle*.7
   if name=='left_leg':p.rotation_euler[0]=legangle
   if name=='right_leg':p.rotation_euler[0]=-legangle
   p.keyframe_insert(data_path='rotation_euler',frame=frame,group=name)
 track=rig.animation_data.nla_tracks.new();track.name=label
 strip=track.strips.new(label,keys[0][0],act);strip.action_frame_end=keys[-1][0]
 rig.animation_data.action=None
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for obj,_ in meshes:obj.select_set(True)
bpy.context.view_layer.objects.active=rig
path=os.path.join(OUT,'bricko.glb')
bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',use_selection=True,export_animations=True)
print('STAGED_BRICKO',path,len(meshes),'meshes')
