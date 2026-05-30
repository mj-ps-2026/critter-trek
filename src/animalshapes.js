import * as THREE from 'three';
import { furMaterial, furVariation, smoothDisplace, makeEye } from './realism.js';

// Build an organic body from a spine curve with varying radius.
// spinePoints: Array of [x,y,z] relative positions
// radii: Array of radius values at each spine point
// Returns { mesh, geo } — a smooth organic body mesh
export function buildBody(spinePoints, radii, segLen, segRad) {
  segLen = segLen || 14;
  segRad = segRad || 10;
  const n = spinePoints.length;

  // compute cumulative distances along spine for interpolation
  const dists = [0];
  for (let i = 1; i < n; i++) {
    const dx = spinePoints[i][0] - spinePoints[i - 1][0];
    const dy = spinePoints[i][1] - spinePoints[i - 1][1];
    const dz = spinePoints[i][2] - spinePoints[i - 1][2];
    dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy + dz * dz));
  }
  const totalLen = dists[n - 1];

  // build interpolated spine curve
  const curvePoints = spinePoints.map(p => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(curvePoints);

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const lenSegs = segLen;

  for (let i = 0; i <= lenSegs; i++) {
    const t = i / lenSegs;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();

    // find radius at this t
    const targetDist = t * totalLen;
    let ri = 0;
    for (let j = 1; j < n; j++) {
      if (dists[j] >= targetDist) { ri = j; break; }
    }
    const rPrev = dists[ri - 1] || 0;
    const rNext = dists[ri];
    const segT = rNext > rPrev ? (targetDist - rPrev) / (rNext - rPrev) : 0;
    const radius = radii[ri - 1] + (radii[ri] - radii[ri - 1]) * segT;

    // up vector (try world up, fallback)
    const up = Math.abs(tangent.y) > 0.99 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const localUp = new THREE.Vector3().crossVectors(right, tangent).normalize();

    for (let j = 0; j <= segRad; j++) {
      const a = (j / segRad) * Math.PI * 2;
      const cx = Math.cos(a);
      const sy = Math.sin(a);

      const px = point.x + right.x * cx * radius + localUp.x * sy * radius;
      const py = point.y + right.y * cx * radius + localUp.y * sy * radius;
      const pz = point.z + right.z * cx * radius + localUp.z * sy * radius;

      positions.push(px, py, pz);

      // normal points outward from spine
      const nx = px - point.x;
      const ny = py - point.y;
      const nz = pz - point.z;
      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      normals.push(nx / nl, ny / nl, nz / nl);

      uvs.push(j / segRad, i / lenSegs);

      if (i < lenSegs && j < segRad) {
        const a0 = i * (segRad + 1) + j;
        const a1 = a0 + segRad + 1;
        indices.push(a0, a1, a0 + 1);
        indices.push(a1, a1 + 1, a0 + 1);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  smoothDisplace(geo, 0.015);

  const mat = furMaterial(0x8B6914, { variation: 18, roughness: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

// Build a tapered limb (leg, tail, neck, etc.)
export function buildLimb(startPos, endPos, startRad, endRad, radialSegs, color) {
  radialSegs = radialSegs || 6;
  color = color || 0x5C3D1A;

  const dir = new THREE.Vector3().copy(endPos).sub(startPos);
  const len = dir.length();
  if (len < 0.001) return null;
  dir.normalize();

  const geo = new THREE.CylinderGeometry(startRad, endRad, len, radialSegs, 5);
  const mat = furMaterial(color, { variation: 14, roughness: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);

  // position at midpoint
  const mid = new THREE.Vector3().copy(startPos).add(endPos).multiplyScalar(0.5);
  mesh.position.copy(mid);

  // orient along dir
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
  mesh.quaternion.copy(q);

  mesh.castShadow = true;
  return mesh;
}

// Build a pair of mirrored limbs
export function buildLegPair(origin, offsetZ, height, spread, taper, color) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const top = new THREE.Vector3(origin[0] + s * spread, origin[1], origin[2] + offsetZ);
    const bottom = new THREE.Vector3(origin[0] + s * spread * 0.7, origin[1] - height, origin[2] + offsetZ);
    const leg = buildLimb(top, bottom, taper[0], taper[1], 6, color);
    if (leg) g.add(leg);
  }
  return g;
}

// Build animal head from a profile
export function buildHead(basePos, facing, size, color) {
  size = size || 0.15;
  const geo = new THREE.SphereGeometry(size, 12, 10);
  // stretch into organic head shape
  const pos = geo.attributes.position;
  const arr = pos.array;
  for (let i = 0; i < arr.length; i += 3) {
    // flatten slightly side-to-side, elongate front-to-back
    arr[i] *= 1.3;     // x: wider
    arr[i + 1] *= 0.9; // y: slightly shorter
    arr[i + 2] *= 1.5; // z: longer
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  smoothDisplace(geo, 0.012);

  const mat = furMaterial(color, { variation: 14, roughness: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(basePos[0], basePos[1], basePos[2]);
  mesh.castShadow = true;
  return mesh;
}

// Add realistic eyes to a group at given positions relative to group origin
export function addEyes(group, leftPos, rightPos, irisColor, scale) {
  scale = scale || 1;
  for (const s of [-1, 1]) {
    const pos = new THREE.Vector3(s * leftPos[0], leftPos[1], leftPos[2]);
    const eye = makeEye(irisColor, 0x111111, scale);
    eye.position.copy(pos);
    eye.rotation.y = s * 0.15;
    group.add(eye);
  }
}

// Build ears for mammals
export function buildEars(group, basePos, height, width, color, innerColor) {
  for (const s of [-1, 1]) {
    const earPos = new THREE.Vector3(s * basePos[0], basePos[1], basePos[2]);
    const earTip = new THREE.Vector3(s * basePos[0] * 1.3, basePos[1] + height, basePos[2] - 0.02);

    const geo = new THREE.ConeGeometry(width, height, 8, 3);
    const mat = furMaterial(color, { variation: 10, roughness: 0.8 });
    const ear = new THREE.Mesh(geo, mat);
    ear.position.copy(earPos);
    ear.lookAt(earTip);
    ear.rotateX(Math.PI / 2);
    group.add(ear);

    if (innerColor) {
      const innerGeo = new THREE.ConeGeometry(width * 0.5, height * 0.6, 8, 3);
      const innerMat = furMaterial(innerColor, { variation: 8, roughness: 0.7 });
      const inner = new THREE.Mesh(innerGeo, innerMat);
      inner.position.copy(earPos);
      inner.position.y += height * 0.15;
      inner.quaternion.copy(ear.quaternion);
      group.add(inner);
    }
  }
}

// ── Animal Body Presets ──

export function makeRabbit(group, color) {
  color = color || 0xE8E0D0;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.1, 0.05], [0, 0.16, -0.02], [0, 0.24, -0.08], [0, 0.28, -0.14], [0, 0.26, -0.2], [0, 0.18, -0.25], [0, 0.1, -0.28]],
    [0.1, 0.14, 0.18, 0.2, 0.17, 0.12, 0.06]
  );
  body.material = furMaterial(bodyColor, { variation: 20, roughness: 0.85 });
  group.add(body);

  const head = buildHead([0, 0.35, -0.28], 1, 0.1, bodyColor);
  group.add(head);

  buildEars(group, [0.05, 0.48, -0.24], 0.25, 0.04, bodyColor, 0xFFB5B5);

  for (const [offX, offZ] of [[0.07, 0.08], [-0.07, 0.08], [0.07, -0.1], [-0.07, -0.1]]) {
    const leg = buildLimb(
      new THREE.Vector3(offX, 0.05, offZ),
      new THREE.Vector3(offX * 0.8, -0.08, offZ),
      0.02, 0.025, 5, bodyColor
    );
    if (leg) group.add(leg);
  }

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), furMaterial(bodyColor, { variation: 15, roughness: 0.8 }));
  tail.position.set(0, 0.15, 0.22);
  group.add(tail);

  addEyes(group, [0.04, 0.37, -0.34], [-0.04, 0.37, -0.34], 0x6B4226, 0.8);
}

export function makeDeer(group, color) {
  color = color || 0x8B6914;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.45, 0.05], [0, 0.5, -0.1], [0, 0.55, -0.2], [0, 0.6, -0.35], [0, 0.62, -0.5], [0, 0.55, -0.6], [0, 0.45, -0.7]],
    [0.25, 0.32, 0.38, 0.42, 0.4, 0.3, 0.18]
  );
  body.material = furMaterial(bodyColor, { variation: 18, roughness: 0.8 });
  group.add(body);

  const neck = buildLimb(
    new THREE.Vector3(0, 0.65, -0.55),
    new THREE.Vector3(0, 1.0, -0.7),
    0.1, 0.08, 6, bodyColor
  );
  if (neck) group.add(neck);

  const head = buildHead([0, 1.05, -0.78], 1, 0.12, bodyColor);
  group.add(head);

  buildEars(group, [0.12, 1.1, -0.7], 0.13, 0.04, bodyColor, 0xF5F0E6);

  const antColor = 0x5C3D1A;
  for (const s of [-1, 1]) {
    const antler = buildLimb(
      new THREE.Vector3(s * 0.12, 1.2, -0.65),
      new THREE.Vector3(s * 0.15, 1.45, -0.6),
      0.025, 0.018, 4, antColor
    );
    if (antler) group.add(antler);
    const tine = buildLimb(
      new THREE.Vector3(s * 0.15, 1.45, -0.6),
      new THREE.Vector3(s * 0.3, 1.55, -0.55),
      0.018, 0.012, 4, antColor
    );
    if (tine) group.add(tine);
  }

  const legColor = 0x5C3D1A;
  for (const [offX, offZ] of [[0.2, 0.35], [-0.2, 0.35], [0.2, -0.35], [-0.2, -0.35]]) {
    const leg = buildLimb(
      new THREE.Vector3(offX, 0.35, offZ),
      new THREE.Vector3(offX * 0.8, -0.1, offZ),
      0.05, 0.04, 6, legColor
    );
    if (leg) group.add(leg);
  }

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 5), furMaterial(0xF5F0E6, { variation: 12, roughness: 0.8 }));
  tail.position.set(0, 0.6, 0.55);
  group.add(tail);

  addEyes(group, [0.07, 1.08, -0.88], [-0.07, 1.08, -0.88], 0x6B4226, 0.9);
}

