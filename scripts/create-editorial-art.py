"""Render the product and editorial sculpture collection with Blender 5.2."""

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
POSTERS = ROOT / "src/shared/assets/art/crystal"
OUTPUT = ROOT / "output/blender/editorial"
MODELS = ROOT / "public/models"
NAMES = (
    "bronzed-solar", "stellar-orbit", "bronzed-uv", "bronzed-cloud",
    "bronzed-spf", "stellar-369", "stellar-affirmation", "stellar-vision",
    "artemis", "atlas",
)


def material(name, transmission=0, metallic=0, roughness=0.04, color=(1, 1, 1)):
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["IOR"].default_value = 1.48
    shader.inputs["Transmission Weight"].default_value = transmission
    shader.inputs["Metallic"].default_value = metallic
    return result


def seamless_floor():
    floor = bpy.data.materials["White"]
    nodes = floor.node_tree.nodes
    links = floor.node_tree.links
    diffuse = nodes.get("Principled BSDF")
    output = nodes.get("Material Output")
    path = nodes.new("ShaderNodeLightPath")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (1, 1, 1, 1)
    emission.inputs["Strength"].default_value = 64
    mix = nodes.new("ShaderNodeMixShader")
    links.new(path.outputs["Is Camera Ray"], mix.inputs[0])
    links.new(diffuse.outputs["BSDF"], mix.inputs[1])
    links.new(emission.outputs["Emission"], mix.inputs[2])
    links.new(mix.outputs[0], output.inputs["Surface"])


def finish(obj, name, mat="Optical glass", bevel=0):
    obj.name = name
    obj.data.materials.append(bpy.data.materials[mat])
    if bevel:
        modifier = obj.modifiers.new("Polished edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 4
        modifier = obj.modifiers.new("Face normals", "WEIGHTED_NORMAL")
        modifier.keep_sharp = True
    return obj


def sphere(name, pos, size=1, scale=(1, 1, 1), mat="Optical glass"):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=size, location=pos)
    obj = finish(bpy.context.object, name, mat)
    obj.scale = scale
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def ring(name, radius=1.8, thickness=0.18, pos=(0, 0, 0), rotation=(0, 0, 0), mat="Optical glass"):
    bpy.ops.mesh.primitive_torus_add(major_segments=96, minor_segments=20,
                                    location=pos, major_radius=radius, minor_radius=thickness,
                                    rotation=rotation)
    obj = finish(bpy.context.object, name, mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def block(name, pos, size, rotation=(0, 0, 0), mat="Optical glass", bevel=0.12):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos, rotation=rotation)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, bevel)


def tube(name, points, radius=0.13, mat="Optical glass", cyclic=False):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 2
    curve.bevel_depth = radius
    curve.bevel_resolution = 5
    curve.use_fill_caps = True
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for vertex, pos in zip(spline.points, points):
        vertex.co = (*pos, 1)
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(bpy.data.materials[mat])
    return obj


def outline(name, points, z, depth):
    count = len(points)
    verts = [(x, y, z + height) for height in (-depth / 2, depth / 2) for x, y in points]
    faces = [tuple(reversed(range(count))), tuple(range(count, count * 2))]
    faces += [(i, (i + 1) % count, (i + 1) % count + count, i + count) for i in range(count)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, bevel=0.1)


