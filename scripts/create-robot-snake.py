"""Build the articulated crystal serpent and its assembly/idle clips in Blender."""

import importlib.util
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output/blender"
spec = importlib.util.spec_from_file_location("studio", ROOT / "scripts/create-crystal.py")
studio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(studio)
PARTS = []
REST = {
    "Top rail": Vector((0, 1.82, 0)),
    "Spine rail": Vector((-1.82, 0, 0)),
    "Lower rail": Vector((0, -1.82, 0)),
    "Center arm": Vector((-0.7, 0, 0)),
    "Optical head": Vector((1.84, 0.92, 0)),
    "Tail terminal": Vector((1.84, -0.97, 0)),
}
JOINTS = {
    "head": Vector((1.39, 1.35, 0)),
    "upper": Vector((-1.39, 1.35, 0)),
    "lower": Vector((-1.39, -1.35, 0)),
    "tail": Vector((1.39, -1.35, 0)),
    "arm": Vector((-1.41, 0, 0)),
}


def parent_part(name, center):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = center
    bpy.context.view_layer.update()
    PARTS.append(obj)
    return obj


def attach(obj, parent, mat):
    obj.data.materials.append(bpy.data.materials[mat])
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj


def bevel(obj, width, segments=3):
    modifier = obj.modifiers.new("Machined radius", "BEVEL")
    modifier.width, modifier.segments = width, segments
    modifier = obj.modifiers.new("Surface normals", "WEIGHTED_NORMAL")
    modifier.keep_sharp = True


def box(name, center, size, parent, mat="Clear optical shell", radius=0.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name, obj.dimensions = name, size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if radius:
        bevel(obj, radius, 4)
    return attach(obj, parent, mat)


def outline(width, height, radius, segments=10):
    points = []
    for cx, cy, start in [(width / 2 - radius, height / 2 - radius, 0),
                          (-width / 2 + radius, height / 2 - radius, 90),
                          (-width / 2 + radius, -height / 2 + radius, 180),
                          (width / 2 - radius, -height / 2 + radius, 270)]:
        for index in range(segments):
            angle = math.radians(start + index * 90 / segments)
            points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return points


def rounded_frame(name, center, size, parent, wall=0.16, radius=0.3, depth=0.58):
    width, height = size
    outer = outline(width, height, radius)
    inner = outline(width - wall * 2, height - wall * 2, max(0.06, radius - wall))
    n = len(outer)
    vertices = [(x + center[0], y + center[1], z + center[2])
                for z in (-depth / 2, depth / 2) for ring in (outer, inner) for x, y in ring]
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces.extend([(i, j, n + j, n + i), (2*n+i, 3*n+i, 3*n+j, 2*n+j),
                      (i, 2*n+i, 2*n+j, j), (n+i, n+j, 3*n+j, 3*n+i)])
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    assert all(e.is_manifold for e in bm.edges)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bevel(obj, 0.028, 3)
    attach(obj, parent, "Clear optical shell")
    # A separate thin window keeps the cavity and its internal hardware visible.
    box(name + " window", (center[0], center[1], center[2] - 0.15),
        (width - 0.29, height - 0.29, 0.028), parent, radius=max(0.02, radius - 0.13))
    curve = bpy.data.curves.new(name + " internal rail", "CURVE")
    curve.dimensions, curve.bevel_depth, curve.bevel_resolution = "3D", 0.018, 3
    path = outline(width - 0.115, height - 0.115, max(0.07, radius - 0.06))
    spline = curve.splines.new("POLY")
    spline.points.add(len(path) - 1)
    for point, (x, y) in zip(spline.points, path):
        point.co = (x + center[0], y + center[1], center[2] + 0.04, 1)
    spline.use_cyclic_u = True
    rail = bpy.data.objects.new(name + " internal rail", curve)
    bpy.context.collection.objects.link(rail)
    attach(rail, parent, "Polished titanium")


def disk(name, center, radius, depth, parent, mat, vertices=40):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=center)
    obj = bpy.context.object
    obj.name = name
    bevel(obj, min(0.018, depth / 4), 2)
    return attach(obj, parent, mat)