export function makeBear(group, color) {
  color = color || 0x4A2F1A;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.4, 0.05], [0, 0.5, -0.1], [0, 0.58, -0.25], [0, 0.65, -0.4], [0, 0.68, -0.55], [0, 0.6, -0.7], [0, 0.5, -0.85]],
    [0.32, 0.4, 0.48, 0.55, 0.5, 0.38, 0.22]
  );
  body.material = furMaterial(bodyColor, { variation: 16, roughness: 0.9 });
  group.add(body);

  const head = buildHead([0, 0.9, -0.85], 1, 0.18, bodyColor);
  group.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), furMaterial(0x2A1A0A, { variation: 10, roughness: 0.9 }));
  snout.position.set(0, 0.85, -1.02);
  snout.scale.set(1.2, 0.7, 1);
  group.add(snout);

  buildEars(group, [0.12, 1.0, -0.78], 0.12, 0.045, bodyColor, 0x3A2010);

  const legColor = 0x2A1A0A;
  for (const [offX, offZ] of [[0.35, 0.45], [-0.35, 0.45], [0.35, -0.45], [-0.35, -0.45]]) {
    const leg = buildLimb(
      new THREE.Vector3(offX, 0.3, offZ),
      new THREE.Vector3(offX * 0.9, -0.15, offZ),
      0.1, 0.08, 6, legColor
    );
    if (leg) group.add(leg);
  }

  addEyes(group, [0.09, 0.94, -0.96], [-0.09, 0.94, -0.96], 0x3A2010, 1);
}

