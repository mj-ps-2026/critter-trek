import * as THREE from 'three';

const texCache = new Map();

function generateFurCanvas(baseHex, variation) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  const r0 = (baseHex >> 16) & 0xFF;
  const g0 = (baseHex >> 8) & 0xFF;
  const b0 = baseHex & 0xFF;
  const v = variation || 20;

  // Base coat with 3-octave noise
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const n1 = (Math.sin(x * 1.7 + y * 2.3) * Math.cos(x * 0.9 - y * 1.1) + 1) * 0.5;
      const n2 = (Math.sin(x * 5.3 + y * 3.7) * Math.cos(x * 2.1 - y * 4.3) + 1) * 0.5;
      const n3 = (Math.sin(x * 12.1 + y * 9.7) * Math.cos(x * 7.3 - y * 11.2) + 1) * 0.5;
      const blend = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
      const dither = (Math.random() - 0.5) * (v * 0.3);
      const r = Math.max(0, Math.min(255, r0 + (blend - 0.5) * v + dither));
      const g = Math.max(0, Math.min(255, g0 + (blend - 0.45) * v + dither));
      const b = Math.max(0, Math.min(255, b0 + (blend - 0.4) * v * 0.7 + dither));
      ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // vertical fur streaks
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const len = 15 + Math.random() * 40;
    const dr = (Math.random() - 0.5) * 8;
    const dg = (Math.random() - 0.5) * 8;
    const db = (Math.random() - 0.5) * 8;
    ctx.strokeStyle = `rgb(${Math.min(255,r0+dr|0)},${Math.min(255,g0+dg|0)},${Math.min(255,b0+db|0)})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, y - len);
    ctx.stroke();
  }

  // guard hairs (lighter top layer)
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const len = 20 + Math.random() * 50;
    const bright = Math.min(255, r0 + 20 + Math.random() * 15);
    ctx.strokeStyle = `rgb(${bright|0},${Math.min(255,g0+15|0)}|0,${Math.min(255,b0+10|0)}|0)`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 2, y - len);
    ctx.stroke();
  }

  return c;
}

export function furTexture(baseHex, variation) {
  const key = `${baseHex}_${variation||20}`;
  if (texCache.has(key)) return texCache.get(key);
  const canvas = generateFurCanvas(baseHex, variation);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  texCache.set(key, tex);
  return tex;
}

export function furMaterial(baseHex, opts) {
  opts = opts || {};
  const tex = furTexture(baseHex, opts.variation);
  return new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xffffff,
    roughness: opts.roughness != null ? opts.roughness : 0.85,
    metalness: opts.metalness || 0,
  });
}

export function displaceGeometry(geo, amount) {
  const pos = geo.attributes.position;
  if (!pos) return;
  const arr = pos.array;
  for (let i = 0; i < arr.length; i += 3) {
    const len = Math.sqrt(arr[i] * arr[i] + arr[i + 1] * arr[i + 1] + arr[i + 2] * arr[i + 2]);
    const scale = 1 + (Math.random() - 0.5) * amount * 2;
    arr[i] *= scale;
    arr[i + 1] *= scale;
    arr[i + 2] *= scale;
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

export function smoothDisplace(geo, amount) {
  const pos = geo.attributes.position;
  if (!pos) return;
  const arr = pos.array;
  for (let i = 0; i < arr.length; i += 3) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const offset = (Math.random() - 0.5) * amount;
    arr[i] += Math.sin(phi) * Math.cos(theta) * offset;
    arr[i + 1] += Math.cos(phi) * offset;
    arr[i + 2] += Math.sin(phi) * Math.sin(theta) * offset;
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

export function makeEye(irisColor, pupilColor, scale) {
  scale = scale || 1;
  const g = new THREE.Group();

  // sclera (white)
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xFAFAF5, roughness: 0.3, metalness: 0 });
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.04 * scale, 10, 10), scleraMat);
  g.add(sclera);

  // iris (colored ring with gradient)
  const irisCanvas = document.createElement('canvas');
  irisCanvas.width = 32;
  irisCanvas.height = 32;
  const ictx = irisCanvas.getContext('2d');
  const ir = (irisColor >> 16) & 0xFF;
  const ig = (irisColor >> 8) & 0xFF;
  const ib = irisColor & 0xFF;
  const grad = ictx.createRadialGradient(16, 16, 2, 16, 16, 14);
  grad.addColorStop(0, `rgb(${ir},${ig},${ib})`);
  grad.addColorStop(0.5, `rgb(${ir*0.7|0},${ig*0.7|0},${ib*0.7|0})`);
  grad.addColorStop(1, `rgb(${ir*0.3|0},${ig*0.3|0},${ib*0.3|0})`);
  ictx.fillStyle = grad;
  ictx.beginPath();
  ictx.arc(16, 16, 14, 0, Math.PI * 2);
  ictx.fill();
  const irisTex = new THREE.CanvasTexture(irisCanvas);
  const irisMat = new THREE.MeshStandardMaterial({
    map: irisTex, roughness: 0.2, metalness: 0.1,
  });
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.028 * scale, 8, 8), irisMat);
  iris.position.z = -0.01 * scale;
  g.add(iris);

  // pupil (black disc)
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0 });
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.012 * scale, 8, 8), pupilMat);
  pupil.position.z = -0.02 * scale;
  g.add(pupil);

  // corneal highlight (tiny bright sphere)
  const highlightMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 0.3,
    roughness: 0, metalness: 0,
  });
  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.008 * scale, 6, 6), highlightMat);
  hl.position.set(0.015 * scale, 0.012 * scale, -0.02 * scale);
  g.add(hl);

  return g;
}

export function addFurToMesh(mesh, baseColor, opts) {
  if (mesh.isMesh) {
    const newMat = furMaterial(baseColor, opts);
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(m => m.dispose());
    } else {
      mesh.material.dispose();
    }
    mesh.material = newMat;
  }
}

export function realisticifyGroup(group, colorMap) {
  group.traverse(child => {
    if (child.isMesh && child.geometry) {
      // subdivide for smoothness
      const geo = child.geometry;
      if (geo.type === 'SphereGeometry' || geo.type === 'CylinderGeometry' || geo.type === 'ConeGeometry') {
        // Add subtle vertex noise for organic feel
        smoothDisplace(geo, 0.02);
      }
    }
  });
}

// generate a random fur color variation
export function furVariation(baseHex) {
  const r = (baseHex >> 16) & 0xFF;
  const g = (baseHex >> 8) & 0xFF;
  const b = baseHex & 0xFF;
  const shift = 8 + Math.random() * 16;
  const r2 = Math.max(0, Math.min(255, r + (Math.random() - 0.5) * shift));
  const g2 = Math.max(0, Math.min(255, g + (Math.random() - 0.5) * shift));
  const b2 = Math.max(0, Math.min(255, b + (Math.random() - 0.5) * shift));
  return (Math.round(r2) << 16) | (Math.round(g2) << 8) | Math.round(b2);
}
