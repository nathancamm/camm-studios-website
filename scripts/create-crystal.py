"""Generate the studio's clear-glass logo studies with Blender 5.2."""

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
POSTERS = ROOT / "src/shared/assets/brand/crystal"
OUTPUT = ROOT / "output/blender"
MODELS = ROOT / "public/models"
NAMES = ("01-precision", "02-prism", "03-strata", "04-interlock", "05-orbit")


def material(name, color, roughness=0.1, transmission=0.0):
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["IOR"].default_value = 1.48
    shader.inputs["Transmission Weight"].default_value = transmission
    return result


def camera_white_floor(floor):
    nodes, links = floor.node_tree.nodes, floor.node_tree.links
    diffuse, output = nodes.get("Principled BSDF"), nodes.get("Material Output")
    path = nodes.new("ShaderNodeLightPath")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (1, 1, 1, 1)
    emission.inputs["Strength"].default_value = 64
    mix = nodes.new("ShaderNodeMixShader")
    links.new(path.outputs["Is Camera Ray"], mix.inputs[0])
    links.new(diffuse.outputs["BSDF"], mix.inputs[1])
    links.new(emission.outputs["Emission"], mix.inputs[2])
    links.new(mix.outputs[0], output.inputs["Surface"])


def arc(name, outer, inner, depth, segments=72, gap=80, offset=(0, 0, 0), rotation=0, bevel=0.09):
    verts, faces = [], []
    for z in (-depth / 2, depth / 2):
        for radius in (outer, inner):
            for index in range(segments + 1):
                angle = math.radians(gap / 2 + (360 - gap) * index / segments + rotation)
                verts.append((radius * math.cos(angle), radius * math.sin(angle), z))
    n = segments + 1
    for index in range(segments):
        faces.extend([
            (index, index + 1, n + index + 1, n + index),
            (2 * n + index, 3 * n + index, 3 * n + index + 1, 2 * n + index + 1),
            (index, 2 * n + index, 2 * n + index + 1, index + 1),
            (n + index, n + index + 1, 3 * n + index + 1, 3 * n + index),
        ])
    faces.extend([(0, n, 3 * n, 2 * n), (n - 1, 3 * n - 1, 4 * n - 1, 2 * n - 1)])
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    topology = bmesh.new()
    topology.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(topology, faces=list(topology.faces))
    topology.to_mesh(mesh)
    topology.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = offset
    obj.data.materials.append(bpy.data.materials["Optical glass"])
    if bevel:
        modifier = obj.modifiers.new("Polished edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 4
        modifier = obj.modifiers.new("Face normals", "WEIGHTED_NORMAL")
        modifier.keep_sharp = True
        modifier.weight = 30
    return obj


def point_at(obj, target=(0, 0, 0)):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def panel(name, location, scale, mat):
    bpy.ops.mesh.primitive_plane_add(size=2, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    point_at(obj)
    obj.data.materials.append(mat)
    obj.visible_camera = False
    return obj


def build(name, samples, size):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == "METAL"
    scene.cycles.device = "GPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 12
    scene.cycles.transmission_bounces = 10
    scene.cycles.transparent_max_bounces = 12
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 94
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.exposure = 1.3
    scene.world = bpy.data.worlds.new("White studio")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.8
    material("Optical glass", (1, 1, 1), 0.035, 1.0)
    if name == NAMES[0]:
        logos = [arc("Precision C", 2.5, 1.44, 1.12, gap=82, bevel=0.17)]
    elif name == NAMES[1]:
        logos = [arc("Prism C", 2.5, 1.4, 1.22, segments=8, gap=90, rotation=0, bevel=0.035)]
    elif name == NAMES[2]:
        logos = [arc(f"Stratum {i + 1}", 2.5, 1.55, 0.26, gap=84, offset=(0, 0, (i - 1) * 0.44), bevel=0.065) for i in range(3)]
    elif name == NAMES[3]:
        logos = [
            arc("C interlock", 1.87, 1.18, 0.8, gap=95, offset=(-0.62, 0.22, 0.23), bevel=0.12),
            arc("S interlock", 1.87, 1.18, 0.8, gap=95, offset=(0.62, -0.22, -0.23), rotation=180, bevel=0.12),
        ]
    else:
        logos = [arc("Orbital exterior", 2.5, 2.06, 0.58, gap=58, bevel=0.13),
                 arc("Orbital interior", 1.66, 1.18, 0.65, gap=70, rotation=180, bevel=0.14)]
        logos[1].rotation_euler.x = math.radians(24)
    bpy.context.view_layer.update()
    # glTF consumers use a front-facing XY silhouette with Z thickness.
    if name == NAMES[0]:
        bpy.ops.object.select_all(action="DESELECT")
        for obj in logos:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = logos[0]
        bpy.ops.export_scene.gltf(filepath=str(OUTPUT / "precision.glb"), export_format="GLB", use_selection=True, export_apply=True, export_yup=False, export_cameras=False, export_lights=False)
    matte = material("Studio white", (1, 1, 1), 0.6)
    camera_white_floor(matte)
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -1.12))
    bpy.context.object.name = "White cyclorama"
    bpy.context.object.data.materials.append(matte)
    black = material("Reflection flags", (0.012, 0.012, 0.012), 0.8)
    panel("Left reflection flag", (-5, 0, 3), (1.3, 4, 1), black)
    panel("Right reflection flag", (4.5, 2, 3), (0.45, 4, 1), black)
    for label, location, energy, scale in [
        ("Key softbox", (-4, -2, 8), 1100, 5),
        ("Rim strip", (5, 4, 6), 1600, 3),
        ("Front fill", (1, -6, 4), 500, 4),
    ]:
        light = bpy.data.lights.new(label, "AREA")
        light.energy, light.shape, light.size = energy, "DISK", scale
        obj = bpy.data.objects.new(label, light)
        scene.collection.objects.link(obj)
        obj.location = location
        point_at(obj)
    camera = bpy.data.cameras.new("Study camera")
    obj = bpy.data.objects.new("Study camera", camera)
    scene.collection.objects.link(obj)
    obj.location = (4.8, -7.2, 18)
    point_at(obj)
    camera.type, camera.ortho_scale = "ORTHO", 7.2
    camera.lens = 65
    scene.camera = obj
    scene.render.filepath = str(POSTERS / f"{name}.webp")
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / f"{name}.blend"))
    bpy.ops.render.render(write_still=True)
    print(json.dumps({"study": name, "blender": bpy.app.version_string, "poster": scene.render.filepath, "logo_objects": [o.name for o in logos]}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", choices=NAMES)
    parser.add_argument("--samples", type=int, default=48)
    parser.add_argument("--size", type=int, default=960)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    for directory in (POSTERS, OUTPUT, MODELS):
        directory.mkdir(parents=True, exist_ok=True)
    for study in ((args.only,) if args.only else NAMES):
        build(study, args.samples, args.size)