export function makeBison(group, color) {
  color = color || 0x6B4E2A;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.5, 0.05], [0, 0.6, -0.1], [0, 0.7, -0.25], [0, 0.85, -0.4], [0, 0.88, -0.55], [0, 0.75, -0.7], [0, 0.55, -0.8]],
    [0.35, 0.42, 0.48, 0.55, 0.5, 0.35, 0.2]
  );
  body.material = furMaterial(bodyColor, { variation: 18, roughness: 0.9 });
  group.add(body);

  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 7), furMaterial(bodyColor, { variation: 15, roughness: 0.9 }));
  hump.position.set(0, 0.9, -0.3);
  hump.scale.set(1.5, 0.8, 1.2);
  group.add(hump);

  const head = buildHead([0, 0.7, -0.9], 1, 0.15, bodyColor);
  group.add(head);

  buildEars(group, [0.15, 0.72, -0.82], 0.1, 0.04, bodyColor, 0x4A3020);

  for (const s of [-1, 1]) {
    const horn = buildLimb(
      new THREE.Vector3(s * 0.12, 0.82, -0.9),
      new THREE.Vector3(s * 0.25, 0.75, -1.0),
      0.04, 0.015, 5, 0x3A2A1A
    );
    if (horn) group.add(horn);
  }

  const legColor = 0x3A2A1A;
  for (const [offX, offZ] of [[0.3, 0.4], [-0.3, 0.4], [0.3, -0.4], [-0.3, -0.4]]) {
    const leg = buildLimb(
      new THREE.Vector3(offX, 0.35, offZ),
      new THREE.Vector3(offX * 0.85, -0.1, offZ),
      0.08, 0.06, 6, legColor
    );
    if (leg) group.add(leg);
  }

  const tail = buildLimb(
    new THREE.Vector3(0, 0.6, 0.7),
    new THREE.Vector3(0, 0.5, 0.9),
    0.04, 0.015, 4, color
  );
  if (tail) { tail.material = furMaterial(bodyColor, { variation: 12, roughness: 0.85 }); group.add(tail); }

  addEyes(group, [0.08, 0.73, -1.0], [-0.08, 0.73, -1.0], 0x4A3020, 0.9);
}