def torus(name, center, major, minor, parent, mat):
    bpy.ops.mesh.primitive_torus_add(major_segments=40, minor_segments=10, major_radius=major, minor_radius=minor, location=center)
    obj = bpy.context.object
    obj.name = name
    for p in obj.data.polygons:
        p.use_smooth = True
    return attach(obj, parent, mat)


def screw(center, parent, scale=1):
    x, y, z = center
    disk("Titanium fastener", center, 0.048 * scale, 0.035 * scale, parent, "Polished titanium", 20)
    box("Fastener slot", (x, y, z + 0.02 * scale), (0.045 * scale, 0.012 * scale, 0.006), parent, "Graphite servo", 0.003)


def joint(center, parent):
    x, y, z = center
    disk("Servo casing", (x, y, z), 0.245, 0.3, parent, "Graphite servo")
    torus("Servo outer bearing", (x, y, z + 0.16), 0.192, 0.027, parent, "Polished titanium")
    disk("Servo face", (x, y, z + 0.165), 0.15, 0.035, parent, "Dark brushed alloy")
    torus("Servo inner bearing", (x, y, z + 0.19), 0.101, 0.016, parent, "Polished titanium")
    disk("Servo axle", (x, y, z + 0.19), 0.07, 0.045, parent, "Polished titanium")
    for angle in (45, 225):
        a = math.radians(angle)
        screw((x + math.cos(a) * 0.18, y + math.sin(a) * 0.18, z + 0.17), parent, 0.5)


def build_robot():
    top = parent_part("Top rail", (0, 1.82, 0))
    rounded_frame("Upper crystal channel", (0, 1.82, 0), (3.28, 1.03), top)
    joint((-1.39, 1.35, 0.04), top)
    joint((1.39, 1.35, 0.04), top)
    left = parent_part("Spine rail", (-1.82, 0, 0))
    rounded_frame("Spine crystal channel", (-1.82, 0, 0), (1.03, 3.32), left)
    bottom = parent_part("Lower rail", (0, -1.82, 0))
    rounded_frame("Lower crystal channel", (0, -1.82, 0), (3.28, 1.03), bottom)
    joint((-1.39, -1.35, 0.04), bottom)
    joint((1.39, -1.35, 0.04), bottom)
    arm = parent_part("Center arm", (-0.7, 0, 0))
    rounded_frame("Center crystal arm", (-0.64, 0, 0), (1.84, 0.72), arm, wall=0.1, radius=0.12, depth=0.42)
    for y in (-0.21, 0.21):
        disk("Center arm bearing", (-1.41, y, 0.055), 0.082, 0.08, arm, "Polished titanium")
    head = parent_part("Optical head", (1.84, 0.92, 0))
    rounded_frame("Head crystal enclosure", (1.84, 0.92, 0), (1.08, 1.12), head, wall=0.14, radius=0.31, depth=0.52)
    box("Camera mounting plate", (1.84, 0.92, -0.025), (0.72, 0.76, 0.045), head, "Satin titanium", 0.15)
    for dx, dy in [(-0.31, -0.32), (0.31, -0.32), (-0.31, 0.32), (0.31, 0.32)]:
        screw((1.84 + dx, 0.92 + dy, 0.07), head, 0.75)
    lens = bpy.data.objects.new("Eye focus", None)
    bpy.context.collection.objects.link(lens)
    lens.location = (1.84, 0.92, 0.12)
    bpy.context.view_layer.update()
    lens.parent = head
    lens.matrix_parent_inverse = head.matrix_world.inverted()
    disk("Eye lens housing", (1.84, 0.92, 0.12), 0.269, 0.13, lens, "Graphite servo")
    torus("Eye titanium rim", (1.84, 0.92, 0.19), 0.252, 0.024, lens, "Polished titanium")
    torus("Eye inner rim", (1.84, 0.92, 0.22), 0.191, 0.018, lens, "Dark brushed alloy")
    disk("Eye optical sensor", (1.84, 0.92, 0.215), 0.175, 0.065, lens, "Optical black")
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1, location=(1.84, 0.92, 0.245))
    obj = bpy.context.object
    obj.name, obj.scale = "Eye curved optical glass", (0.165, 0.165, 0.065)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for p in obj.data.polygons:
        p.use_smooth = True
    attach(obj, lens, "Lens glass")
    tail = parent_part("Tail terminal", (1.84, -0.97, 0))
    rounded_frame("Tail crystal enclosure", (1.84, -0.97, 0), (1.02, 1.12), tail, wall=0.14, radius=0.3)
    for y in (-1.27, -0.67):
        box("Tail internal brace", (1.84, y, -0.045), (0.58, 0.035, 0.055), tail, "Polished titanium", 0.01)
    for x in (-0.94, 0.94):
        screw((x, 1.44, 0.06), top, 0.7)
        screw((x, -1.44, 0.06), bottom, 0.7)
    return lens


