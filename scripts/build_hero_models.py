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


def star_prism(
    name: str,
    location: tuple[float, float, float],
    outer_radius: float,
    inner_radius: float,
    depth: float,
    points: int,
    mat: bpy.types.Material,
    target: bpy.types.Collection,
    *,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    parent: bpy.types.Object | None = None,
) -> bpy.types.Object:
    perimeter = points * 2
    vertices: list[tuple[float, float, float]] = []
    for y in (-depth / 2, depth / 2):
        for index in range(perimeter):
            angle = math.pi / 2 - index * math.pi / points
            radius = outer_radius if index % 2 == 0 else inner_radius
            vertices.append((math.cos(angle) * radius, y, math.sin(angle) * radius))

    front = list(range(perimeter))
    back = list(reversed(range(perimeter, perimeter * 2)))
    sides = [
        (index, (index + 1) % perimeter, (index + 1) % perimeter + perimeter, index + perimeter)
        for index in range(perimeter)
    ]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], [front, back, *sides])
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    target.objects.link(obj)
    bevel = obj.modifiers.new("MachinedEdge", "BEVEL")
    bevel.width = min(0.055, depth * 0.22)
    bevel.segments = 4
    bevel.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
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
    root = empty("BronzedSolarDial", target)
    base = empty("SolarBase", target, root)
    rounded_box("SolarPlinth", (0, 0.24, -1.82), (4.55, 1.18, 0.5), 0.19, mats["ceramic_white"], target, parent=base, bevel_segments=7)
    rounded_box("SolarPlinthInset", (0, -0.38, -1.73), (3.52, 0.12, 0.12), 0.04, mats["graphite"], target, parent=base)
    rounded_box("SolarAxle", (0, 0.13, 0.22), (3.65, 0.3, 0.3), 0.09, mats["silver"], target, parent=base)

    for side in (-1, 1):
        x = side * 1.62
        rounded_box(
            f"SolarSupport_{'L' if side < 0 else 'R'}",
            (x, 0.14, -0.82),
            (0.27, 0.46, 1.86),
            0.1,
            mats["graphite_soft"],
            target,
            parent=base,
        )
        cylinder(
            f"SolarBearing_{'L' if side < 0 else 'R'}",
            (x, -0.1, 0.22),
            0.25,
            0.23,
            mats["graphite"],
            target,
            rotation=(math.pi / 2, 0, 0),
            parent=base,
            vertices=48,
        )
        cylinder(
            f"SolarBearingPin_{'L' if side < 0 else 'R'}",
            (x, -0.25, 0.22),
            0.105,
            0.12,
            mats["silver"],
            target,
            rotation=(math.pi / 2, 0, 0),
            parent=base,
            vertices=32,
        )

    center = (0, -0.22, 0.24)
    core = empty("SolarCore", target, root)
    core.location = center
    cylinder("SolarCeramicCore", (0, 0, 0), 0.9, 0.38, mats["ceramic_white"], target, rotation=(math.pi / 2, 0, 0), parent=core, vertices=96)
    cylinder("SolarHub", (0, -0.23, 0), 0.28, 0.12, mats["silver"], target, rotation=(math.pi / 2, 0, 0), parent=core, vertices=64)
    cylinder("SolarHubCap", (0, -0.31, 0), 0.12, 0.06, mats["graphite"], target, rotation=(math.pi / 2, 0, 0), parent=core, vertices=48)

    corona = empty("SolarCorona", target, root)
    corona.location = center
    for index in range(12):
        angle = index * math.tau / 12
        ray_distance = 1.37
        x = math.cos(angle) * ray_distance
        z = math.sin(angle) * ray_distance
        rounded_box(
            f"SolarRay_{index + 1:02d}",
            (x, 0.03, z),
            (0.78, 0.24, 0.23),
            0.075,
            mats["ceramic_white"],
            target,
            rotation=(0, -angle, 0),
            parent=corona,
            bevel_segments=5,
        )
        cylinder(
            f"SolarRayJoint_{index + 1:02d}",
            (math.cos(angle) * 1.02, -0.09, math.sin(angle) * 1.02),
            0.085,
            0.14,
            mats["silver"],
            target,
            rotation=(math.pi / 2, 0, 0),
            parent=corona,
            vertices=32,
        )

    orbit = empty("SolarOrbit", target, root)
    orbit.location = center
    torus("SolarCalibrationOrbit", (0, 0.08, 0), 2.02, 0.035, mats["orange"], target, parent=orbit)
    for index in range(4):
        angle = math.radians(18 + index * 90)
        sphere(
            f"SolarOrbitNode_{index + 1:02d}",
            (math.cos(angle) * 2.02, -0.02, math.sin(angle) * 2.02),
            0.075,
            mats["silver"],
            target,
            parent=orbit,
            segments=20,
        )

    gnomon = empty("SolarGnomon", target, root)
    gnomon.location = center
    gnomon.rotation_euler.y = math.radians(-18)
    rounded_box("SolarPointer", (0.72, -0.36, 0), (1.48, 0.12, 0.11), 0.04, mats["orange"], target, parent=gnomon)
    cylinder("SolarPointerPivot", (0, -0.38, 0), 0.16, 0.08, mats["graphite"], target, rotation=(math.pi / 2, 0, 0), parent=gnomon, vertices=48)

    root.rotation_euler = (math.radians(-2), math.radians(-5), math.radians(-1))
    return root


