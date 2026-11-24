"""Isometric 3x3x3 cube with blocks carved out, emitted as SVG line art.

Run:  python3 make-icon.py ../img/favicon.svg 5

Three things make it read the way it should.

Hidden lines: faces are drawn back to front, each one filled black, so a
face nearer the eye paints over anything behind it and nothing inside
the solid shows through.

Two weights of line: an edge where the surface actually stops (the
silhouette, and the walls of every void) is drawn at the main weight. A
join between two coplanar faces is still drawn, but as a hairline, so
the block grid reads without competing with the form.

No doubled strokes: a coplanar join belongs to two faces, so it would be
drawn twice. It is emitted only by the nearer of the pair, which both
removes the duplicate and puts the line at a depth where a face in front
of it can still cover it.
"""
import random
import sys

A, B, C = 0.866, 0.5, 1.0          # isometric basis

# face normal -> (corner offsets, the neighbour direction per edge)
FACES = {
    (0, 0, 1): ([(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)],
                [(0, -1, 0), (1, 0, 0), (0, 1, 0), (-1, 0, 0)]),
    (1, 0, 0): ([(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)],
                [(0, 0, -1), (0, 1, 0), (0, 0, 1), (0, -1, 0)]),
    (0, 1, 0): ([(0, 1, 0), (1, 1, 0), (1, 1, 1), (0, 1, 1)],
                [(0, 0, -1), (1, 0, 0), (0, 0, 1), (-1, 0, 0)]),
}


def project(x, y, z):
    return ((x - y) * A, (x + y) * B - z * C)


def build(removed, outer="1.1", inner="0.3", seam="0.22", size=64, pad=2, N=3):
    present = {(x, y, z)
               for x in range(N) for y in range(N) for z in range(N)
               if (x, y, z) not in removed}

    def add(p, d):
        return (p[0] + d[0], p[1] + d[1], p[2] + d[2])

    items = []                       # (depth, corners, outer_edges, inner_edges)
    for b in present:
        for n, (offs, dirs) in FACES.items():
            if add(b, n) in present:
                continue                             # covered, not a surface
            corners = [add(b, o) for o in offs]
            outs, ins = [], []
            for i, d in enumerate(dirs):
                seg = (corners[i], corners[(i + 1) % 4])
                nb = add(b, d)
                if nb in present and add(nb, n) not in present:
                    # coplanar with the neighbour: a grid line, not an edge.
                    # Only the nearer of the two faces draws it.
                    if sum(d) > 0:
                        ins.append(seg)
                else:
                    outs.append(seg)
            items.append((b[0] + b[1] + b[2], corners, outs, ins))

    items.sort(key=lambda t: t[0])                   # far faces first

    pts = [project(*p) for _, c, _, _ in items for p in c]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    lo_x, hi_x, lo_y, hi_y = min(xs), max(xs), min(ys), max(ys)
    k = (size - 2 * pad) / max(hi_x - lo_x, hi_y - lo_y)
    ox = pad + ((size - 2 * pad) - (hi_x - lo_x) * k) / 2 - lo_x * k
    oy = pad + ((size - 2 * pad) - (hi_y - lo_y) * k) / 2 - lo_y * k

    def put(p):
        sx, sy = project(*p)
        return "%.2f %.2f" % (sx * k + ox, sy * k + oy)

    def path(seg):
        return '    <path d="M%s L%s"/>' % (put(seg[0]), put(seg[1]))

    # One depth layer at a time: fills, then that layer's hairlines, then
    # its solid edges. Inside a layer no fill can nibble a line beside it,
    # and the next layer still covers everything behind. The fills carry a
    # hairline black stroke of their own, which closes the antialiased
    # sliver that otherwise lets a hidden line glimmer through.
    out, i = [], 0
    while i < len(items):
        j = i
        while j < len(items) and items[j][0] == items[i][0]:
            j += 1
        layer = items[i:j]
        for _, corners, _, _ in layer:
            out.append('    <polygon points="%s" fill="#000000"'
                       ' stroke="#000000" stroke-width="%s"/>'
                       % (" ".join(put(p).replace(" ", ",") for p in corners), seam))
        thin = [path(s) for _, _, _, ins in layer for s in ins]
        if thin:
            out.append('    <g stroke-width="%s" stroke-opacity="0.45">' % inner)
            out.extend("  " + t for t in thin)
            out.append('    </g>')
        out.extend(path(s) for _, _, outs, _ in layer for s in outs)
        i = j

    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d">\n'
            '  <rect width="%d" height="%d" fill="#000000"/>\n'
            '  <g fill="none" stroke="#ffffff" stroke-width="%s"\n'
            '     stroke-linecap="round" stroke-linejoin="round">\n'
            '%s\n  </g>\n</svg>\n'
            % (size, size, size, size, outer, "\n".join(out)))


def carve(seed, count=6, N=3):
    """Pick blocks to remove. The far corner is never seen, so skip it."""
    rng = random.Random(seed)
    cells = [(x, y, z) for x in range(N) for y in range(N) for z in range(N)]
    cells.remove((0, 0, 0))
    return set(rng.sample(cells, count))


if __name__ == "__main__":
    # What the site ships: a 2x2x2 cube with the block nearest the eye
    # taken out, so the void faces the viewer and the silhouette stays a
    # clean hexagon. 2x2 rather than 3x3 because four cells a face still
    # resolve in a 16px browser tab and nine do not.
    CUT = {(1, 1, 1)}
    out = sys.argv[1] if len(sys.argv) > 1 else "../img/favicon.svg"
    open(out, "w").write(build(CUT, outer="1.8", inner="0.45", seam="0.3",
                               pad=2, N=2))
    print("wrote", out)
