// Smooth enemy track built from control points (centripetal Catmull-Rom),
// resampled to even spacing so position lookups by distance are O(1).
(function () {
  const STEP = 4;

  function d(a, b) {
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  }

  function centripetal(p0, p1, p2, p3, t) {
    const al = 0.5;
    const t0 = 0;
    const t1 = t0 + Math.max(1e-4, Math.pow(d(p0, p1), al));
    const t2 = t1 + Math.max(1e-4, Math.pow(d(p1, p2), al));
    const t3 = t2 + Math.max(1e-4, Math.pow(d(p2, p3), al));
    const tt = t1 + (t2 - t1) * t;
    const lerp = (a, b, ta, tb) => [
      ((tb - tt) / (tb - ta)) * a[0] + ((tt - ta) / (tb - ta)) * b[0],
      ((tb - tt) / (tb - ta)) * a[1] + ((tt - ta) / (tb - ta)) * b[1],
    ];
    const A1 = lerp(p0, p1, t0, t1);
    const A2 = lerp(p1, p2, t1, t2);
    const A3 = lerp(p2, p3, t2, t3);
    const B1 = lerp(A1, A2, t0, t2);
    const B2 = lerp(A2, A3, t1, t3);
    return lerp(B1, B2, t1, t2);
  }

  // Generic smoothing helper (also used for rivers in the map painter)
  function smooth(ctrl, density = 3) {
    const n = ctrl.length;
    const first = [2 * ctrl[0][0] - ctrl[1][0], 2 * ctrl[0][1] - ctrl[1][1]];
    const last = [2 * ctrl[n - 1][0] - ctrl[n - 2][0], 2 * ctrl[n - 1][1] - ctrl[n - 2][1]];
    const P = [first, ...ctrl, last];
    const raw = [];
    for (let i = 1; i < P.length - 2; i++) {
      const segs = Math.max(4, Math.ceil(d(P[i], P[i + 1]) / density));
      for (let k = 0; k < segs; k++) raw.push(centripetal(P[i - 1], P[i], P[i + 1], P[i + 2], k / segs));
    }
    raw.push(ctrl[n - 1]);
    return raw;
  }

  class Path {
    constructor(ctrl) {
      const raw = smooth(ctrl);
      // resample at uniform arc length
      const pts = [{ x: raw[0][0], y: raw[0][1] }];
      let carry = 0;
      for (let i = 1; i < raw.length; i++) {
        const a = raw[i - 1], b = raw[i];
        const segLen = d(a, b);
        let pos = STEP - carry;
        while (pos <= segLen) {
          const t = pos / segLen;
          pts.push({ x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t });
          pos += STEP;
        }
        carry = segLen - (pos - STEP);
      }
      const end = raw[raw.length - 1];
      pts.push({ x: end[0], y: end[1] });
      this.pts = pts;
      this.length = (pts.length - 2) * STEP + Math.hypot(end[0] - pts[pts.length - 2].x, end[1] - pts[pts.length - 2].y);
    }

    at(dist) {
      const pts = this.pts;
      if (dist <= 0) return pts[0];
      const f = dist / STEP;
      const i = Math.floor(f);
      if (i >= pts.length - 1) return pts[pts.length - 1];
      const a = pts[i], b = pts[i + 1], t = f - i;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }

    // writes into out to avoid allocations in the hot loop
    atInto(dist, out) {
      const pts = this.pts;
      const f = Math.max(0, dist) / STEP;
      const i = Math.floor(f);
      if (i >= pts.length - 1) {
        const p = pts[pts.length - 1];
        out.x = p.x;
        out.y = p.y;
        out.dx = 1;
        return out;
      }
      const a = pts[i], b = pts[i + 1], t = f - i;
      out.x = a.x + (b.x - a.x) * t;
      out.y = a.y + (b.y - a.y) * t;
      out.dx = b.x - a.x;
      return out;
    }

    angleAt(dist) {
      const a = this.at(dist - 6), b = this.at(dist + 6);
      return Math.atan2(b.y - a.y, b.x - a.x);
    }

    // minimum distance from a point to the track
    distTo(x, y) {
      const pts = this.pts;
      let best = Infinity;
      // coarse pass every 4th point, then refine
      for (let i = 0; i < pts.length; i += 3) {
        const dx = pts[i].x - x, dy = pts[i].y - y;
        const dd = dx * dx + dy * dy;
        if (dd < best) best = dd;
      }
      return Math.sqrt(best);
    }

    // distance along the track of the track point closest to (x, y)
    project(x, y) {
      const pts = this.pts;
      let best = Infinity, bi = 0;
      for (let i = 0; i < pts.length; i += 2) {
        const dx = pts[i].x - x, dy = pts[i].y - y;
        const dd = dx * dx + dy * dy;
        if (dd < best) {
          best = dd;
          bi = i;
        }
      }
      return Math.min(this.length, bi * STEP);
    }
  }

  MT.Path = Path;
  MT.Path.smooth = smooth;
})();
