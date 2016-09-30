var SIDE = {
  ME: { ID: 0, COLOR: '#f5e8bb' },
  OP: { ID: 1, COLOR: '#666' }
};

var ROLE = {
  BEE:          { ID: 0, IMG: 'bee_${side}.png',         IMGSIZE: [71, 56] },
  ANT:          { ID: 1, IMG: 'ant_${side}.png',         IMGSIZE: [66, 75] },
  GRASSHOPPER:  { ID: 2, IMG: 'grasshopper_${side}.png', IMGSIZE: [54, 83] },
  SPIDER:       { ID: 3, IMG: 'spider_${side}.png',      IMGSIZE: [71, 77] },
  BEETLE:       { ID: 4, IMG: 'beetle_${side}.png',      IMGSIZE: [51, 79] }
  /*
  MOSQUITO:     { ID: 5, IMG: 'mosquito_${side}.png'    , IMGSIZE: [88, 84]  },
  LADYBUG:      { ID: 6, IMG: 'ladybug_${side}.png'     , IMGSIZE: [90, 108] },
  PILLBUG:      { ID: 7, IMG: 'pillbug_${side}.png'     , IMGSIZE: [87, 111] }
  */
};

var PLAYER_TYPE = {
  HUMAN:  { ID: 0 },
  REMOTE: { ID: 1 },
  AI:     { ID: 2 }
};

var GAME_STATUS = {
  INITIAL: 0,
  IN_PROGRESS: 1,
  OVER: 2,
  ERROR: -1
};

module.exports = {
  SIDE: SIDE,
  ROLE: ROLE,
  PLAYER_TYPE: PLAYER_TYPE,
  GAME_STATUS: GAME_STATUS
};