export function makeLizard(group, color) {
  color = color || 0x4a8a3a;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.04, 0.02], [0, 0.05, -0.04], [0, 0.06, -0.08], [0, 0.07, -0.14], [0, 0.06, -0.2], [0, 0.04, -0.24]],
    [0.04, 0.06, 0.08, 0.09, 0.06, 0.03], 8, 7
  );
  body.material = furMaterial(bodyColor, { variation: 22, roughness: 0.8 });
  group.add(body);

  const head = buildHead([0, 0.07, -0.26], 1, 0.05, bodyColor);
  group.add(head);

  const tail = buildLimb(
    new THREE.Vector3(0, 0.04, 0.22),
    new THREE.Vector3(0, 0.02, 0.45),
    0.04, 0.01, 5, 0x2a5a2a
  );
  if (tail) group.add(tail);

  for (const [offX, offZ] of [[0.04, 0.08], [-0.04, 0.08], [0.04, -0.08], [-0.04, -0.08]]) {
    const leg = buildLimb(
      new THREE.Vector3(offX, 0.03, offZ),
      new THREE.Vector3(offX * 1.5, -0.02, offZ),
      0.01, 0.008, 4, 0x2a5a2a
    );
    if (leg) group.add(leg);
  }

  addEyes(group, [0.025, 0.09, -0.29], [-0.025, 0.09, -0.29], 0xCCAA33, 0.6);
}

export function makeFrog(group, color) {
  color = color || 0x4CAF50;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.05, 0.02], [0, 0.07, -0.04], [0, 0.08, -0.08], [0, 0.1, -0.12], [0, 0.08, -0.16], [0, 0.05, -0.2]],
    [0.08, 0.1, 0.14, 0.16, 0.1, 0.05], 8, 8
  );
  body.material = furMaterial(bodyColor, { variation: 24, roughness: 0.75 });
  group.add(body);

  const head = buildHead([0, 0.12, -0.2], 1, 0.08, bodyColor);
  group.add(head);

  for (const s of [-1, 1]) {
    const leg = buildLimb(
      new THREE.Vector3(s * 0.1, 0.04, 0.08),
      new THREE.Vector3(s * 0.14, -0.02, 0.12),
      0.03, 0.04, 5, 0x2E7D32
    );
    if (leg) group.add(leg);
  }

  for (const s of [-1, 1]) {
    const leg = buildLimb(
      new THREE.Vector3(s * 0.06, 0.04, -0.1),
      new THREE.Vector3(s * 0.08, -0.01, -0.14),
      0.015, 0.02, 4, 0x2E7D32
    );
    if (leg) group.add(leg);
  }

  addEyes(group, [0.05, 0.18, -0.24], [-0.05, 0.18, -0.24], 0xCCAA33, 0.8);
}