def build_stellar(target: bpy.types.Collection, mats: dict[str, bpy.types.Material]) -> bpy.types.Object:
    root = empty("StellarStarCompass", target)
    base = empty("StarBase", target, root)
    rounded_box("StarPlinth", (0, 0.24, -1.82), (4.45, 1.14, 0.5), 0.19, mats["ceramic_white"], target, parent=base, bevel_segments=7)
    rounded_box("StarPlinthInset", (0, -0.37, -1.73), (3.4, 0.12, 0.12), 0.04, mats["graphite"], target, parent=base)
    rounded_box("StarAxle", (0, 0.13, 0.22), (3.55, 0.28, 0.28), 0.085, mats["silver"], target, parent=base)

    for side in (-1, 1):
        x = side * 1.58
        rounded_box(
            f"StarSupport_{'L' if side < 0 else 'R'}",
            (x, 0.14, -0.82),
            (0.27, 0.44, 1.86),
            0.1,
            mats["graphite_soft"],
            target,
            parent=base,
        )
        cylinder(
            f"StarBearing_{'L' if side < 0 else 'R'}",
            (x, -0.1, 0.22),
            0.24,
            0.23,
            mats["graphite"],
            target,
            rotation=(math.pi / 2, 0, 0),
            parent=base,
            vertices=48,
        )
        cylinder(
            f"StarBearingPin_{'L' if side < 0 else 'R'}",
            (x, -0.25, 0.22),
            0.1,
            0.12,
            mats["silver"],
            target,
            rotation=(math.pi / 2, 0, 0),
            parent=base,
            vertices=32,
        )

    center = (0, -0.22, 0.24)
    star = empty("StarCore", target, root)
    star.location = center
    star_prism("StarGraphiteBody", (0, 0, 0), 1.26, 0.53, 0.38, 8, mats["graphite_soft"], target, parent=star)
    star_prism("StarCeramicFacet", (0, -0.24, 0), 0.5, 0.22, 0.1, 8, mats["ceramic_white"], target, rotation=(0, math.radians(22.5), 0), parent=star)
    cylinder("StarPivot", (0, -0.32, 0), 0.16, 0.09, mats["graphite"], target, rotation=(math.pi / 2, 0, 0), parent=star, vertices=48)

    orbit = empty("StarOrbit", target, root)
    orbit.location = center
    torus("StarCompassRing", (0, 0.1, 0), 1.68, 0.055, mats["silver"], target, parent=orbit)
    torus("StarLilacOrbit", (0, -0.06, 0), 1.92, 0.028, mats["lavender"], target, parent=orbit)
    node_specs = [
        ("StarNode03", math.radians(24)),
        ("StarNode06", math.radians(144)),
        ("StarNode09", math.radians(264)),
    ]
    for name, angle in node_specs:
        x = math.cos(angle) * 1.92
        z = math.sin(angle) * 1.92
        sphere(name, (x, -0.16, z), 0.105, mats["silver"], target, parent=orbit, segments=24)
        rounded_box(
            f"{name}Mount",
            (math.cos(angle) * 1.78, 0.02, math.sin(angle) * 1.78),
            (0.3, 0.12, 0.08),
            0.03,
            mats["graphite"],
            target,
            rotation=(0, -angle, 0),
            parent=orbit,
        )

    for index in range(12):
        angle = index * math.tau / 12
        sphere(
            f"StarCalibrationPin_{index + 1:02d}",
            (math.cos(angle) * 1.5, 0.0, math.sin(angle) * 1.5),
            0.035,
            mats["lavender"] if index in (2, 5, 8) else mats["graphite_soft"],
            target,
            parent=orbit,
            segments=16,
        )

    counterweight = empty("StarCounterweight", target, root)
    counterweight.location = (0, -0.22, -1.28)
    rounded_box("StarCounterweightStem", (0, 0.05, 0.37), (0.11, 0.11, 0.7), 0.04, mats["silver"], target, parent=counterweight)
    sphere("StarCounterweightMass", (0, 0, 0), 0.22, mats["graphite"], target, parent=counterweight, segments=32)

    root.rotation_euler = (math.radians(-2), math.radians(4), math.radians(-1))
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
        "lens": material("SensorLens", (0.06, 0.09, 0.12, 1), roughness=0.08, metallic=0.08, transmission=0.32, ior=1.52),
        "graphite": material("Graphite", (0.035, 0.05, 0.065, 1), metallic=0.62, roughness=0.2),
        "graphite_soft": material("GraphiteSoft", (0.11, 0.14, 0.17, 1), metallic=0.25, roughness=0.32),
        "silver": material("BrushedSilver", (0.56, 0.62, 0.67, 1), metallic=0.72, roughness=0.2),
        "ceramic_white": material("CoolWhiteCeramic", (0.91, 0.94, 0.97, 1), roughness=0.28),
        "orange": material("BronzedSignal", (0.89, 0.18, 0.035, 1), roughness=0.18, emission=(0.89, 0.18, 0.035, 1), emission_strength=1.5),
        "lavender": material("StellarFilament", (0.48, 0.42, 0.9, 1), roughness=0.2, emission=(0.48, 0.42, 0.9, 1), emission_strength=0.55),
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
