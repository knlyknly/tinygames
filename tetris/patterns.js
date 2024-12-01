const PATTERNS = (() => {
  const rotate = (shape) =>
    shape[0].map((_, idx) =>
      shape.map(row => row[idx])
    ).reverse();
  const mirror = (shape) =>
    shape[0].map((_, idx) =>
      shape.map(row => row[idx])
    );
  const offset = (shape, x, y) =>
    shape.map((row, ridx) =>
      ridx - y < 0 || ridx - y >= shape.length ?
        Array(row.length).fill(0) :
        shape[ridx - y].map((_, cidx) =>
          cidx - x < 0 || cidx - x >= row.length ?
            0 :
            shape[ridx - y][cidx - x]));
  const applies = (v, ...methods) =>
    methods.reduce((v, [method, ...rest]) => method(v, ...rest), v);
  const shapedefs = {
    LONG: [
      "1111",
      "0000",
      "0000",
      "0000",
    ],
    RECT: [
      "1100",
      "1100",
      "0000",
      "0000",
    ],
    L: [
      "1000",
      "1000",
      "1100",
      "0000",
    ],
    Z: [
      "1100",
      "0110",
      "0000",
      "0000",
    ],
    T: [
      "1110",
      "0100",
      "0000",
      "0000",
    ],
  };
  const shapes = Object.entries(shapedefs).reduce((map, [k, v]) => ({
    ...map,
    [k]: v.map(row => Array.prototype.slice.call(row).map(v => v * 1))
  }), {});
  const patterns = [
    {
      name: 'LONG',
      forms: [
        applies(shapes.LONG, [offset, 0, 2]),
        applies(shapes.LONG, [rotate], [offset, 1, 0]),
      ],
    },
    {
      name: 'RECT',
      forms: [
        applies(shapes.RECT, [offset, 1, 1]),
      ],
    },
    {
      name: 'L',
      forms: [
        applies(shapes.L, [offset, 1, 0]),
        applies(shapes.L, [rotate], [offset, 0, -1]),
        applies(shapes.L, [rotate], [rotate], [offset, -1, 0]),
        applies(shapes.L, [rotate], [rotate], [rotate], [offset, 0, 1]),
      ],
    },
    {
      name: 'MIRROREDL',
      forms: [
        applies(shapes.L, [mirror], [offset, 0, 1]),
        applies(shapes.L, [mirror], [rotate], [offset, 1, 0]),
        applies(shapes.L, [mirror], [rotate], [rotate], [offset, 0, -1]),
        applies(shapes.L, [mirror], [rotate], [rotate], [rotate], [offset, -1, 0]),
      ],
    },
    {
      name: 'Z',
      forms: [
        applies(shapes.Z, [offset, 0, 1]),
        applies(shapes.Z, [rotate], [offset, 1, 0]),
      ],
    },
    {
      name: 'MIRROREDZ',
      forms: [
        applies(shapes.Z, [mirror], [offset, 0, 1]),
        applies(shapes.Z, [mirror], [rotate], [offset, 0, -1]),
      ],
    },
    {
      name: 'T',
      forms: [
        applies(shapes.T, [offset, 0, 2]),
        applies(shapes.T, [rotate], [offset, 1, 0]),
        applies(shapes.T, [rotate], [rotate], [offset, -1, -1]),
        applies(shapes.T, [rotate], [rotate], [rotate], [offset, -2, 1]),
      ]
    }
  ];
  return patterns;
})();

