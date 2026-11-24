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

def fallback_material(name):
    material = bpy.data.materials.new(name=name + "_PBR_Fallback")
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.55, 0.55, 0.55, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = 0.78
    return material

baked = 0
skipped = 0
for obj in meshes:
    if not obj.data.color_attributes:
        # The imported rig can contain small helper meshes with no COLOR_0.
        # Keep them and give them a neutral material; bake the actual TripoSR mesh.
        print("PBR_BAKE_SKIP_NO_VERTEX_COLOR", obj.name, flush=True)
        if not obj.data.materials:
            obj.data.materials.append(fallback_material(obj.name))
        skipped += 1
        continue

    populated = []
    for candidate in obj.data.color_attributes:
        values = [tuple(item.color) for item in candidate.data]
        if not values:
            continue
        rgb_max = max(max(value[0], value[1], value[2]) for value in values)
        rgb_mean = sum(sum(value[:3]) / 3.0 for value in values) / len(values)
        print(
            "VERTEX_COLOR_ATTRIBUTE_STATS", obj.name,
            candidate.name, candidate.domain, candidate.data_type,
            "count", len(values), "rgb_max", rgb_max, "rgb_mean", rgb_mean,
            flush=True,
        )
        if rgb_max > 0.02:
            populated.append(candidate.name)
    if not populated:
        raise RuntimeError(f"{obj.name}: all imported vertex-colour attributes are blank")
    color_attribute = populated[0]
    activate(obj)
    if not obj.data.uv_layers:
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(island_margin=0.02)
        bpy.ops.object.mode_set(mode="OBJECT")
    if not obj.data.uv_layers:
        raise RuntimeError(f"{obj.name}: UV unwrap failed")

    bake_material = bpy.data.materials.new(name=f"{obj.name}_VertexBake")
    bake_material.use_nodes = True
    nodes = bake_material.node_tree.nodes
    links = bake_material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = 1.0
    vertex = nodes.new("ShaderNodeVertexColor")
    vertex.layer_name = color_attribute
    links.new(vertex.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
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
    if not obj.data.uv_layers:
        raise RuntimeError(f"{obj.name}: no UV layer available for texture baking")
    obj.data.uv_layers.active = obj.data.uv_layers[0]
    obj.data.uv_layers.active_index = 0
    scene.render.bake.target = "IMAGE_TEXTURES"
    activate(obj)
    result = bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, margin=12, use_clear=True)
    print("BASE_COLOR_BAKE_RESULT", obj.name, result, "attribute", color_attribute, flush=True)
    if "FINISHED" not in result:
        raise RuntimeError(f"{obj.name}: base-colour bake was cancelled")
    base_image.update()
    base_pixels = list(base_image.pixels)
    base_max = max(base_pixels[0::4] + base_pixels[1::4] + base_pixels[2::4])
    if base_max < 0.02:
        raise RuntimeError(f"{obj.name}: baked base-colour texture is blank")
    base_image.pack()

    normal_image = make_image(f"{obj.name}_Normal", 1024)
    target.image = normal_image
    for node in nodes:
        node.select = False
    target.select = True
    nodes.active = target
    activate(obj)
    result = bpy.ops.object.bake(type="NORMAL", margin=12, use_clear=True)
    print("NORMAL_BAKE_RESULT", obj.name, result, flush=True)
    if "FINISHED" not in result:
        raise RuntimeError(f"{obj.name}: normal-map bake was cancelled")
    normal_image.update()
    normal_pixels = list(normal_image.pixels)
    normal_max = max(normal_pixels[0::4] + normal_pixels[1::4] + normal_pixels[2::4])
    if normal_max < 0.02:
        raise RuntimeError(f"{obj.name}: baked normal texture is blank")
    normal_image.colorspace_settings.name = "Non-Color"
    normal_image.pack()

    rough_image = make_image(f"{obj.name}_Roughness", 512)
    rough_image.colorspace_settings.name = "Non-Color"
    rough_image.pixels.foreach_set([0.78, 0.78, 0.78, 1.0] * (512 * 512))
    rough_image.pack()

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

    baked += 1
    print(
        "BAKED_PBR_MAPS", obj.name,
        "color_attribute", color_attribute,
        "uv_layers", len(obj.data.uv_layers),
        "base", base_image.size[:],
        "normal", normal_image.size[:],
        "roughness", rough_image.size[:],
        flush=True,
    )

if baked < 1:
    raise RuntimeError("No vertex-colour mesh was baked")
print("PBR_BAKE_SUMMARY", "baked", baked, "skipped_helpers", skipped, flush=True)

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