export function makeSnake(group, color) {
  color = color || 0x5a7a3a;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.02, 0.35], [0, 0.03, 0.25], [0, 0.04, 0.15], [0, 0.04, 0.05], [0, 0.04, -0.05], [0, 0.04, -0.15], [0, 0.03, -0.25], [0, 0.02, -0.32]],
    [0.025, 0.035, 0.045, 0.05, 0.055, 0.045, 0.035, 0.02], 14, 7
  );
  body.material = furMaterial(bodyColor, { variation: 20, roughness: 0.8 });
  group.add(body);

  const headGeo = new THREE.SphereGeometry(0.035, 8, 6);
  const headArr = headGeo.attributes.position.array;
  for (let i = 0; i < headArr.length; i += 3) {
    headArr[i] *= 1.3;
    headArr[i + 1] *= 0.8;
    headArr[i + 2] *= 1.2;
  }
  headGeo.attributes.position.needsUpdate = true;
  headGeo.computeVertexNormals();
  const head = new THREE.Mesh(headGeo, furMaterial(bodyColor, { variation: 16, roughness: 0.8 }));
  head.position.set(0, 0.04, -0.34);
  group.add(head);

  addEyes(group, [0.02, 0.05, -0.36], [-0.02, 0.05, -0.36], 0xCCAA33, 0.5);

  const rattle = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.025, 4), new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.9 }));
  rattle.position.set(0, 0.02, 0.35);
  group.add(rattle);
}

export function makeFish(group, color) {
  color = color || 0x4477AA;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0, 0.16], [0, 0, 0.1], [0, 0, 0.04], [0, 0, -0.02], [0, 0, -0.08], [0, 0, -0.16]],
    [0.03, 0.055, 0.07, 0.08, 0.05, 0.02], 8, 8
  );
  body.material = furMaterial(bodyColor, { variation: 30, roughness: 0.6 });
  group.add(body);

  const tailGeo = new THREE.ConeGeometry(0.05, 0.08, 4);
  const tailArr = tailGeo.attributes.position.array;
  for (let i = 0; i < tailArr.length; i += 3) {
    tailArr[i] *= 0.3;
    tailArr[i + 2] *= 2;
  }
  tailGeo.attributes.position.needsUpdate = true;
  tailGeo.computeVertexNormals();
  const tail = new THREE.Mesh(tailGeo, new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.6 }));
  tail.position.set(0, 0, 0.19);
  tail.rotation.x = Math.PI / 2;
  group.add(tail);

  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 3), new THREE.MeshStandardMaterial({ color: 0x88AACC, roughness: 0.6 }));
  fin.position.set(0, 0.03, 0);
  fin.scale.set(2, 1, 0.5);
  group.add(fin);

  addEyes(group, [0.02, 0.01, -0.17], [-0.02, 0.01, -0.17], 0x224488, 0.5);
}

export function makeSeaTurtle(group, shellColor) {
  shellColor = shellColor || 0x5a7a3a;
  const bodyColor = furVariation(shellColor);
  const body = buildBody(
    [[0, 0, 0.02], [0, 0.02, -0.04], [0, 0.03, -0.08], [0, 0.03, -0.12], [0, 0.02, -0.16], [0, 0, -0.2]],
    [0.08, 0.12, 0.16, 0.18, 0.12, 0.06], 8, 8
  );
  body.material = furMaterial(bodyColor, { variation: 20, roughness: 0.85 });
  group.add(body);

  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), furMaterial(0x4a6a2a, { variation: 18, roughness: 0.85 }));
  shell.position.set(0, 0.08, -0.08);
  shell.scale.set(1.1, 0.5, 1.3);
  group.add(shell);

  const head = buildHead([0, 0.04, -0.22], 1, 0.05, 0x6a8a4a);
  group.add(head);

  for (const s of [-1, 1]) {
    const flipper = buildLimb(
      new THREE.Vector3(s * 0.1, 0.02, -0.04),
      new THREE.Vector3(s * 0.22, -0.01, -0.08),
      0.03, 0.015, 4, 0x6a8a4a
    );
    if (flipper) group.add(flipper);
  }
  for (const s of [-1, 1]) {
    const flipper = buildLimb(
      new THREE.Vector3(s * 0.08, 0.02, 0.08),
      new THREE.Vector3(s * 0.18, -0.01, 0.12),
      0.03, 0.015, 4, 0x6a8a4a
    );
    if (flipper) group.add(flipper);
  }

  addEyes(group, [0.03, 0.05, -0.25], [-0.03, 0.05, -0.25], 0x3A2010, 0.6);
}

