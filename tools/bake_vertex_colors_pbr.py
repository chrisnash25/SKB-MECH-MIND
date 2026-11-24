"""Bake TripoSR vertex colours into actual glTF PBR texture maps.
Staging-only diagnostic. Preserves the imported skin and animation clips.
"""
import bpy, os, sys

if "--" not in sys.argv:
    raise SystemExit("usage: blender -b --python bake_vertex_colors_pbr.py -- input.glb output.glb")
src, dst = sys.argv[sys.argv.index("--") + 1:][:2]
if not os.path.isfile(src):
    raise SystemExit("Missing input GLB: " + src)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=os.path.abspath(src))
meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
if not meshes:
    raise RuntimeError("No mesh objects in animated GLB")

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 1
scene.render.bake.margin = 12
scene.render.bake.use_clear = True
scene.render.bake.use_pass_color = True
scene.render.bake.use_pass_direct = False
scene.render.bake.use_pass_indirect = False
scene.render.bake.normal_space = "TANGENT"

def activate(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

def make_image(name, size):
    image = bpy.data.images.new(name, width=size, height=size, alpha=True, float_buffer=False)
    image.file_format = "PNG"
    return image

for index, obj in enumerate(meshes):
    if not obj.data.color_attributes:
        raise RuntimeError(f"{obj.name}: TripoSR mesh has no vertex-colour attribute")
    color_attribute = obj.data.color_attributes[0].name

    activate(obj)
    if not obj.data.uv_layers:
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(island_margin=0.02)
        bpy.ops.object.mode_set(mode="OBJECT")
    if not obj.data.uv_layers:
        raise RuntimeError(f"{obj.name}: UV unwrap failed")

    # Bake COLOR_0 vertex colours to a UV base-colour image without lighting.
    bake_material = bpy.data.materials.new(name=f"{obj.name}_VertexBake")
    bake_material.use_nodes = True
    nodes = bake_material.node_tree.nodes
    links = bake_material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    vertex = nodes.new("ShaderNodeVertexColor")
    vertex.layer_name = color_attribute
    links.new(vertex.outputs["Color"], emission.inputs["Color"])
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    base_image = make_image(f"{obj.name}_BaseColor", 1024)
    target = nodes.new("ShaderNodeTexImage")
    target.image = base_image
    for node in nodes:
        node.select = False
    target.select = True
    nodes.active = target
    obj.data.materials.clear()
    obj.data.materials.append(bake_material)
    for polygon in obj.data.polygons:
        polygon.material_index = 0
    activate(obj)
    bpy.ops.object.bake(type="EMIT")
    base_image.pack()

    # Bake tangent-space normals from the actual reconstructed surface.
    normal_image = make_image(f"{obj.name}_Normal", 1024)
    target.image = normal_image
    nodes.active = target
    bpy.ops.object.bake(type="NORMAL")
    normal_image.colorspace_settings.name = "Non-Color"
    normal_image.pack()

    # A roughness map is authored explicitly; metallic remains dielectric.
    rough_image = make_image(f"{obj.name}_Roughness", 512)
    rough_image.colorspace_settings.name = "Non-Color"
    rough_image.pixels.foreach_set([0.78, 0.78, 0.78, 1.0] * (512 * 512))
    rough_image.pack()

    # Final glTF PBR material: baked albedo + roughness + tangent normal.
    final_material = bpy.data.materials.new(name=f"{obj.name}_PBR")
    final_material.use_nodes = True
    nodes = final_material.node_tree.nodes
    links = final_material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    base_tex = nodes.new("ShaderNodeTexImage")
    base_tex.image = base_image
    rough_tex = nodes.new("ShaderNodeTexImage")
    rough_tex.image = rough_image
    rough_tex.image.colorspace_settings.name = "Non-Color"
    normal_tex = nodes.new("ShaderNodeTexImage")
    normal_tex.image = normal_image
    normal_tex.image.colorspace_settings.name = "Non-Color"
    normal_node = nodes.new("ShaderNodeNormalMap")
    links.new(base_tex.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(rough_tex.outputs["Color"], bsdf.inputs["Roughness"])
    links.new(normal_tex.outputs["Color"], normal_node.inputs["Color"])
    links.new(normal_node.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Metallic"].default_value = 0.0
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    obj.data.materials.clear()
    obj.data.materials.append(final_material)
    for polygon in obj.data.polygons:
        polygon.material_index = 0

    print(
        "BAKED_PBR_MAPS", obj.name,
        "color_attribute", color_attribute,
        "uv_layers", len(obj.data.uv_layers),
        "base", base_image.size[:],
        "normal", normal_image.size[:],
        "roughness", rough_image.size[:],
        flush=True,
    )

# Keep the armature, skinned meshes, and NLA animation strips in the exported GLB.
bpy.ops.object.select_all(action="SELECT")
os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=os.path.abspath(dst),
    export_format="GLB",
    use_selection=True,
    export_animations=True,
    export_nla_strips=True,
    export_image_format="AUTO",
)
print("PBR_TEXTURE_BAKE_COMPLETE", dst, "meshes", len(meshes), flush=True)