def record(obj, location, rotation, frame):
    obj.location, obj.rotation_euler = location, rotation
    obj.keyframe_insert(data_path="location", frame=frame)
    obj.keyframe_insert(data_path="rotation_euler", frame=frame)


def store_track(obj, name):
    action = obj.animation_data.action
    action.name = obj.name + " " + name
    track = obj.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, 1, action)
    strip.blend_type = "REPLACE"
    obj.animation_data.action = None


def chain_pose(angles, arm_fold=0):
    rotations = {name: Matrix.Rotation(angle, 3, "Z") for name, angle in angles.items()}
    locations = {"Optical head": REST["Optical head"].copy()}
    current = locations["Optical head"] + rotations["Optical head"] @ (JOINTS["head"] - REST["Optical head"])
    for name, start, end in [("Top rail", "head", "upper"),
                             ("Spine rail", "upper", "lower"),
                             ("Lower rail", "lower", "tail")]:
        locations[name] = current - rotations[name] @ (JOINTS[start] - REST[name])
        current += rotations[name] @ (JOINTS[end] - JOINTS[start])
    locations["Tail terminal"] = current - rotations["Tail terminal"] @ (JOINTS["tail"] - REST["Tail terminal"])
    arm_anchor = locations["Spine rail"] + rotations["Spine rail"] @ (JOINTS["arm"] - REST["Spine rail"])
    angles["Center arm"] = angles["Spine rail"] + arm_fold
    arm_rotation = Matrix.Rotation(angles["Center arm"], 3, "Z")
    locations["Center arm"] = arm_anchor - arm_rotation @ (JOINTS["arm"] - REST["Center arm"])
    return {name: (locations[name], (0, 0, angles[name])) for name in REST}


def assembly_pose(frame):
    time = (frame - 1) / 24
    progress = max(0, min(1, (time - 2) / 3))
    progress = progress * progress * (3 - 2 * progress)
    remain = 1 - progress
    phase = time * math.tau * 0.62
    angles = {
        "Optical head": 0.028 * math.sin(phase) * remain,
        "Top rail": 0.075 * math.sin(phase + 0.4) * remain,
        "Spine rail": (-math.pi / 2 + 0.1 * math.sin(phase + 1.1)) * remain,
        "Lower rail": (-math.pi + 0.12 * math.sin(phase + 1.8)) * remain,
        "Tail terminal": (-math.pi + 0.15 * math.sin(phase + 2.5)) * remain,
    }
    return chain_pose(angles, math.pi / 2 * remain)


def idle_pose(frame):
    wave = math.sin((frame - 1) / 192 * math.tau)
    return chain_pose({"Optical head": wave * 0.008, "Top rail": wave * 0.006,
                       "Spine rail": wave * 0.008, "Lower rail": wave * 0.007,
                       "Tail terminal": wave * 0.012})


def animate(lens):
    for obj in PARTS:
        for frame in range(1, 122):
            position, rotation = assembly_pose(frame)[obj.name]
            record(obj, position, rotation, frame)
        store_track(obj, "Assemble")
        for frame in range(1, 194):
            position, rotation = idle_pose(frame)[obj.name]
            record(obj, position, rotation, frame)
        store_track(obj, "Idle")
    rest = lens.location.copy()
    for frame in range(1, 194):
        wave = math.sin((frame - 1) / 192 * math.tau)
        record(lens, rest + Vector((0, 0, wave * 0.012)), (wave * 0.025, wave * 0.045, 0), frame)
    store_track(lens, "Idle")