export function makeJellyfish(group, color) {
  color = color || 0xCC77EE;
  const bellGeo = new THREE.SphereGeometry(0.12, 10, 8);
  const bellArr = bellGeo.attributes.position.array;
  for (let i = 0; i < bellArr.length; i += 3) {
    const x = bellArr[i];
    const y = bellArr[i + 1];
    const z = bellArr[i + 2];
    if (y > 0) {
      bellArr[i + 1] *= 0.3;
    } else {
      bellArr[i + 1] *= 1.3;
    }
  }
  bellGeo.attributes.position.needsUpdate = true;
  bellGeo.computeVertexNormals();
  const bell = new THREE.Mesh(bellGeo, new THREE.MeshStandardMaterial({
    color: color, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.7
  }));
  bell.position.y = 0.05;
  group.add(bell);

  const tentMat = new THREE.MeshStandardMaterial({
    color: 0xEEAAFF, roughness: 0.3, transparent: true, opacity: 0.5
  });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const tent = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.01, 0.12 + Math.random() * 0.08, 4), tentMat);
    tent.position.set(Math.cos(a) * 0.08, -0.02, Math.sin(a) * 0.08);
    tent.rotation.z = Math.cos(a) * 0.3;
    tent.rotation.x = Math.sin(a) * 0.3;
    group.add(tent);
  }

  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({
    color: 0xDD88FF, emissive: 0xAA55CC, emissiveIntensity: 0.3, transparent: true, opacity: 0.3
  }));
  glow.position.y = 0.05;
  group.add(glow);

  addEyes(group, [0.04, 0.08, -0.07], [-0.04, 0.08, -0.07], 0x8844AA, 0.5);
}

export function makeHeron(group, color) {
  color = color || 0x8a9aaa;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.35, 0.02], [0, 0.4, -0.02], [0, 0.45, -0.06], [0, 0.5, -0.1], [0, 0.48, -0.14], [0, 0.4, -0.18]],
    [0.06, 0.08, 0.1, 0.12, 0.08, 0.04], 8, 7
  );
  body.material = furMaterial(bodyColor, { variation: 15, roughness: 0.8 });
  group.add(body);

  const neck = buildLimb(
    new THREE.Vector3(0, 0.55, -0.12),
    new THREE.Vector3(0, 0.85, -0.16),
    0.04, 0.035, 6, bodyColor
  );
  if (neck) group.add(neck);

  const head = buildHead([0, 0.88, -0.18], 1, 0.04, bodyColor);
  group.add(head);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 4), new THREE.MeshStandardMaterial({ color: 0xCC8833, roughness: 0.7 }));
  beak.position.set(0, 0.88, -0.24);
  beak.rotation.x = 0.2;
  group.add(beak);

  for (const s of [-1, 1]) {
    const wing = buildLimb(
      new THREE.Vector3(s * 0.08, 0.45, -0.04),
      new THREE.Vector3(s * 0.2, 0.35, -0.08),
      0.03, 0.01, 4, 0x6a7a8a
    );
    if (wing) group.add(wing);
  }

  const legColor = 0x5a6a7a;
  for (const s of [-1, 1]) {
    const leg = buildLimb(
      new THREE.Vector3(s * 0.04, 0.25, 0.04),
      new THREE.Vector3(s * 0.03, -0.15, 0.04),
      0.015, 0.01, 4, legColor
    );
    if (leg) group.add(leg);
  }

  addEyes(group, [0.02, 0.89, -0.21], [-0.02, 0.89, -0.21], 0xCCAA33, 0.5);
}