def sculpture(name):
    if name == "bronzed-solar":
        sphere("Ceramic lens", (0, 0, 0.25), 1.22, (1, 1, 0.35), mat="White ceramic")
        ring("Outer dial", 1.75, 0.17, pos=(0, 0, 0.16))
        for i in range(12):
            a = i * math.tau / 12
            block(f"Radial prism {i:02}", (2.16 * math.cos(a), 2.16 * math.sin(a), 0.14),
                  (0.54, 0.12, 0.36), (0, 0, a), mat="Brushed bronze", bevel=0.045)
        ring("Bronze index", 1.39, 0.065, pos=(0, 0, 0.5), mat="Brushed bronze")
    elif name == "stellar-orbit":
        ring("First orbit", 2.05, 0.13, rotation=(0.72, 0.12, -0.2), mat="Brushed silver")
        ring("Second orbit", 1.72, 0.2, rotation=(-0.7, 0.5, 0.8), mat="Lilac ceramic")
        ring("Inner meridian", 1.24, 0.07, rotation=(1.1, -0.5, 0.1), mat="Silver")
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.88)
        finish(bpy.context.object, "Central crystal", bevel=0.025)
        sphere("Satellite", (1.88, 0.5, 0.45), 0.29, mat="Lilac ceramic")
    elif name == "bronzed-uv":
        for i in range(7):
            block(f"Refractive band {i}", ((i - 3) * 0.56, 0, 0.0 + i * 0.055),
                  (0.38, 1.05 + i * 0.32, 0.4 + i * 0.16), (0, 0.08, 0), bevel=0.075)
        tube("Baseline", [(-2.25, -1.9, -0.1), (2.25, -1.9, -0.1)], 0.035, "Silver")
    elif name == "bronzed-cloud":
        for i, (x, y, z, size) in enumerate([(-1.08, 0.2, 0.3, 0.96), (0, 0.4, 0.58, 1.24), (1.03, 0, 0.4, 0.88)]):
            sphere(f"Atmospheric lens {i}", (x, y, z), size, (1, 0.88, 0.64))
        ring("Weather disc", 1.63, 0.1, pos=(0, -0.12, -0.65))
        for i in range(3):
            sphere(f"Suspended droplet {i}", ((i - 1) * 0.65, -1.25, -0.52), 0.13)
    elif name == "bronzed-spf":
        points = [(-1.5, 1.5), (-1.5, -0.45), (-1.0, -1.35), (0, -2.0), (1.0, -1.35), (1.5, -0.45), (1.5, 1.5)]
        outline("Shield lens", points, 0.4, 0.42)
        tube("Fine shield rim", [(x * 0.86, y * 0.86, 0.67) for x, y in points], 0.027, "Silver", True)
        outline("Offset refractive shield", [(x * 0.82 + 0.17, y * 0.82 + 0.12) for x, y in points], -0.2, 0.28)
    elif name == "stellar-369":
        for group, (count, radius, height) in enumerate([(3, 0.72, 0.5), (6, 1.38, 0.16), (9, 2.06, -0.15)]):
            ring(f"Ritual ring {count}", radius, 0.075, pos=(0, 0, height))
            for i in range(count):
                angle = math.tau * i / count + group * 0.2
                sphere(f"Marker {count}.{i}", (radius * math.cos(angle), radius * math.sin(angle), height), 0.15)
        sphere("Quiet center", (0, 0, 0.62), 0.26, mat="Silver")
    elif name == "stellar-affirmation":
        points = []
        for i in range(193):
            a = math.tau * i / 192
            points.append((2 * math.cos(a) / (1 + math.sin(a) ** 2),
                           2 * math.sin(a) * math.cos(a) / (1 + math.sin(a) ** 2),
                           0.55 * math.sin(a)))
        tube("Continuous intention", points, 0.28, cyclic=True)
        sphere("Focus bead", (1.88, 0.1, 0.8), 0.24, mat="Silver")
    elif name == "stellar-vision":
        for i in range(3):
            size = 1.4 - i * 0.14
            points = [(-size, -size, 0), (size, -size, 0), (size, size, 0), (-size, size, 0)]
            obj = tube(f"Perspective frame {i}", points, 0.14, cyclic=True)
            obj.location = ((i - 1) * 0.45, (i - 1) * 0.25, (i - 1) * 0.48)
            obj.rotation_euler.z = (i - 1) * 0.17
        sphere("Possibility", (0.05, 0.03, 0.15), 0.58, (1, 1, 0.85))
    elif name == "artemis":
        points = []
        for i in range(121):
            a = math.radians(35 + 275 * i / 120)
            points.append((1.9 * math.cos(a), 1.9 * math.sin(a), 0.38 * math.sin(a * 2)))
        tube("Open form", points, 0.36, mat="Satin graphite")
        sphere("Detached mass", (1.32, -0.22, 0.8), 0.53, mat="Brushed silver")
        ring("Fine interior", 0.92, 0.045, rotation=(0.45, 0.25, 0.2), mat="Silver")
    elif name == "atlas":
        for i in range(4):
            block(f"Suspended volume {i}", ((i - 1.5) * 0.22, (i - 1.5) * 0.12, (i - 1.5) * 0.54),
                  (2.85 - i * 0.16, 2.25 - i * 0.12, 0.34), (0, 0, (i - 1.5) * 0.16),
                  mat="Brushed silver" if i % 2 else "Satin graphite", bevel=0.15)
        sphere("Counterweight", (1.58, 1.05, 0.58), 0.32, mat="Silver")