def isolate_clip(name, lens):
    for obj in PARTS + [lens]:
        for track in obj.animation_data.nla_tracks:
            track.mute = name is not None and track.name != name


def verify_anchors(lens):
    pairs = [("Optical head", "Top rail", "head"),
             ("Top rail", "Spine rail", "upper"),
             ("Spine rail", "Lower rail", "lower"),
             ("Lower rail", "Tail terminal", "tail"),
             ("Spine rail", "Center arm", "arm")]
    maximum = 0
    for clip, last in [("Assemble", 121), ("Idle", 193)]:
        isolate_clip(clip, lens)
        for frame in range(1, last + 1):
            bpy.context.scene.frame_set(frame)
            for a, b, anchor in pairs:
                first = bpy.data.objects[a].matrix_world @ (JOINTS[anchor] - REST[a])
                second = bpy.data.objects[b].matrix_world @ (JOINTS[anchor] - REST[b])
                gap = (first - second).length
                maximum = max(maximum, gap)
                assert gap < 0.00002, (clip, frame, anchor, gap)
    isolate_clip(None, lens)
    bpy.context.scene.frame_set(1)
    print(json.dumps({"verified_frames": 314, "joint_pairs": 5, "maximum_anchor_gap": maximum}))


def animation_only():
    bpy.ops.wm.open_mainfile(filepath=str(OUTPUT / "robot-snake.blend"))
    scene = bpy.context.scene
    PARTS[:] = [bpy.data.objects[name] for name in REST]
    lens = bpy.data.objects["Eye focus"]
    for obj in PARTS + [lens]:
        obj.animation_data_clear()
        obj.rotation_euler = (0, 0, 0)
        obj.location = REST[obj.name] if obj.name in REST else Vector((1.84, 0.92, 0.12))
    animate(lens)
    verify_anchors(lens)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in scene.objects:
        ancestor = obj
        while ancestor:
            if ancestor in PARTS:
                obj.select_set(True)
                break
            ancestor = ancestor.parent
    temporary = ROOT / "public/models/camm-crystal.next.glb"
    bpy.ops.export_scene.gltf(filepath=str(temporary), export_format="GLB", use_selection=True,
                             export_yup=False, export_animations=True, export_animation_mode="NLA_TRACKS",
                             export_anim_slide_to_zero=True, export_merge_animation="NLA_TRACK",
                             export_cameras=False, export_lights=False)
    temporary.replace(ROOT / "public/models/camm-crystal.glb")
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "robot-snake.blend"))
    isolate_clip("Assemble", lens)
    scene.render.resolution_percentage, scene.cycles.samples = 75, 32
    for frame, scale, center in [(1, 12, (-2.5, 1.1, 0)), (73, 9, (-1.3, -0.3, 0)),
                                  (97, 7, (-0.5, -0.3, 0))]:
        scene.frame_set(frame)
        scene.camera.data.ortho_scale = scale
        scene.camera.location = Vector(center) + Vector((0, -2.6, 17))
        studio.point_at(scene.camera, center)
        scene.render.filepath = str(OUTPUT / f"robot-connected-{frame}.webp")
        bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.name = "Crystal robotic serpent"
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == "METAL"
    scene.cycles.device, scene.cycles.samples, scene.cycles.use_denoising = "GPU", 64, True
    scene.cycles.max_bounces, scene.cycles.transmission_bounces = 16, 12
    scene.render.resolution_x = scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format, scene.render.image_settings.quality = "WEBP", 96
    scene.render.dither_intensity = 0
    scene.render.image_settings.quality = 100
    scene.render.fps, scene.frame_start, scene.frame_end = 24, 1, 193
    scene.view_settings.view_transform, scene.view_settings.exposure = "AgX", 1.2
    scene.world = bpy.data.worlds.new("Neutral optical studio")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.65
    for name, color, rough, transmission, metallic in [
        ("Clear optical shell", (1, 1, 1), 0.027, 1, 0),
        ("Lens glass", (1, 1, 1), 0.018, 1, 0),
        ("Polished titanium", (0.42, 0.44, 0.46), 0.18, 0, 0.93),
        ("Satin titanium", (0.7, 0.71, 0.72), 0.29, 0, 0.9),
        ("Graphite servo", (0.044, 0.05, 0.056), 0.22, 0, 0.88),
        ("Dark brushed alloy", (0.12, 0.14, 0.16), 0.22, 0, 0.9),
        ("Optical black", (0.012, 0.016, 0.021), 0.11, 0, 0.25),
    ]:
        mat = studio.material(name, color, rough, transmission)
        mat.node_tree.nodes.get("Principled BSDF").inputs["Metallic"].default_value = metallic
    lens = build_robot()
    # Apply export topology before object animation to keep render and web geometry equal.
    bpy.ops.object.select_all(action="DESELECT")
    for obj in list(bpy.context.scene.objects):
        if obj.type in ("MESH", "CURVE"):
            obj.select_set(True)
    bpy.context.view_layer.objects.active = next(o for o in bpy.context.scene.objects if o.type == "MESH")
    bpy.ops.object.convert(target="MESH")
    groups = {}
    for obj in list(bpy.context.scene.objects):
        if obj.type == "MESH":
            groups.setdefault((obj.parent.name, obj.data.materials[0].name), []).append(obj)
    for (parent_name, material_name), objects in groups.items():
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        bpy.ops.object.join()
        objects[0].name = parent_name + " / " + material_name
    animate(lens)
    scene.frame_set(1)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(ROOT / "public/models/camm-crystal.glb"), export_format="GLB",
                             use_selection=True, export_yup=False, export_animations=True,
                             export_animation_mode="NLA_TRACKS", export_anim_slide_to_zero=True,
                             export_merge_animation="NLA_TRACK", export_cameras=False, export_lights=False)
    floor = studio.material("Camera-white floor", (1, 1, 1), 0.65)
    studio.camera_white_floor(floor)
    secondary = floor.node_tree.nodes.new("ShaderNodeEmission")
    secondary.inputs["Color"].default_value = (1, 1, 1, 1)
    secondary.inputs["Strength"].default_value = 4
    mix = next(node for node in floor.node_tree.nodes if node.type == "MIX_SHADER")
    floor.node_tree.links.new(secondary.outputs[0], mix.inputs[1])
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.6))
    bpy.context.object.data.materials.append(floor)
    flags = studio.material("Black studio flags", (0.006, 0.006, 0.006), 0.7)
    studio.panel("Left long reflection", (-4, -1, 3), (2.1, 4, 1), flags)
    studio.panel("Right narrow reflection", (4, 2, 3), (0.9, 4, 1), flags)
    studio.panel("Overhead reflection", (0, 0, 6), (3, 1.15, 1), flags)
    for name, location, energy, size in [("Key", (-3, -3, 8), 1500, 5), ("Rim", (4, 3, 6), 1700, 3), ("Fill", (0, -5, 4), 700, 4)]:
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.size = energy, size
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = location
        studio.point_at(obj)
    camera = bpy.data.cameras.new("Reference portrait")
    obj = bpy.data.objects.new("Reference portrait", camera)
    scene.collection.objects.link(obj)
    obj.location = (0, -2.6, 17)
    studio.point_at(obj)
    camera.type, camera.ortho_scale, scene.camera = "ORTHO", 5.9, obj
    scene.render.filepath = str(ROOT / "src/shared/assets/brand/crystal/snake.webp")
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "robot-snake.blend"))
    bpy.ops.render.render(write_still=True)
    scene.render.resolution_percentage, scene.cycles.samples = 60, 32
    for frame in (49, 145):
        scene.frame_set(frame)
        scene.render.filepath = str(OUTPUT / f"robot-idle-{frame}.webp")
        bpy.ops.render.render(write_still=True)
    for obj in PARTS + [lens]:
        for track in obj.animation_data.nla_tracks:
            track.mute = track.name == "Idle"
    for frame, scale in [(1, 16), (73, 11), (121, 5.9)]:
        scene.frame_set(frame)
        camera.ortho_scale = scale
        scene.render.filepath = str(OUTPUT / f"robot-assemble-{frame}.webp")
        bpy.ops.render.render(write_still=True)
    print(json.dumps({"blender": bpy.app.version_string, "clips": ["Assemble", "Idle"], "seconds": [5, 8]}))


if __name__ == "__main__":
    animation_only() if "--animation-only" in sys.argv else main()