export function makeOwl(group, color) {
  color = color || 0x8a7a5a;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.2, 0.02], [0, 0.24, -0.03], [0, 0.28, -0.06], [0, 0.3, -0.1], [0, 0.28, -0.14], [0, 0.22, -0.18]],
    [0.1, 0.14, 0.16, 0.17, 0.12, 0.06], 8, 8
  );
  body.material = furMaterial(bodyColor, { variation: 22, roughness: 0.85 });
  group.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), furMaterial(0xC8B896, { variation: 15, roughness: 0.8 }));
  belly.position.set(0, 0.25, -0.08);
  belly.scale.set(1.1, 0.8, 0.8);
  group.add(belly);

  const head = buildHead([0, 0.4, -0.14], 1, 0.09, bodyColor);
  group.add(head);

  for (const s of [-1, 1]) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 4), new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 }));
    tuft.position.set(s * 0.06, 0.47, -0.13);
    tuft.rotation.z = s * 0.3;
    group.add(tuft);
  }

  for (const s of [-1, 1]) {
    const wing = buildLimb(
      new THREE.Vector3(s * 0.12, 0.28, -0.04),
      new THREE.Vector3(s * 0.22, 0.2, -0.06),
      0.04, 0.015, 4, 0x5a4a3a
    );
    if (wing) group.add(wing);
  }

  addEyes(group, [0.04, 0.42, -0.19], [-0.04, 0.42, -0.19], 0xEEAA22, 1.2);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.03, 4), new THREE.MeshStandardMaterial({ color: 0xCC9933, roughness: 0.6 }));
  beak.position.set(0, 0.4, -0.22);
  group.add(beak);
}

export function makeArcticFox(group, color) {
  color = color || 0xE8E8F0;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.15, 0.04], [0, 0.18, -0.02], [0, 0.2, -0.08], [0, 0.22, -0.14], [0, 0.24, -0.2], [0, 0.22, -0.26], [0, 0.18, -0.3]],
    [0.1, 0.12, 0.14, 0.16, 0.18, 0.12, 0.06]
  );
  body.material = furMaterial(bodyColor, { variation: 12, roughness: 0.85 });
  group.add(body);

  const head = buildHead([0, 0.35, -0.3], 1, 0.09, bodyColor);
  group.add(head);

  buildEars(group, [0.05, 0.45, -0.26], 0.15, 0.03, bodyColor, 0xC0C0D0);

  for (const [offX, offZ] of [[0.08, 0.14], [-0.08, 0.14], [0.08, -0.12], [-0.08, -0.12]]) {
    const leg = buildLimb(
      new THREE.Vector3(offX, 0.08, offZ),
      new THREE.Vector3(offX * 0.8, -0.08, offZ),
      0.02, 0.025, 5, bodyColor
    );
    if (leg) group.add(leg);
  }

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), furMaterial(bodyColor, { variation: 10, roughness: 0.85 }));
  tail.position.set(0, 0.22, 0.28);
  tail.scale.set(0.8, 0.8, 1.5);
  group.add(tail);

  addEyes(group, [0.04, 0.37, -0.36], [-0.04, 0.37, -0.36], 0x6B8AB5, 0.7);
}