def point_at(obj, target=(0, 0, 0)):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


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
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 100
    scene.render.dither_intensity = 0
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.exposure = 1.3
    scene.world = bpy.data.worlds.new("White studio")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.8
    material("Optical glass", transmission=1)
    material("Silver", metallic=1, roughness=0.18, color=(0.72, 0.74, 0.76))
    material("Brushed silver", metallic=0.9, roughness=0.3, color=(0.68, 0.71, 0.75))
    material("Brushed bronze", metallic=0.85, roughness=0.32, color=(0.45, 0.27, 0.13))
    material("White ceramic", roughness=0.3, color=(0.84, 0.86, 0.89))
    material("Lilac ceramic", metallic=0.18, roughness=0.28, color=(0.5, 0.44, 0.69))
    material("Satin graphite", metallic=0.35, roughness=0.32, color=(0.065, 0.075, 0.09))
    material("White", roughness=0.65)
    seamless_floor()
    material("Flag", roughness=0.8, color=(0.012, 0.012, 0.012))
    sculpture(name)
    if name in ("bronzed-solar", "stellar-orbit"):
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.convert(target="MESH")
        model = "bronzed-crystal" if name == "bronzed-solar" else "stellar-crystal"
        bpy.ops.export_scene.gltf(filepath=str(MODELS / f"{model}.glb"),
                                 export_format="GLB", use_selection=True,
                                 export_apply=True, export_yup=False,
                                 export_cameras=False, export_lights=False)
    floor = -2.4 if name == "stellar-orbit" else -1.38
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, floor))
    finish(bpy.context.object, "White cyclorama", "White")
    for label, location, scale in [
        ("Left reflection", (-5, 0, 3), (2.4, 4, 1)),
        ("Right reflection", (4.5, 2, 3), (1.1, 4, 1)),
    ]:
        bpy.ops.mesh.primitive_plane_add(size=2, location=location)
        obj = finish(bpy.context.object, label, "Flag")
        obj.scale = scale
        point_at(obj)
        obj.visible_camera = False
    for label, location, energy, size in [
        ("Key", (-4, -2, 8), 1100, 5),
        ("Rim", (5, 4, 6), 1600, 3),
        ("Fill", (1, -6, 4), 500, 4),
    ]:
        light = bpy.data.lights.new(label, "AREA")
        light.energy, light.shape, light.size = energy, "DISK", size
        obj = bpy.data.objects.new(label, light)
        scene.collection.objects.link(obj)
        obj.location = location
        point_at(obj)
    camera = bpy.data.cameras.new("Editorial camera")
    obj = bpy.data.objects.new("Editorial camera", camera)
    scene.collection.objects.link(obj)
    obj.location = (4.2, -6.2, 15)
    point_at(obj)
    camera.type, camera.ortho_scale = "ORTHO", 6.6
    scene.camera = obj
    scene.render.filepath = str(POSTERS / f"{name}.webp")
    scene["art_direction"] = "White studio; optical glass, satin ceramics and brushed metals; abstract sculptural illustration."
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / f"{name}.blend"))
    bpy.ops.render.render(write_still=True)
    print(json.dumps({"name": name, "poster": scene.render.filepath, "blender": bpy.app.version_string}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", choices=NAMES, nargs="+")
    parser.add_argument("--samples", type=int, default=48)
    parser.add_argument("--size", type=int, default=1200)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    for directory in (POSTERS, OUTPUT, MODELS):
        directory.mkdir(parents=True, exist_ok=True)
    for name in (args.only if args.only else NAMES):
        build(name, args.samples, args.size)
