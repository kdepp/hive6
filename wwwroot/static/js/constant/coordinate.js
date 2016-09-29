var radiusFactor = 1 / 2;

var unitHexagonPoints = [
  [[-2, 0], [0, 0]],
  [[-1, 0], [0, 1]],
  [[1,  0], [0, 1]],
  [[2,  0], [0, 0]],
  [[1,  0], [0,-1]],
  [[-1, 0], [0,-1]],
];

var unitCenterDistance = [
  [[0,  0], [0,  2]],
  [[3,  0], [0,  1]],
  [[3,  0], [0, -1]],
  [[0,  0], [0, -2]],
  [[-3, 0], [0, -1]],
  [[-3, 0], [0,  1]],
];

module.exports = {
  RADIUS_FACTOR: radiusFactor,
  NS3_UNIT_HEXAGON_POINTS: unitHexagonPoints,
  NS3_UNIT_CENTER_OFFSETS: unitCenterDistance
};