export function makeGoat(group, color) {
  color = color || 0x8a7a6a;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.3, 0.04], [0, 0.35, -0.06], [0, 0.38, -0.14], [0, 0.42, -0.22], [0, 0.45, -0.3], [0, 0.4, -0.38], [0, 0.32, -0.44]],
    [0.14, 0.18, 0.2, 0.22, 0.24, 0.16, 0.08]
  );
  body.material = furMaterial(bodyColor, { variation: 20, roughness: 0.85 });
  group.add(body);

  const neck = buildLimb(
    new THREE.Vector3(0, 0.55, -0.35),
    new THREE.Vector3(0, 0.7, -0.4),
    0.06, 0.05, 6, bodyColor
  );
  if (neck) group.add(neck);

  const head = buildHead([0, 0.73, -0.44], 1, 0.09, bodyColor);
  group.add(head);

  buildEars(group, [0.08, 0.75, -0.42], 0.08, 0.03, bodyColor, 0x5a4a3a);

  for (const s of [-1, 1]) {
    const horn = buildLimb(
      new THREE.Vector3(s * 0.06, 0.82, -0.42),
      new THREE.Vector3(s * 0.1, 0.92, -0.38),
      0.025, 0.012, 5, 0x5a4a3a
    );
    if (horn) group.add(horn);
  }

  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 4), new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8 }));
  beard.position.set(0, 0.7, -0.5);
  group.add(beard);

  for (const [offX, offZ] of [[0.12, 0.2], [-0.12, 0.2], [0.12, -0.2], [-0.12, -0.2]]) {
    const leg = buildLimb(
      new THREE.Vector3(offX, 0.2, offZ),
      new THREE.Vector3(offX * 0.8, -0.1, offZ),
      0.035, 0.025, 5, 0x5a4a3a
    );
    if (leg) group.add(leg);
  }

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 5), furMaterial(bodyColor, { variation: 14, roughness: 0.8 }));
  tail.position.set(0, 0.4, 0.35);
  group.add(tail);

  addEyes(group, [0.045, 0.75, -0.48], [-0.045, 0.75, -0.48], 0x6B4E2A, 0.8);
}

export function makeJackrabbit(group, color) {
  color = color || 0xC8B896;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.14, 0.04], [0, 0.16, -0.02], [0, 0.18, -0.06], [0, 0.2, -0.1], [0, 0.22, -0.14], [0, 0.2, -0.18], [0, 0.16, -0.24]],
    [0.08, 0.1, 0.12, 0.13, 0.14, 0.1, 0.05]
  );
  body.material = furMaterial(bodyColor, { variation: 20, roughness: 0.85 });
  group.add(body);

  const head = buildHead([0, 0.3, -0.22], 1, 0.08, bodyColor);
  group.add(head);

  buildEars(group, [0.04, 0.4, -0.18], 0.3, 0.035, bodyColor, 0xFFB5B5);

  for (const [offX, offZ] of [[0.07, 0.1], [-0.07, 0.1], [0.07, -0.08], [-0.07, -0.08]]) {
    const leg = buildLimb(
      new THREE.Vector3(offX, 0.06, offZ),
      new THREE.Vector3(offX * 0.8, -0.06, offZ),
      0.02, 0.022, 5, bodyColor
    );
    if (leg) group.add(leg);
  }

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 5), furMaterial(bodyColor, { variation: 14, roughness: 0.8 }));
  tail.position.set(0, 0.18, 0.2);
  group.add(tail);

  addEyes(group, [0.035, 0.32, -0.27], [-0.035, 0.32, -0.27], 0x6B4226, 0.7);
}

export function makeGlowbug(group, color) {
  color = color || 0x88CC44;
  const bodyColor = furVariation(color);
  const body = buildBody(
    [[0, 0.04, 0.01], [0, 0.05, -0.01], [0, 0.06, -0.03], [0, 0.06, -0.05], [0, 0.04, -0.07]],
    [0.03, 0.04, 0.05, 0.04, 0.02], 6, 7
  );
  body.material = furMaterial(bodyColor, { variation: 18, roughness: 0.6 });
  group.add(body);

  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), new THREE.MeshStandardMaterial({
    color: 0xCCFF66, emissive: 0x88FF44, emissiveIntensity: 0.5, transparent: true, opacity: 0.4
  }));
  glow.position.set(0, 0.04, 0.02);
  group.add(glow);

  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.04, 4), new THREE.MeshStandardMaterial({
      color: 0xCCDDCC, roughness: 0.3, transparent: true, opacity: 0.4
    }));
    wing.position.set(s * 0.03, 0.06, -0.02);
    wing.rotation.z = s * 0.4;
    group.add(wing);
  }

  addEyes(group, [0.015, 0.07, -0.06], [-0.015, 0.07, -0.06], 0x88FF44, 0.5);
}

export function makeBunny(group) { makeRabbit(group, 0xE8E0D0); }
