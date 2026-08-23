import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.materials, bpy.data.curves, bpy.data.meshes, bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def collection(name: str) -> bpy.types.Collection:
    value = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(value)
    return value


def move_to_collection(obj: bpy.types.Object, target: bpy.types.Collection) -> None:
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    target.objects.link(obj)


def material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    metallic: float = 0.0,
    roughness: float = 0.2,
    transmission: float = 0.0,
    ior: float = 1.45,
    emission: tuple[float, float, float, float] | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    value = bpy.data.materials.new(name)
    value.use_nodes = True
    value.diffuse_color = color
    bsdf = value.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    transmission_socket = bsdf.inputs.get("Transmission Weight") or bsdf.inputs.get("Transmission")
    if transmission_socket:
        transmission_socket.default_value = transmission
    if transmission > 0:
        value.surface_render_method = "BLENDED"
        value.use_raytrace_refraction = True
        value.use_screen_refraction = True
    if bsdf.inputs.get("IOR"):
        bsdf.inputs["IOR"].default_value = ior
    if emission and bsdf.inputs.get("Emission Color"):
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return value


def parent_to(obj: bpy.types.Object, parent: bpy.types.Object | None) -> bpy.types.Object:
    if parent:
        obj.parent = parent
    return obj


def empty(name: str, target: bpy.types.Collection, parent: bpy.types.Object | None = None) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    target.objects.link(obj)
    return parent_to(obj, parent)


