"""Isometric 3x3x3 cube with blocks carved out, emitted as SVG line art.

Two things make it read the way it should.

Hidden lines: faces are drawn back to front, each one filled black. A
face nearer the eye paints over anything behind it, so nothing inside
the solid shows through.

Connected edges: an edge is only drawn where the surface actually stops.
If the neighbouring block presents the same face, the two are coplanar
and continuous, so the join between them is not drawn at all. What
survives is the silhouette plus the edges of every void, with no grid
ruled across a flat run of blocks.
"""
import random
import sys

N = 3
A, B, C = 0.866, 0.5, 1.0          # isometric basis

# normal -> the four (corner-offsets, neighbour-direction) of its edges
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


def build(removed, stroke="1.2", size=64, pad=2, seam="0.3"):
    present = {(x, y, z)
               for x in range(N) for y in range(N) for z in range(N)
               if (x, y, z) not in removed}

    def add(p, d):
        return (p[0] + d[0], p[1] + d[1], p[2] + d[2])

    items = []                                   # (depth, corners, kept_edges)
    for b in present:
        for n, (offs, dirs) in FACES.items():
            if add(b, n) in present:
                continue                         # covered, not a surface
            corners = [add(b, o) for o in offs]
            keep = []
            for i, d in enumerate(dirs):
                nb = add(b, d)
                # the neighbour shows the same face: coplanar, so no edge
                if nb in present and add(nb, n) not in present:
                    continue
                keep.append((corners[i], corners[(i + 1) % 4]))
            items.append((b[0] + b[1] + b[2], corners, keep))

    items.sort(key=lambda t: t[0])               # far faces first

    pts = [project(*p) for _, c, _ in items for p in c]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    lo_x, hi_x, lo_y, hi_y = min(xs), max(xs), min(ys), max(ys)
    k = (size - 2 * pad) / max(hi_x - lo_x, hi_y - lo_y)
    ox = pad + ((size - 2 * pad) - (hi_x - lo_x) * k) / 2 - lo_x * k
    oy = pad + ((size - 2 * pad) - (hi_y - lo_y) * k) / 2 - lo_y * k

    def put(p):
        sx, sy = project(*p)
        return "%.2f,%.2f" % (sx * k + ox, sy * k + oy)

    # Emit a whole depth layer of fills, then that layer's edges. Within a
    # layer no fill can nibble an edge that belongs beside it, and the next
    # layer still covers everything behind. The fills carry a thin black
    # stroke of their own, which closes the antialiased hairline that
    # otherwise lets a hidden edge glimmer through a covering face.
    out, i = [], 0
    while i < len(items):
        j = i
        while j < len(items) and items[j][0] == items[i][0]:
            j += 1
        layer = items[i:j]
        for _, corners, _ in layer:
            out.append('    <polygon points="%s" fill="#000000"'
                       ' stroke="#000000" stroke-width="%s"/>'
                       % (" ".join(put(p) for p in corners), seam))
        for _, _, keep in layer:
            for a, b2 in keep:
                out.append('    <path d="M%s L%s"/>'
                           % (put(a).replace(",", " "), put(b2).replace(",", " ")))
        i = j

    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d">\n'
            '  <rect width="%d" height="%d" fill="#000000"/>\n'
            '  <g fill="none" stroke="#ffffff" stroke-width="%s"\n'
            '     stroke-linecap="round" stroke-linejoin="round">\n'
            '%s\n  </g>\n</svg>\n'
            % (size, size, size, size, stroke, "\n".join(out)))


def carve(seed, count=7):
    """Pick blocks to remove, keeping the result from falling apart."""
    rng = random.Random(seed)
    cells = [(x, y, z) for x in range(N) for y in range(N) for z in range(N)]
    # the block at the far corner is never seen, so spend cuts elsewhere
    cells.remove((0, 0, 0))
    return set(rng.sample(cells, count))


if __name__ == "__main__":
    open(sys.argv[1], "w").write(build(carve(int(sys.argv[2]))))
    print("wrote", sys.argv[1])