def rounded_box(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    bevel: float,
    mat: bpy.types.Material,
    target: bpy.types.Collection,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    parent: bpy.types.Object | None = None,
    bevel_segments: int = 5,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new("PrecisionBevel", "BEVEL")
    modifier.width = min(bevel, min(dimensions) * 0.45)
    modifier.segments = bevel_segments
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.append(mat)
    move_to_collection(obj, target)
    return parent_to(obj, parent)


def cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    mat: bpy.types.Material,
    target: bpy.types.Collection,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    parent: bpy.types.Object | None = None,
    vertices: int = 64,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new("EdgeBevel", "BEVEL")
    bevel.width = min(0.035, depth * 0.18)
    bevel.segments = 3
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.data.materials.append(mat)
    move_to_collection(obj, target)
    return parent_to(obj, parent)


def sphere(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    mat: bpy.types.Material,
    target: bpy.types.Collection,
    *,
    parent: bpy.types.Object | None = None,
    segments: int = 32,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=max(12, segments // 2), radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.append(mat)
    move_to_collection(obj, target)
    return parent_to(obj, parent)


def torus(
    name: str,
    location: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    mat: bpy.types.Material,
    target: bpy.types.Collection,
    *,
    rotation: tuple[float, float, float] = (math.pi / 2, 0.0, 0.0),
    parent: bpy.types.Object | None = None,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=96,
        minor_segments=16,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.append(mat)
    move_to_collection(obj, target)
    return parent_to(obj, parent)


def tube(
    name: str,
    points: list[tuple[float, float, float]],
    radius: float,
    mat: bpy.types.Material,
    target: bpy.types.Collection,
    *,
    parent: bpy.types.Object | None = None,
) -> bpy.types.Object:
    curve_data = bpy.data.curves.new(name, "CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 18
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = 5
    spline = curve_data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve_data)
    target.objects.link(obj)
    curve_data.materials.append(mat)
    return parent_to(obj, parent)


def wedge(
    name: str,
    center: tuple[float, float, float],
    size: float,
    angle: float,
    mat: bpy.types.Material,
    target: bpy.types.Collection,
    parent: bpy.types.Object,
) -> bpy.types.Object:
    cx, cy, cz = center
    local = [(0.0, -0.02, 0.0), (size, -0.02, size * 0.34), (size, -0.02, -size * 0.34)]
    vertices = []
    for x, y, z in local:
        rotated_x = math.cos(angle) * x + math.sin(angle) * z
        rotated_z = -math.sin(angle) * x + math.cos(angle) * z
        vertices.append((cx + rotated_x, cy + y, cz + rotated_z))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], [(0, 1, 2)])
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    target.objects.link(obj)
    return parent_to(obj, parent)


def build_snake(target: bpy.types.Collection, mats: dict[str, bpy.types.Material]) -> bpy.types.Object:
    root = empty("CammRoboticSnake", target)
    body = empty("SnakeBody", target, root)
    modules = [
        ("SnakeTop", (0.0, 0.0, 1.72), (3.55, 0.66, 0.72)),
        ("SnakeBackbone", (-1.58, 0.0, 0.05), (0.82, 0.68, 2.72)),
        ("SnakeShelf", (-0.35, 0.0, 0.16), (2.35, 0.64, 0.7)),
        ("SnakeBottom", (0.0, 0.0, -1.58), (3.55, 0.66, 0.72)),
        ("SnakeHead", (2.02, -0.01, 0.92), (1.12, 0.74, 0.78)),
        ("SnakeTail", (2.02, 0.0, -0.87), (1.06, 0.68, 0.7)),
    ]
    for name, location, dimensions in modules:
        rounded_box(name, location, dimensions, 0.16, mats["glass"], target, parent=body, bevel_segments=7)

    rail_specs = [
        ("RailTop", (0.02, -0.18, 1.72), (2.85, 0.085, 0.1)),
        ("RailLeft", (-1.58, -0.18, 0.08), (0.1, 0.085, 2.05)),
        ("RailShelf", (-0.42, -0.18, 0.16), (1.82, 0.085, 0.1)),
        ("RailBottom", (0.02, -0.18, -1.58), (2.85, 0.085, 0.1)),
    ]
    for name, location, dimensions in rail_specs:
        rounded_box(name, location, dimensions, 0.04, mats["graphite"], target, parent=body, bevel_segments=3)

    joints = [(-1.58, 1.39), (1.57, 1.38), (-1.58, -1.24), (1.55, -1.23)]
    for index, (x, z) in enumerate(joints, start=1):
        cylinder(
            f"ServoJoint_{index:02d}",
            (x, -0.4, z),
            0.19,
            0.16,
            mats["graphite"],
            target,
            rotation=(math.pi / 2, 0.0, 0.0),
            parent=body,
            vertices=48,
        )
        cylinder(
            f"ServoPin_{index:02d}",
            (x, -0.5, z),
            0.082,
            0.21,
            mats["silver"],
            target,
            rotation=(math.pi / 2, 0.0, 0.0),
            parent=body,
            vertices=32,
        )

    eye = empty("SnakeEye", target, root)
    eye.location = (2.04, -0.48, 0.92)
    cylinder("EyeHousing", (0, 0, 0), 0.25, 0.18, mats["silver"], target, rotation=(math.pi / 2, 0, 0), parent=eye)
    cylinder("EyeLens", (0, -0.11, 0), 0.18, 0.13, mats["lens"], target, rotation=(math.pi / 2, 0, 0), parent=eye)
    cylinder("EyePupil", (0, -0.19, 0), 0.075, 0.06, mats["graphite"], target, rotation=(math.pi / 2, 0, 0), parent=eye)
    for index in range(5):
        wedge(f"IrisBlade_{index + 1:02d}", (0, -0.225, 0), 0.13, index * math.tau / 5, mats["graphite"], target, eye)

    for index in range(18):
        angle = index * math.tau / 18
        if index < 5:
            x, z = -1.58, 0.85 - index * 0.42
        elif index < 10:
            x, z = -1.1 + (index - 5) * 0.55, 1.72
        elif index < 15:
            x, z = -1.1 + (index - 10) * 0.55, -1.58
        else:
            x, z = 1.36 + math.cos(angle) * 0.12, 0.92 + math.sin(angle) * 0.12
        sphere(f"Fastener_{index + 1:02d}", (x, -0.39, z), 0.034, mats["silver"], target, parent=body, segments=16)

    root.rotation_euler = (math.radians(-4), math.radians(-8), math.radians(-1))
    return root


def build_bronzed(target: bpy.types.Collection, mats: dict[str, bpy.types.Material]) -> bpy.types.Object:
    root = empty("BronzedHeliostat", target)
    base = empty("HeliostatBase", target, root)
    rounded_box("AzimuthPlinth", (0, 0.18, -1.52), (4.25, 1.18, 0.58), 0.22, mats["ceramic"], target, parent=base, bevel_segments=7)
    rounded_box("AzimuthRecess", (0, -0.44, -1.4), (3.35, 0.12, 0.16), 0.06, mats["graphite"], target, parent=base)
    torus("AzimuthRing", (0.25, 0.08, -0.22), 1.62, 0.12, mats["silver"], target, parent=base)
    torus("AzimuthGlassTrack", (0.25, -0.08, -0.22), 1.37, 0.055, mats["glass"], target, parent=base)

    lens_group = empty("HeliostatLens", target, root)
    lens_group.location = (0.32, -0.22, 0.15)
    lens_group.rotation_euler = (math.radians(-4), math.radians(-13), math.radians(-6))
    cylinder("FresnelLens", (0, 0, 0), 1.17, 0.3, mats["glass"], target, rotation=(math.pi / 2, 0, 0), parent=lens_group, vertices=96)
    torus("LensGimbal", (0, 0, 0), 1.25, 0.095, mats["silver"], target, parent=lens_group)
    for index in range(1, 19):
        torus(f"FresnelGroove_{index:02d}", (0, -0.18, 0), index * 0.058, 0.008, mats["graphite_soft"], target, parent=lens_group)

    for side in (-1, 1):
        x = side * 1.36 + 0.32
        rounded_box(f"GimbalArm_{'L' if side < 0 else 'R'}", (x, 0.02, 0.0), (0.22, 0.42, 2.15), 0.08, mats["silver"], target, parent=root)
        cylinder(f"GimbalBearing_{'L' if side < 0 else 'R'}", (x, -0.28, 0.08), 0.22, 0.22, mats["graphite"], target, rotation=(math.pi / 2, 0, 0), parent=root)

    gnomon = rounded_box("HeliostatGnomon", (0.38, -0.6, 0.58), (0.16, 0.2, 2.45), 0.06, mats["glass"], target, rotation=(0, math.radians(-14), 0), parent=root)
    gnomon.rotation_euler.y = math.radians(-14)

    filters = empty("FilterCarriage", target, root)
    for index in range(4):
        z = 0.95 - index * 0.52
        plate = rounded_box(
            f"Filter_{index + 1}",
            (-2.0 + index * 0.06, -0.25 - index * 0.04, z),
            (0.72, 0.12, 0.38),
            0.08,
            mats["orange_glass"] if index == 3 else mats["glass"],
            target,
            rotation=(0, math.radians(-8), math.radians(-3)),
            parent=filters,
        )
        rounded_box(f"FilterRail_{index + 1}", (-2.48, -0.16, z), (0.42, 0.1, 0.08), 0.03, mats["graphite"], target, parent=filters)
        plate["filter_index"] = index + 1

    for index in range(12):
        angle = index * math.tau / 12
        x = 0.25 + math.cos(angle) * 1.72
        z = -0.22 + math.sin(angle) * 1.72
        rounded_box(
            f"Shutter_{index + 1:02d}",
            (x, -0.25, z),
            (0.16, 0.12, 0.08 if index % 3 else 0.15),
            0.025,
            mats["orange"] if index == 2 else mats["graphite"],
            target,
            rotation=(0, -angle, 0),
            parent=base,
        )

    beam = tube(
        "SolarBeam",
        [(2.7, -0.58, 1.75), (1.5, -0.6, 1.05), (0.38, -0.62, 0.32), (-0.8, -0.64, -1.0)],
        0.045,
        mats["orange"],
        target,
        parent=root,
    )
    beam["signal"] = "uv-path"
    root.rotation_euler = (math.radians(-3), math.radians(-6), math.radians(-2))
    return root


def build_stellar(target: bpy.types.Collection, mats: dict[str, bpy.types.Material]) -> bpy.types.Object:
    root = empty("StellarRitualLoom", target)
    leaves = [
        ("LoomLeafMorning", math.radians(90), 3),
        ("LoomLeafAfternoon", math.radians(210), 6),
        ("LoomLeafEvening", math.radians(330), 9),
    ]
    for leaf_index, (name, angle, count) in enumerate(leaves):
        center_x = math.cos(angle) * 1.28
        center_z = math.sin(angle) * 1.28
        rounded_box(
            f"SpineArm_{leaf_index + 1}",
            (math.cos(angle) * 0.88, 0.22, math.sin(angle) * 0.88),
            (1.75, 0.14, 0.15),
            0.055,
            mats["silver"],
            target,
            rotation=(0, -angle, 0),
            parent=root,
        )
        leaf = empty(name, target, root)
        leaf.location = (center_x, 0, center_z)
        leaf.rotation_euler.y = -angle
        rounded_box(
            f"{name}Glass",
            (0, 0, 0),
            (2.05, 0.32, 0.9),
            0.26,
            mats["frosted_glass"],
            target,
            parent=leaf,
            bevel_segments=7,
        )
        rounded_box(f"{name}Rail", (0, 0.02, 0), (1.42, 0.08, 0.08), 0.035, mats["silver"], target, parent=leaf)
        hinge_x = math.cos(angle) * 0.28
        hinge_z = math.sin(angle) * 0.28
        cylinder(
            f"Hinge_{leaf_index + 1}",
            (hinge_x, -0.1, hinge_z),
            0.19,
            0.34,
            mats["graphite"],
            target,
            rotation=(math.pi / 2, 0, 0),
            parent=root,
        )
        columns = math.ceil(count / 3)
        for node_index in range(count):
            row = node_index % 3
            column = node_index // 3
            along = -0.52 + (column / max(1, columns - 1)) * 1.04 if columns > 1 else 0
            across = (row - 1) * 0.18
            local_x = along
            local_z = across
            world_x = center_x + math.cos(-angle) * local_x + math.sin(-angle) * local_z
            world_z = center_z - math.sin(-angle) * local_x + math.cos(-angle) * local_z
            sphere(
                f"Node_{count}_{node_index + 1:02d}",
                (world_x, -0.27, world_z),
                0.055 if count < 9 else 0.046,
                mats["lavender"] if node_index % 3 == 0 else mats["silver"],
                target,
                parent=root,
                segments=20,
            )

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=0.54, location=(0, -0.34, 0))
    prism = bpy.context.object
    prism.name = "LoomPrism"
    prism.rotation_euler = (math.radians(18), math.radians(28), math.radians(9))
    prism.data.materials.append(mats["glass"])
    move_to_collection(prism, target)
    prism.parent = root

    for index, (_, angle, _) in enumerate(leaves, start=1):
        tube(
            f"LoomFilament_{index}",
            [
                (math.cos(angle - 0.72) * 0.46, -0.42, math.sin(angle - 0.72) * 0.46),
                (math.cos(angle - 0.26) * 1.42, -0.43, math.sin(angle - 0.26) * 1.42),
                (math.cos(angle) * 2.2, -0.44, math.sin(angle) * 2.2),
                (math.cos(angle + 0.26) * 1.42, -0.43, math.sin(angle + 0.26) * 1.42),
                (math.cos(angle + 0.72) * 0.46, -0.42, math.sin(angle + 0.72) * 0.46),
            ],
            0.04,
            mats["lavender"],
            target,
            parent=root,
        )
    rounded_box("LoomSlider", (1.42, -0.46, -0.82), (0.3, 0.19, 0.2), 0.07, mats["graphite"], target, rotation=(0, math.radians(-24), 0), parent=root)
    root.rotation_euler = (math.radians(-3), math.radians(6), math.radians(-2))
    return root


def setup_world(render_collection: bpy.types.Collection, model: str) -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.transmission_bounces = 6
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.world.color = (0.94, 0.96, 0.98)

    white = material("Backdrop", (0.91, 0.94, 0.96, 1), roughness=0.64)
    rounded_box("Backplate", (0, 1.5, 0), (12, 0.12, 10), 0.04, white, render_collection)
    rounded_box("Ground", (0, 0, -2.55), (12, 10, 0.12), 0.04, white, render_collection)

    camera_data = bpy.data.cameras.new("ApprovedCamera")
    camera = bpy.data.objects.new("ApprovedCamera", camera_data)
    render_collection.objects.link(camera)
    if model == "bronzed":
        camera.location = (5.8, -10.5, 4.7)
        target = Vector((0.0, 0.0, -0.1))
        camera_data.type = "ORTHO"
        camera_data.ortho_scale = 6.6
    else:
        camera.location = (0.2, -11.8, 0.35)
        target = Vector((0.0, 0.0, 0.0))
        camera_data.type = "ORTHO"
        camera_data.ortho_scale = 5.8 if model == "snake" else 6.0
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera

    light_specs = [
        ("KeySoftbox", (4.5, -5.0, 6.0), 1150, 5.0, (1.0, 1.0, 1.0)),
        ("FillSoftbox", (-5.0, -3.0, 2.0), 850, 4.0, (0.86, 0.9, 0.94)),
        ("TopStrip", (0.5, 0.0, 7.0), 980, 3.0, (1.0, 1.0, 1.0)),
        ("GraphiteFlag", (-3.8, -1.5, -1.0), 360, 2.0, (0.28, 0.34, 0.39)),
    ]
    for name, location, energy, size, color in light_specs:
        light_data = bpy.data.lights.new(name, "AREA")
        light_data.energy = energy
        light_data.shape = "RECTANGLE"
        light_data.size = size
        light_data.color = color
        light = bpy.data.objects.new(name, light_data)
        light.location = location
        light.rotation_euler = (target - light.location).to_track_quat("-Z", "Y").to_euler()
        render_collection.objects.link(light)


def export_model(target: bpy.types.Collection, glb: Path) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in target.all_objects:
        obj.hide_render = False
        obj.hide_viewport = False
        obj.select_set(True)
    glb.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(glb.resolve()),
        export_format="GLB",
        collection=target.name,
        use_selection=False,
        export_apply=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_yup=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=("snake", "bronzed", "stellar"), required=True)
    parser.add_argument("--blend", type=Path, required=True)
    parser.add_argument("--glb", type=Path, required=True)
    parser.add_argument("--preview", type=Path, required=True)
    args = parser.parse_args(script_args())

    reset_scene()
    model_collection = collection("EXPORT_MODEL")
    render_collection = collection("RENDER_ONLY")
    mats = {
        "glass": material("OpticalGlass", (0.78, 0.84, 0.88, 1), roughness=0.055, transmission=0.92, ior=1.46),
        "frosted_glass": material("FrostedOpticalGlass", (0.72, 0.79, 0.84, 1), roughness=0.13, transmission=0.72, ior=1.46),
        "lens": material("SensorLens", (0.06, 0.09, 0.12, 1), roughness=0.08, metallic=0.08, transmission=0.32, ior=1.52),
        "graphite": material("Graphite", (0.035, 0.05, 0.065, 1), metallic=0.62, roughness=0.2),
        "graphite_soft": material("GraphiteSoft", (0.11, 0.14, 0.17, 1), metallic=0.25, roughness=0.32),
        "silver": material("BrushedSilver", (0.56, 0.62, 0.67, 1), metallic=0.72, roughness=0.2),
        "ceramic": material("SatinCeramic", (0.82, 0.86, 0.89, 1), roughness=0.25),
        "orange": material("BronzedSignal", (0.89, 0.18, 0.035, 1), roughness=0.18, emission=(0.89, 0.18, 0.035, 1), emission_strength=1.5),
        "orange_glass": material("BronzedFilter", (0.9, 0.32, 0.08, 1), roughness=0.08, transmission=0.8, ior=1.46),
        "lavender": material("StellarFilament", (0.28, 0.32, 0.9, 1), roughness=0.17, emission=(0.28, 0.32, 0.9, 1), emission_strength=0.7),
    }

    if args.model == "snake":
        build_snake(model_collection, mats)
    elif args.model == "bronzed":
        build_bronzed(model_collection, mats)
    else:
        build_stellar(model_collection, mats)

    setup_world(render_collection, args.model)
    export_model(model_collection, args.glb)
    args.preview.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.filepath = str(args.preview.resolve())
    bpy.ops.render.render(write_still=True)
    args.blend.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(args.blend.resolve()))


if __name__ == "__main__":
    main()
