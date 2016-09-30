/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var gameFactory = __webpack_require__(2);
	
	var game = gameFactory({
	  document: document,
	  $boardContainer: document.getElementById('canvas_container'),
	  $toolbarContainers: [
	    document.getElementById('bar1'),
	    document.getElementById('bar2')
	  ]
	});
	
	console.log(game);


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var coreFactory    = __webpack_require__(3);
	var humanPlayer    = __webpack_require__(10);
	var boardFactory   = __webpack_require__(11);
	var toolbarFactory = __webpack_require__(14);
	var sampleChesses  = __webpack_require__(15);
	
	var x           = __webpack_require__(5);
	var dnd         = __webpack_require__(16);
	var dndBackend  = __webpack_require__(17);
	
	var CG = __webpack_require__(9);
	
	var gameFactory = function (options) {
	  var opts = Object.assign({
	    document: null,
	    $boardContainer: null,
	    $toolbarContainers: [],
	    playertypes: [CG.PLAYER_TYPE.HUMAN.ID, CG.PLAYER_TYPE.HUMAN.ID]
	  }, options);
	
	  if (opts.playertypes.length !== 2) {
	    throw new Error('Game Factory: must have two players');
	  }
	
	  if (!x.and(opts.playertypes.map(function (type) {
	    return [0, 1, 2].indexOf(type) !== -1;
	  }))) {
	    throw new Error('Game Factory: invalid player type');
	  }
	
	  // initialize dnd
	  var dndInstance = dnd({$container: opts.document.body});
	  dndInstance.backend(dndBackend());
	
	  // initialize core
	  var core = coreFactory({
	    coordinates: opts.coordinates
	  }, {
	    extension: false
	  });
	
	  // initialize board view
	  var vBoard = boardFactory({
	    document: opts.document,
	    $container: opts.$boardContainer,
	    dnd: dndInstance,
	    game: null,
	    samples: sampleChesses,
	    radius: 30,
	    coordinates: core.coordinates(),
	    canMove: function (sideId) {
	      return core.canMove(sideId);
	    }
	  });
	
	  core.on('NEW_MOVEMENT', function (data) {
	    vBoard.update(data);
	  });
	
	  vBoard.init();
	
	  // initialize players
	  var participants  = [];
	  var vToolbars     = [];
	
	  opts.playertypes.map(function (type, sideId) {
	    var chair = core.register(sideId);
	    var vToolbar = toolbarFactory({
	      document: opts.document,
	      $container: opts.$toolbarContainers[sideId],
	      dnd: dndInstance,
	      samples: sampleChesses,
	      sideId: sideId,
	      inventory: chair.inventory(),
	      isYourTurn: sideId === 0,
	      canMove: function () {
	        return chair.canMove();
	      }
	    });
	    var player;
	
	    if (type === CG.PLAYER_TYPE.HUMAN.ID) {
	      player = humanPlayer({
	        chair: chair
	      });
	
	      player.on('UPDATE_POSSIBLE_MOVE', function (data) {
	        vBoard.setAvailables(data.availables);
	      });
	      vToolbar.on('START_PLACE_' + sideId, function (data) {
	        player.mayPlace(data.roleId);
	      });
	      vBoard.on('START_MOVE_' + sideId, function (data) {
	        player.mayMove(data.src);
	      });
	      vBoard.on('MOVE_' + sideId, function (data) {
	        player.move(data.src, data.dst);
	      });
	      vBoard.on('PLACE_' + sideId, function (data) {
	        player.place(data.roleId, data.dst);
	      });
	      vBoard.addHumanControl(sideId);
	      vToolbar.addHumanControl(sideId);
	    } else if (type === CG.PLAYER_TYPE.REMOTE.ID) {
	      player = null;
	    } else if (type === CG.PLAYER_TYPE.AI.ID) {
	      player = null;
	    }
	
	    chair.on('TOGGLE_YOUR_TURN', function (data) {
	      if (data.on) {
	        player.prepareMove(data);
	        vToolbars[sideId].enable();
	      } else {
	        player.wait(data);
	        vToolbars[sideId].disable();
	      }
	    });
	
	    chair.on('INVENTORY_UPDATE', function (data) {
	      vToolbar.setInventory(data.inventory);
	    });
	
	    participants.push({
	      player: player,
	      chair: chair
	    });
	
	    vToolbars.push(vToolbar);
	
	    vToolbar.init();
	  });
	
	  return {
	    vBoard: vBoard,
	    vToolbars: vToolbars,
	    participants: participants,
	    core: core
	  };
	};
	
	module.exports = gameFactory;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var Eventer = __webpack_require__(4);
	var x = __webpack_require__(5);
	var pu = __webpack_require__(6);
	var m = __webpack_require__(8);
	
	var d3 = pu.d3;
	
	var calcInventory = function (board, coordinates, extension) {
	  var initial = x.repeat(2, [1, 3, 3, 2, 2]);
	
	  coordinates.forEach(function (c) {
	    var info = d3.getPoint(board, c);
	    initial[info.sideId][info.roleId] --;
	
	    if (initial[info.sideId][info.roleId]) {
	      throw new Error('calcInventory: inventory cannot be negative number');
	    }
	  });
	
	  return initial;
	};
	
	var coreFactory = function (store, options) {
	  var data = store || {};
	  var opts = Object.assign({
	    extension: false
	  }, options);
	  var coordinates, board;
	
	  var movements = data.movements || [];
	  var inventories = [];
	  var registered = [];
	
	  var setCoordinates = function (coords) {
	    coordinates = coords || [];
	    board = pu.convert.ns3InfoListToD3(
	      x.pluck('point', coordinates),
	      coordinates
	    );
	  };
	
	  setCoordinates(data.coordinates);
	  inventories = calcInventory(board, coordinates, opts.extension);
	
	  var stepCount = function () {
	    return movements.length;
	  };
	
	  var cloneData = function () {
	    return {
	      board: x.deepClone(board),
	      coordinates: x.deepClone(coordinates),
	      movements: x.deepClone(movements)
	    };
	  };
	
	  var notifyBoard = function (name, data) {
	    core.emit(name, data);
	  };
	
	  var notifyPlayer = function (sideId, name, data) {
	    registered.forEach(function (side) {
	      if (sideId !== side.sideId) return;
	      side.emit(name, data);
	    });
	  };
	
	  var notify = function (sideId, isPlace) {
	    notifyBoard('NEW_MOVEMENT', cloneData());
	    notifyPlayer(sideId,     'TOGGLE_YOUR_TURN', Object.assign({on: true},  cloneData()));
	    notifyPlayer(1 - sideId, 'TOGGLE_YOUR_TURN', Object.assign({on: false}, cloneData()));
	    if (isPlace) {
	      notifyPlayer(1 - sideId, 'INVENTORY_UPDATE', { inventory: inventories[1 - sideId] });
	    }
	  };
	
	  var fns = {
	    inventory: function (sideId) {
	      return inventories[sideId];
	    },
	    canMove: function (sideId) {
	      if (registered.length !== 2)  return false;
	      if (stepCount() === 0)        return sideId === 0;
	      return x.last(movements).sideId === 1 - sideId;
	    },
	    possiblePlacement: function (sideId) {
	      if (!fns.canMove(sideId)) return null;
	      return m.guessPlace(coordinates, sideId);
	    },
	    possibleMovement: function (sideId, src) {
	      if (!fns.canMove(sideId)) return null;
	      var roleId = d3.getPoint(board, src).roleId;
	      return m.guessMove(board, src, roleId);
	    },
	    place: function (sideId, roleId, dst) {
	      if (!fns.canMove(sideId)) {
	        throw new Error('CANNOT MOVE');
	      }
	
	      if (!m.checkPlace(board, sideId, dst)) {
	        throw new Error('INVALID PLACEMENT');
	      }
	
	      if (inventories[sideId][roleId] <= 0) {
	        throw new Error('OUT OF INVENTORY');
	      }
	
	      // modify board
	      var info   = pu.d3.getPoint(board, dst);
	      var zIndex = info ? (info.zIndex + 1) : 1;
	
	      inventories[sideId][roleId]--;
	      coordinates.push({
	        sideId: sideId,
	        roleId: roleId,
	        zIndex: zIndex,
	        point:  dst
	      });
	      setCoordinates(coordinates);
	
	      // update movements
	      movements.push({
	        type: 0,
	        sideId: sideId,
	        roleId: roleId,
	        src: null,
	        dst: dst
	      });
	
	      notify(1 - sideId, true);
	    },
	    move: function (sideId, src, dst) {
	      if (!fns.canMove(sideId)) {
	        throw new Error('CANNOT MOVE');
	      }
	
	      if (!m.checkMove(board, sideId, src, dst)) {
	        throw new Error('INVALID MOVEMENT');
	      }
	
	      // modify board
	      var info     = pu.d3.getPoint(board, dst);
	      var zIndex   = info ? (info.zIndex + 1) : 1;
	      var coord    = pu.d3.getPoint(board, src);
	
	      coord.point  = dst;
	      coord.zIndex = zIndex;
	      setCoordinates(coordinates);
	
	      // update movements
	      movements.push({
	        type: 1,
	        sideId: sideId,
	        roleId: coord.roleId,
	        src: src,
	        dst: dst
	      });
	
	      notify(1 - sideId, false);
	    }
	  };
	
	  var core = Eventer({
	    coordinates: function () {
	      return x.deepClone(coordinates);
	    },
	    canMove: function (sideId) {
	      return fns.canMove(sideId);
	    },
	    register: function (sideId) {
	      if (registered.find(function (item) { return item.sideId === sideId })) {
	        throw new Error('Game Register: players already full');
	      }
	
	      if ([0, 1].indexOf(sideId) === -1) {
	        throw new Error('Game Register: invalid sideId');
	      }
	
	      var obj = Object.keys(fns).reduce(function (prev, cur) {
	        var fn = fns[cur];
	
	        prev[cur] = fn.length > 1
	                      ? x.partial(fn)(sideId)
	                      : function () { return fn(sideId) };
	
	        return prev;
	      }, {});
	
	      obj.sideId = sideId;
	      obj = Eventer(obj);
	
	      registered.push(obj);
	      return obj;
	    }
	  });
	
	  return core;
	};
	
	module.exports = coreFactory;


/***/ },
/* 4 */
/***/ function(module, exports) {

	var _EventEmitter = function (_target) {
	  var target = _target || {};
	  var events = {};
	
	  var on = function (name, fn, once) {
	    var removeFn = function (name, fnGetter) {
	      return function () {
	        if (!events[name])  return;
	        var index = events[name].indexOf(fnGetter());
	        events[name].splice(index, 1);
	      };
	    };
	    var onceWrap = function (fn, remove) {
	      return function () {
	        var args = [].slice.apply(arguments);
	        fn.apply(null, args);
	        remove();
	      };
	    };
	
	    var remove = removeFn(name, function () {
	      return fn;
	    });
	
	    if (once) {
	      fn = onceWrap(fn, remove);
	    }
	
	    events[name] = events[name] || [];
	    events[name].push(fn);
	
	    return remove;
	  };
	
	  var off = function (name) {
	    events[name] = [];
	  };
	
	  var emit = function (name, ev) {
	    if (!events[name])  return;
	    events[name].forEach(function (fn) {
	      fn(ev);
	    });
	  };
	
	  return Object.assign(target, {
	    on: function (name, fn) {
	      return on(name, fn);
	    },
	    off: function (name) {
	      return off(name);
	    },
	    once: function (name, fn) {
	      return on(name, fn, true);
	    },
	    emit: function (name, ev) {
	      return emit(name, ev);
	    }
	  });
	};
	
	module.exports = _EventEmitter;


/***/ },
/* 5 */
/***/ function(module, exports) {

	var partial = function (fn) {
	  var len = fn.length;
	  var arbitary;
	
	  arbitary = function (curArgs, leftArgCnt) {
	    return function () {
	      var args = [].slice.apply(arguments);
	
	      if (args.length >= leftArgCnt) {
	        return fn.apply(null, curArgs.concat(args));
	      }
	
	      return arbitary(curArgs.concat(args), leftArgCnt - args.length);
	    }
	  };
	
	  return arbitary([], len);
	};
	
	var x = {
	  compose: function () {
	    var fns = [].slice.apply(arguments);
	    return fns.reduceRight(function (prev, cur) {
	      return function (arg) {
	        return cur(prev(arg));
	      };
	    })
	  },
	
	  partial: partial,
	
	  last: function (list) {
	    if (!list) {
	      throw new Error('Last: not a list');
	    }
	
	    return list[list.length - 1];
	  },
	
	  map: partial(function (fn, list) {
	    return list.map(fn);
	  }),
	
	  filter: partial(function (predicate, list) {
	    return list.filter(predicate);
	  }),
	
	  zipWith: function (fn) {
	    var lists = [].slice.call(arguments, 1);
	    var len   = Math.min.apply(null, lists.map(function (list) { return list.length; }));
	    var ret   = [];
	
	    for (var i = 0; i < len; i++) {
	      ret.push(fn.apply(null, lists.map(function (list) { return list[i]; })));
	    }
	
	    return ret;
	  },
	
	  zipWith2: partial(function (fn, list1, list2) {
	    return x.zipWith(fn, list1, list2);
	  }),
	
	  pluck: partial(function (key, list) {
	    return list.map(function (item) { return item[key]; });
	  }),
	
	  repeat: function (n, x) {
	    var ret = [];
	    var duplicate = function (item) {
	      if (Array.isArray(item))  return item.slice();
	      return item;
	    };
	
	    for (var i = 0; i < n; i++) {
	      ret.push(duplicate(x));
	    }
	    return ret;
	  },
	
	  loop: function (list, count) {
	    count = count || 1;
	    return list.slice(count).concat(list.slice(0, count));
	  },
	
	  equal: function (x, y) {
	    return x === y;
	  },
	
	  and: function (args) {
	    return args.reduce(function (prev, cur) {
	      return prev && cur;
	    }, true);
	  },
	
	  or: function (args) {
	    return args.reduce(function (prev, cur) {
	      return prev || cur;
	    }, false);
	  },
	
	  multi: partial(function (x, y) {
	    return x * y;
	  }),
	
	  add: partial(function (x, y) {
	    return x + y;
	  }),
	
	  flatten: function (list) {
	    return [].concat.apply([], list);
	  },
	
	  time: function (comment, fn) {
	    return function () {
	      var args = [].slice.apply(arguments);
	      var start, duration;
	
	      start = new Date() * 1;
	      var result = fn.apply(null, args);
	      duration = new Date() * 1 - start;
	      console.log(comment, duration, 'ms');
	      return result;
	    };
	  },
	
	  sprintf: function (str, data) {
	    return Object.keys(data).reduce(function (prev, cur) {
	      return prev.replace(new RegExp('\\$\\{' + cur + '\\}', 'g'), data[cur]);
	    }, str);
	  },
	
	  maxBy: function (options) {
	    var opts = Object.assign({
	      compare: function (a, b) { return a < b; }
	    }, options);
	
	    return opts.list.reduce(function (prev, cur, i) {
	      if (!opts.predicate(cur)) return prev;
	      if (opts.compare(prev.ret, opts.getter(cur, i))) return {ret: cur, index: i};
	      return prev;
	    }, {ret: null, index: -1});
	  },
	
	  product: function () {
	    var args = [].slice.apply(arguments);
	    var promiseArray = function (item) {
	      return Array.isArray(item) ? item : [item];
	    };
	    var flatten = function (list) {
	      return [].concat.apply([], list);
	    };
	
	    return args.reduce(function (prev, cur) {
	      return !prev ? cur : flatten(prev.map(function (item1) {
	        return cur.map(function (item2) {
	          return promiseArray(item1).concat(promiseArray(item2));
	        });
	      }));
	    }, null);
	  },
	
	  permute: function (list) {
	    var permutation = function (n) {
	      var helper = function (n, seq, result) {
	        if (seq.length >= n) {
	          result.push(seq);
	          return result;
	        }
	
	        for (var i = 0; i < n; i++) {
	          if (seq.indexOf(i) === -1) {
	            result = helper(n, seq.concat([i]), result);
	          }
	        }
	
	        return result;
	      };
	      return helper(n, [], []);
	    };
	
	    return permutation(list.length).map(function (seq) {
	      return seq.map(function (index) {
	        return list[index];
	      });
	    });
	  },
	
	  // C (2, N)
	  combination2: function (list) {
	    var len = list.length;
	    var ret = [];
	    var i, j;
	
	    for (i = 0; i < len - 1; i++) {
	      for (j = i + 1; j < len; j++) {
	        ret.push([list[i], list[j]]);
	      }
	    }
	
	    return ret;
	  },
	
	  findValue: function (object, path, value) {
	    var tokens = path.split('.');
	    var follow = function (object, keys) {
	      return  keys.reduce(function (prev, cur) {
	        return prev && prev[cur];
	      }, object);
	    };
	
	    return Object.keys(object).reduce(function (prev, cur) {
	      return prev || (follow(object[cur], tokens) === value ? object[cur] : null);
	    }, null);
	  },
	
	  deepClone: function (data) {
	    // FIXME: should recursively parse data
	    return JSON.parse(JSON.stringify(data));
	  }
	};
	
	module.exports = x;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var x = __webpack_require__(5);
	var CC = __webpack_require__(7);
	
	// Note: use hash table to remove duplicates for performance
	var uniquePoints = function (points) {
	  var result = [];
	  var dict = {};
	  var hash = function (point) { return x.flatten(point).join('-'); };
	
	  points.forEach(function (point) {
	    var key = hash(point);
	    if (!dict[key]) {
	      dict[key] = true;
	      result.push(point);
	    }
	  });
	
	  return result;
	};
	
	var ns3 = {
	  addPoint: x.zipWith2(x.zipWith2(x.add)),
	
	  negPoint: x.map(x.map(x.multi(-1))),
	
	  samePoint: x.partial(function (p1, p2) {
	    return x.and(x.zipWith2(function (xs, ys) {
	      return x.and(x.zipWith2(x.equal, xs, ys))
	    }, p1, p2));
	  }),
	
	  uniquePoints: uniquePoints
	};
	
	var d2 = {
	  addPoint: x.zipWith2(x.add),
	
	  negPoint: x.map(x.multi(-1)),
	
	  uniquePoints: uniquePoints,
	
	  /*
	   * Test whether a point is in a hexagon
	   */
	
	  inHexagon: function (d2Center, radius, pos) {
	    var lineFx = function (p1, p2) {
	      var k = (p2[1] - p1[1]) / (p2[0] - p1[0]);
	
	      if (Math.abs(k) === Infinity) return p2[0];
	
	      var x1 = p1[0];
	      var y1 = p1[1];
	
	      return function (x) {
	        return k * x + (y1 - k * x1);
	      };
	    };
	
	    var test = x.partial(function (point, fx, predicate) {
	      if (typeof fx === 'number')  return predicate === Math.sign(point[0] - fx);
	      return predicate === Math.sign(point[1] - fx(point[0]));
	    });
	
	    var adjusted = x.compose(
	      d2.negPoint,
	      x.map(x.multi(2 / radius)),
	      d2.addPoint(d2.negPoint(d2Center))
	    )(pos);
	
	    var d2HexagonPoints = x.map(convert.ns3ToD2, CC.NS3_UNIT_HEXAGON_POINTS);
	    var fxs = x.zipWith(
	      lineFx,
	      x.loop(d2HexagonPoints, 1),
	      d2HexagonPoints
	    );
	    var predicates = [-1, -1, -1, 1, 1, 1];
	    var result = x.zipWith(test(adjusted), fxs, predicates);
	
	    return x.and(result);
	  }
	};
	
	/*
	 * 3 Dimension Hexagon Axis Functions
	 * eg. [x, y, z]
	 *
	 *       X  --------  -Z
	 *         /        \
	 *    -Y  /          \  Y
	 *        \          /
	 *         \        /
	 *       Z  --------  -X
	 *
	 */
	
	var d3 = {
	  addPoint: x.zipWith2(x.add),
	
	  negPoint: x.map(x.multi(-1)),
	
	  samePoint: x.partial(function (p1, p2) {
	    if (!p1 || !p2) return false;
	    return x.and(x.zipWith2(x.equal, p1, p2));
	  }),
	
	  uniquePoints: uniquePoints,
	
	  around: function (triple) {
	    return x.permute([-1, 0, 1]).map(x.zipWith2(x.add, triple));
	  },
	
	  setPoint: function (data, triple, value) {
	    var entry = data;
	
	    triple.forEach(function (index, i) {
	      if (i < 2) {
	        entry[index] = entry[index] || {};
	        entry = entry[index];
	      } else {
	        // sort by zIndex
	        entry[index] = entry[index] ? entry[index].concat([value]) : [value];
	        entry[index] = entry[index].sort(function (a, b) {
	          return b.zIndex - a.zIndex;
	        });
	      }
	    });
	  },
	
	  getPoint: x.partial(function (data, triple) {
	    if (!triple)  return null;
	
	    var ret = triple.reduce(function (prev, cur) {
	      return prev && prev[cur];
	    }, data);
	
	    // return the topmost element;
	    return ret && ret[0];
	  })
	};
	
	var convert = {
	  ns3ToD2: function (point) {
	    return x.map(function (z) {
	      return z[0] + z[1] * Math.sqrt(3);
	    }, point);
	  },
	
	  ns3ToD3: function (point2d) {
	    var x = point2d[0][0];
	    var y = point2d[1][1];
	    return [
	      (x / 3 + y) / (-2),
	      x / 3,
	      (y - x / 3) / 2
	    ];
	  },
	
	  d3ToNs3: function (point3d) {
	    var x = point3d[0];
	    var y = point3d[1];
	    // var z = point3d[2];
	
	    return [[3 * y, 0], [0, -2 * x - y]];
	  },
	
	  ns3InfoListToD3: function (points, pinfos) {
	    var ret = {};
	    points.forEach(function (point, i) {
	      d3.setPoint(ret, point, pinfos[i]);
	    });
	    return ret;
	  }
	};
	
	module.exports = {
	  ns3: ns3,
	  d3: d3,
	  d2: d2,
	  convert: convert
	};


/***/ },
/* 7 */
/***/ function(module, exports) {

	var radiusFactor = 1 / 2;
	
	var unitHexagonPoints = [
	  [[-2, 0], [0,  0]],
	  [[-1, 0], [0,  1]],
	  [[1,  0], [0,  1]],
	  [[2,  0], [0,  0]],
	  [[1,  0], [0, -1]],
	  [[-1, 0], [0, -1]]
	];
	
	var unitCenterDistance = [
	  [[0,  0], [0,  2]],
	  [[3,  0], [0,  1]],
	  [[3,  0], [0, -1]],
	  [[0,  0], [0, -2]],
	  [[-3, 0], [0, -1]],
	  [[-3, 0], [0,  1]]
	];
	
	module.exports = {
	  RADIUS_FACTOR: radiusFactor,
	  NS3_UNIT_HEXAGON_POINTS: unitHexagonPoints,
	  NS3_UNIT_CENTER_OFFSETS: unitCenterDistance
	};


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var x  = __webpack_require__(5);
	var pu = __webpack_require__(6);
	var CC = __webpack_require__(7);
	var CG = __webpack_require__(9);
	
	var d3 = pu.d3;
	var convert = pu.convert;
	var ROLE = CG.ROLE;
	
	var d3UnitCenterDistance = CC.NS3_UNIT_CENTER_OFFSETS.map(convert.ns3ToD3);
	
	var aroundDirections = function (d3point, d3Index) {
	  var isOccupied = function (point) {
	    return !!d3.getPoint(d3Index, point);
	  };
	
	  return d3.around(d3point)
	          .filter(isOccupied)
	          .map(d3.addPoint(d3.negPoint(d3point)));
	};
	
	var brokenAroundDirectionCombinations = function (d3point, d3Index) {
	  var existedDirectionIndexes = aroundDirections(d3point, d3Index)
	                                .map(function (direction) {
	                                  return d3UnitCenterDistance.findIndex(function (d) {
	                                    return d3.samePoint(direction, d);
	                                  });
	                                })
	                                .sort();
	
	  console.log('aroundDirection in broken', aroundDirections(d3point, d3Index));
	  console.log('d3Unit', d3UnitCenterDistance);
	
	  var grouped = existedDirectionIndexes.reduce(function (prev, cur) {
	    var lastGroup  = prev[prev.length - 1];
	    var firstGroup = prev[0];
	    var last       = lastGroup && lastGroup[lastGroup.length - 1];
	    var first      = firstGroup && firstGroup[0];
	
	    console.log('first, last', first, last);
	    if (lastGroup === undefined) return [[cur]];
	    if (last  === cur - 1) {
	      lastGroup.push(cur);
	      return prev;
	    }
	
	    if (first === (cur + 1) % d3UnitCenterDistance.length) {
	      firstGroup.push(cur);
	      return prev;
	    }
	
	    return prev.concat([[cur]]);
	  }, []);
	
	  console.log('grouped', grouped);
	
	  grouped = x.pluck(0, grouped);
	
	  return x.combination2(
	    grouped.map(function (index) { return d3UnitCenterDistance[index] })
	  );
	};
	
	var brokenAroundPointCombinations = function (d3point, d3Index) {
	  var result = brokenAroundDirectionCombinations(d3point, d3Index);
	  return !result.length ? [] : x.map(x.map(d3.addPoint(d3point)))(result);
	};
	
	var filterKeepOneHive = x.time('filterKeepOneHive', function (d3Index, d3origin, availables) {
	  console.log('!!!!!!!!!!!! filterKeepOneHive !!!!!!!!!!');
	  console.log('availables, ' , availables);
	  var __d3GetPoint = function (data, triple, level) {
	    if (!triple)  return null;
	
	    var ret = triple.reduce(function (prev, cur) {
	      return prev && prev[cur];
	    }, data);
	
	    return ret && ret[level || 0];
	  };
	
	  // pretend that the movement is complete
	  var _d3GetPoint = function (d3Index, d3point, d3target) {
	    if (d3.samePoint(d3point, d3target)) return __d3GetPoint(d3Index, d3origin);
	    if (d3.samePoint(d3point, d3origin)) return __d3GetPoint(d3Index, d3origin, 1);
	    return __d3GetPoint(d3Index, d3point);
	  };
	
	  var isConnected = function (d3p1, d3p2, d3target) {
	    var isOccupied = function (d3point) {
	      return !!_d3GetPoint(d3Index, d3point, d3target);
	    };
	    var aroundOccupied = function (d3point) {
	      return d3.around(d3point).filter(isOccupied);
	    };
	
	    var helper = function (current, target, visited) {
	      // console.log('helper', arguments);
	      if (d3.samePoint(current, target)) return true;
	      visited.push(current);
	
	      return x.or(aroundOccupied(current).filter(function (point) {
	        return !visited.find(function (p) {
	          return d3.samePoint(p, point);
	        });
	      }).map(function (point) {
	        return helper(point, target, visited);
	      }));
	    };
	
	    return helper(d3p1, d3p2, []);
	  };
	
	  var brokenCombinations = brokenAroundPointCombinations(d3origin, d3Index);
	  if (brokenCombinations.length === 0)  return availables;
	
	  var check = function (d3target) {
	    return x.and(brokenCombinations.map(function (tuple) {
	      console.log('????????????? in brokenCombinations loop ???????????');
	      return isConnected(tuple[0], tuple[1], d3target);
	    }));
	  };
	
	  if (check(null))  return availables;
	  return availables.filter(check);
	});
	
	var directionBesides = function (direction) {
	  var index = d3UnitCenterDistance.findIndex(d3.samePoint(direction));
	
	  if (index === -1) {
	    throw new Error('direction invalid', direction);
	  }
	
	  var len = d3UnitCenterDistance.length;
	  var prevIndex = (index - 1 + len) % len;
	  var nextIndex = (index + 1) % len;
	
	  return [d3UnitCenterDistance[prevIndex], d3UnitCenterDistance[nextIndex]];
	};
	
	var walkOneStep = function (options) {
	  var opts = options || {};
	  console.log('walkOneStep', opts);
	
	  return function (base, d3point, d3Index, options) {
	    var neighbors = d3.around(d3point).filter(function (point) {
	      return !!d3.getPoint(d3Index, point);
	    });
	
	    return d3.around(d3point).filter(function (point) {
	      if (d3.getPoint(d3Index, point)) return false;
	
	      var arounds = d3.around(point);
	      var shareNeighbors = arounds.filter(function (subPoint) {
	        if (d3.samePoint(subPoint, base))  return false;
	        return neighbors.find(function (neighbor) {
	          return d3.samePoint(subPoint, neighbor);
	        });
	      });
	
	      if (shareNeighbors < 1) return false;
	      if (opts.skipNarrow)    return true;
	
	      // test narrow
	      var direction  = d3.addPoint(point, d3.negPoint(d3point));
	      var besides    = directionBesides(direction);
	      var inNarrow   = x.compose(
	        function (list) { return x.and(list); },
	        x.map(
	          x.compose(
	            function (info) { return !!info },
	            d3.getPoint(d3Index),
	            // should not count basePoint as a narrow boundary
	            function (point) { return d3.samePoint(base, point) ? null : point },
	            d3.addPoint(d3point)
	          )
	        )
	      )(besides);
	
	      return !inNarrow;
	    });
	  };
	};
	
	var climbOneStep = function () {
	  return function (base, d3point, d3Index) {
	    return d3.around(d3point).filter(function (point) {
	      if (d3.samePoint(point, base)) return false;
	      return !!d3.getPoint(d3Index, point);
	    });
	  };
	};
	
	var guess = function (oneStep, d3point, d3Index, options) {
	  var opts = Object.assign({
	    step: 1
	  }, options);
	  var helper = function (oneStep, base, d3point, d3Index, step, result) {
	    if (step === 0) return result;
	
	    var list = oneStep(base, d3point, d3Index).filter(function (point) {
	      return !result.find(function (item) {
	        return item.list.find(function (found) {
	          return d3.samePoint(found, point);
	        });
	      })
	    });
	
	    if (list.length === 0)  return result;
	    result = result.concat([{left: step - 1, list: list}]);
	
	    list.forEach(function (point) {
	      result = helper(oneStep, base, point, d3Index, step - 1, result);
	    });
	
	    return result;
	  };
	
	  var ret = helper(oneStep, d3point, d3point, d3Index, opts.step, []);
	  return ret;
	};
	
	var MOVEMENT = {
	  WALK: function (opts, d3point, d3Index) {
	    var result = guess(walkOneStep(), d3point, d3Index, opts);
	    if (opts.exact) result = result.filter(function (item) { return item.left === 0; });
	    return x.flatten(x.pluck('list', result));
	  },
	  JUMP: function (options, d3point, d3Index) {
	    return d3UnitCenterDistance.map(function (forward) {
	      var next = d3.addPoint(d3point, forward);
	      var bank = null;
	
	      while (d3.getPoint(d3Index, next)) {
	        bank = next;
	        next = d3.addPoint(next, forward);
	      }
	
	      return bank ? next : null;
	    }).filter(function (item) { return item; });
	  },
	  CLIMB: function (options, d3point, d3Index) {
	    var opts = Object.assign({
	      step: 1
	    }, options);
	    var pinfo = d3.getPoint(d3Index, d3point);
	    console.log('climb zIndex', pinfo.zIndex, pinfo.role);
	
	    var result1 = guess(climbOneStep(), d3point, d3Index, opts);
	    var result2 = guess(walkOneStep({skipNarrow: pinfo.zIndex > 1}),  d3point, d3Index, opts);
	
	    return [].concat(
	      x.flatten(x.pluck('list', result1)),
	      x.flatten(x.pluck('list', result2))
	    );
	  }
	};
	
	/*
	 * Factory for Hive6 Controller
	 */
	
	var guessMove = function (roleId, point, d3Index) {
	  console.log(arguments);
	  var result;
	
	  switch (roleId) {
	    case ROLE.BEE.ID:
	      result = MOVEMENT.WALK({step: 1}, point, d3Index);
	      break;
	
	    case ROLE.ANT.ID:
	      result = MOVEMENT.WALK({step: Infinity}, point, d3Index);
	      break;
	
	    case ROLE.SPIDER.ID:
	      result = MOVEMENT.WALK({step: 3, exact: true}, point, d3Index);
	      break;
	
	    case ROLE.GRASSHOPPER.ID:
	      result = MOVEMENT.JUMP({}, point, d3Index);
	      break;
	
	    case ROLE.BEETLE.ID:
	      result = MOVEMENT.CLIMB({}, point, d3Index);
	      break;
	
	    default:
	      result = MOVEMENT.WALK({step: 1}, point, d3Index);
	  }
	
	  return filterKeepOneHive(d3Index, point, result);
	};
	
	var guessPlace = function (coordinates, sideId) {
	  var onSide = x.partial(function (sideId, coord) {
	    return coord.sideId === sideId;
	  });
	  var findCoord = function (point) {
	    return coordinates.find(function (coord) {
	      return pu.d3.samePoint(coord.point, point);
	    });
	  };
	
	  // no chess on board
	  if (coordinates.length === 0) {
	    return [[0, 0, 0]];
	  }
	
	  // no our side's chess on board
	  if (coordinates.filter(onSide(sideId)).length === 0) {
	    return x.compose(
	      pu.d3.uniquePoints,
	      x.flatten,
	      x.map(pu.d3.around),
	      x.pluck('point')
	    )(coordinates);
	  }
	
	  // normal cases
	  return x.compose(
	    x.filter(function (point) {
	      return !pu.d3.around(point).find(function (sub) {
	        var found = findCoord(sub);
	        return found && found.sideId === 1 - sideId;
	      });
	    }),
	    x.filter(function (point) { return !findCoord(point) }),
	    pu.d3.uniquePoints,
	    x.flatten,
	    x.map(pu.d3.around),
	    x.pluck('point'),
	    x.filter(onSide(sideId))
	  )(coordinates)
	};
	
	module.exports = {
	  guessPlace: guessPlace,
	  guessMove: function (board, point, roleId) {
	    return guessMove(roleId, point, board);
	  },
	  checkPlace: function () {
	    return true;
	  },
	  checkMove: function () {
	    return true;
	  }
	};


/***/ },
/* 9 */
/***/ function(module, exports) {

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
	
	module.exports = {
	  SIDE: SIDE,
	  ROLE: ROLE,
	  PLAYER_TYPE: PLAYER_TYPE
	};


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var Eventer = __webpack_require__(4);
	
	var humanPlayer = function (options) {
	  var opts = Object.assign({
	    chair: null
	  }, options);
	
	  if (!opts.chair) {
	    throw new Error('Human Player: chair is required');
	  }
	
	  var player = Eventer({
	    mayMove: function (src) {
	      if (!opts.chair.canMove()) return;
	      var availables = opts.chair.possibleMovement(src);
	      player.emit('UPDATE_POSSIBLE_MOVE', {availables: availables});
	    },
	    mayPlace: function () {
	      if (!opts.chair.canMove()) return;
	      var availables = opts.chair.possiblePlacement();
	      player.emit('UPDATE_POSSIBLE_MOVE', {availables: availables});
	    },
	    prepareMove: function () {
	      // Human do nothing in prepareMove
	    },
	    wait: function () {
	      // Human do nothing in wait
	    },
	    move: function (src, dst) {
	      if (!opts.chair.canMove()) return;
	      return opts.chair.move(src, dst);
	    },
	    place: function (roleId, dst) {
	      if (!opts.chair.canMove()) return;
	      return opts.chair.place(roleId, dst);
	    }
	  });
	
	  return player;
	};
	
	module.exports = humanPlayer;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var x  = __webpack_require__(5);
	var pu = __webpack_require__(6);
	var cu = __webpack_require__(12);
	var du = __webpack_require__(13);
	var CG = __webpack_require__(9);
	var CC = __webpack_require__(7);
	var Eventer = __webpack_require__(4);
	
	var ROLE = CG.ROLE;
	var SIDE = CG.SIDE;
	
	var boardFactory = function (_opts) {
	  var opts = Object.assign({
	    document: null,
	    $container: null,
	    dnd: null,
	    samples: null,
	    radius: 30,
	    coordinates: null,
	    canMove: null
	  }, _opts);
	  var radius = opts.radius;
	
	  var origin        = null;
	  var $canvas       = null;
	  var ctx           = null;
	  var humanSideIds  = [];
	  var availables    = [];
	  var coordinates   = null;
	
	  var update = function (data, noRender) {
	    coordinates = data.coordinates || [];
	    if (!noRender)  _render();
	  };
	
	  update({ coordinates: opts.coordinates }, true);
	  /*
	   * Board Helper Functions
	   */
	  var transform = null;
	
	  var _init = function () {
	    var width  = parseInt(du.getStyle(opts.$container, 'width'), 10);
	    var height = parseInt(du.getStyle(opts.$container, 'height'), 10);
	    $canvas = opts.document.createElement('canvas');
	    $canvas.width  = width;
	    $canvas.height = height;
	    du.setStyle($canvas, {
	      width:  width + 'px',
	      height: height + 'px'
	    });
	    ctx    = $canvas.getContext('2d');
	    origin = [[width / 2, 0], [height / 2, 0]];
	    opts.$container.appendChild($canvas);
	
	    transform = x.compose(
	      pu.convert.ns3ToD2,
	      pu.ns3.addPoint(origin),
	      x.map(x.map(x.multi(radius * CC.RADIUS_FACTOR))),
	      pu.convert.d3ToNs3
	    );
	
	    opts.dnd.addSource({
	      $dom: $canvas,
	      onDragStart: function (ev) {
	        var index = coordinates.findIndex(function (coord) {
	          return pu.d2.inHexagon(transform(coord.point), radius, [ev.localX, ev.localY]);
	        });
	        var found = coordinates[index];
	
	        if (!found) return false;
	        if (!opts.canMove(found.sideId))  return false;
	
	        vBoard.emit('START_MOVE_' + found.sideId, { src: found.point });
	        found.isDragging = true;
	        setTimeout(_render);
	
	        return [
	          opts.samples[found.sideId][found.roleId],
	          {
	            sideId: found.sideId,
	            roleId: found.roleId,
	            from: 'board',
	            originPos: found.point,
	            boardIndex: index
	          }
	        ];
	      },
	      onDragEnd: function (ev) {
	        coordinates[ev.dragging.type.boardIndex].isDragging = false;
	        setTimeout(_render);
	      }
	    });
	
	    opts.dnd.addTarget({
	      $dom: $canvas,
	      onMove: function (ev) {
	        /*
	        if (!ev.dragging) return;
	        if (isDragging) return;
	        isDragging = true;
	
	        var type = ev.dragging.type;
	        var onSide = x.partial(function (sideId, item, i) {
	          return coordinates[i].side === sideId;
	        });
	
	        if (type.boardIndex === undefined) {
	          // Dragging from toolbar
	          if (points.length === 0) {
	            availables = [[0, 0, 0]].map(pu.convert.d3ToNs3);
	          } else if (points.filter(onSide(type.sideId)).length === 0) {
	            availables = x.compose(pu.d3.uniquePoints, x.flatten)(
	              points.map(pu.convert.ns3ToD3).map(pu.d3.around)
	            ).map(pu.convert.d3ToNs3);
	          } else {
	            availables = x.compose(pu.d3.uniquePoints, x.flatten)(
	              points.filter(onSide(type.sideId)).map(pu.convert.ns3ToD3).map(pu.d3.around)
	            ).filter(function (coord) {
	              if (pu.d3.getPoint(d3Index, coord)) return false;
	              return !pu.d3.around(coord).find(function (subCoord) {
	                var pinfo = pu.d3.getPoint(d3Index, subCoord);
	                return pinfo && pinfo.side === 1 - type.sideId;
	              })
	            }).map(pu.convert.d3ToNs3);
	          }
	        } else {
	          // Dragging from board
	          availables = movement(type.roleId, pu.convert.ns3ToD3(type.originPos), d3Index);
	        }
	
	        _render();
	        */
	      },
	      onDragLeave: function (ev) {
	        // isDragging = false;
	        // _render();
	      },
	      onDrop: function (ev) {
	        var dst = availables.find(function (point) {
	          return pu.d2.inHexagon(transform(point), radius, [ev.localX, ev.localY]);
	        });
	
	        if (!dst) {
	          _render();
	          return false;
	        }
	
	        if (!ev.dragging) return false;
	        if (humanSideIds.indexOf(ev.dragging.type.sideId) === -1) return false;
	
	        if (ev.dragging.type.boardIndex !== undefined) {
	          vBoard.emit('MOVE_' + ev.dragging.type.sideId, {
	            src: ev.dragging.type.originPos,
	            dst: dst
	          });
	        } else {
	          vBoard.emit('PLACE_' + ev.dragging.type.sideId, {
	            roleId: ev.dragging.type.roleId,
	            dst: dst
	          });
	        }
	
	        availables = [];
	        setTimeout(_render);
	        return true;
	      }
	    });
	  };
	
	  var _render = function () {
	    cu.clearCanvas(ctx);
	
	    coordinates.map(function (coord, i) {
	      return i;
	    }).sort(function (a, b) {
	      return coordinates[a].zIndex - coordinates[b].zIndex;
	    }).forEach(function (i) {
	      var coord = coordinates[i];
	      var side  = x.findValue(SIDE, 'ID', coord.sideId);
	      var role  = x.findValue(ROLE, 'ID', coord.roleId);
	
	      cu.marginHexagon(ctx, {
	        center: transform(coord.point),
	        radius: radius,
	        margin: 1,
	        fillStyle: coord.isDragging ? 'rgba(149, 145, 145, 0.5)' : side.COLOR,
	        image: coord.isDragging ? null : x.sprintf(role.IMG, {side: side.ID ? 'op' : 'me'}),
	        imageSize: role.IMGSIZE,
	        text: i
	      });
	    });
	
	    availables.forEach(function (point) {
	      cu.marginHexagon(ctx, {
	        center: transform(point),
	        radius: radius,
	        margin: 1,
	        fillStyle: 'rgba(186, 250, 66, 0.5)'
	      });
	    });
	  };
	
	  /*
	   * instance returned
	   */
	  var vBoard = Eventer({
	    init: function () {
	      _init();
	      _render();
	    },
	    render: function () {
	      _render();
	    },
	    update: function (data) {
	      return update(data);
	    },
	    setAvailables: function (list) {
	      availables = list;
	      _render();
	    },
	    addHumanControl: function (sideId) {
	      humanSideIds.push(sideId);
	    }
	  });
	
	  return vBoard;
	};
	
	module.exports = boardFactory;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/* global Image */
	
	var x = __webpack_require__(5);
	var pu = __webpack_require__(6);
	var CC = __webpack_require__(7);
	var CG = __webpack_require__(9);
	
	var setContext = function (ctx, list) {
	  var old = list.map(function (tuple) {
	    return [tuple[0], ctx[tuple[0]]];
	  });
	  var change = function (ctx, list) {
	    list.forEach(function (tuple) {
	      ctx[tuple[0]] = tuple[1];
	    });
	  };
	
	  change(ctx, list);
	  return function () {
	    change(ctx, old);
	  };
	};
	
	var clearCanvas = function (ctx) {
	  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	};
	
	/*
	 * Draw Hexagon on Canvas, based on a N(sqrt3) center point.
	 */
	
	var hexagon = function (ctx, pCenter, radius, isStroke) {
	  var points = x.map(
	    x.compose(
	      pu.d2.addPoint(pCenter),
	      pu.convert.ns3ToD2,
	      x.map(x.map(x.multi(radius * CC.RADIUS_FACTOR)))
	    ),
	    CC.NS3_UNIT_HEXAGON_POINTS
	  );
	
	  ctx.beginPath();
	  ctx.moveTo.apply(ctx, points[points.length - 1]);
	
	  points.forEach(function (point) {
	    ctx.lineTo.apply(ctx, point);
	  });
	
	  ctx.closePath();
	
	  if (isStroke) {
	    ctx.stroke()
	  } else {
	    ctx.fill();
	  }
	};
	
	var imgUrl = function (imageName) {
	  return '/static/img/pieces/' + imageName;
	};
	
	var calcRect = function (center, sideMax, size) {
	  var ratio = sideMax / Math.max.apply(null, size);
	  var tsize = x.map(x.multi(ratio), size);
	  return {
	    top: center[1] - tsize[1] / 2,
	    left: center[0] - tsize[0] / 2,
	    width: tsize[0],
	    height: tsize[1]
	  };
	};
	
	var drawChessImage = function (ctx, center, radius, image, size) {
	  var sideMax = Math.sqrt(3) * radius * 0.7;
	  var rect = calcRect(center, sideMax, size);
	  var $img = ROLE_IMAGES[image];
	  var draw = function () {
	    ctx.drawImage($img, rect.left, rect.top, rect.width, rect.height);
	  };
	
	  if ($img.loaded) {
	    draw();
	  } else {
	    $img.addEventListener('load', draw);
	  }
	};
	
	var marginHexagon = function (ctx, options) {
	  var opts = Object.assign({
	    fillStyle: '#666',
	    marginStyle: 'rgb(255, 255, 255)',
	    center: [100, 100],
	    radius: 50,
	    margin: 3
	  }, options);
	
	  var resetStyle = setContext(ctx, [
	    ['fillStyle', opts.fillStyle],
	    ['strokeStyle', opts.marginStyle],
	    ['lineWidth', opts.margin]
	  ]);
	
	  hexagon(ctx, opts.center, opts.radius);
	  hexagon(ctx, opts.center, opts.radius - Math.floor(opts.margin / 2 - 0.1), true);
	
	  /*
	  if (opts.text !== undefined) {
	    resetFontStyle = setContext(ctx, [['fillStyle', '#000']]);
	    console.log(opts.text,  opts.center[0], opts.center[1])
	    ctx.fillText(opts.text, opts.center[0], opts.center[1]);
	    resetFontStyle();
	  }
	  */
	
	  if (opts.image && opts.imageSize) {
	    drawChessImage(ctx, opts.center, opts.radius, opts.image, opts.imageSize);
	  }
	
	  resetStyle();
	};
	
	var ROLE_IMAGES = Object.keys(CG.ROLE).reduce(function (prev, cur) {
	  ['me', 'op'].forEach(function (type) {
	    var imageName = x.sprintf(CG.ROLE[cur].IMG, {side: type});
	    var $img = new Image();
	
	    $img.src = imgUrl(imageName);
	    $img.addEventListener('load', function () { this.loaded = true; });
	    prev[imageName] = $img;
	  });
	  return prev;
	}, {});
	
	module.exports = {
	  setContext: setContext,
	  marginHexagon: marginHexagon,
	  clearCanvas: clearCanvas,
	  imgUrl: imgUrl
	};


/***/ },
/* 13 */
/***/ function(module, exports) {

	/* global getComputedStyle */
	
	module.exports = {
	  setStyle: function ($dom, style) {
	    Object.keys(style).forEach(function (key) {
	      $dom.style[key] = style[key];
	    });
	  },
	
	  getStyle: function (dom, styleName) {
	    if (!dom)   throw new Error('getStyle: dom not exist');
	    return getComputedStyle(dom)[styleName];
	  },
	
	  mousePosition: function (dom, ev) {
	    var rect = dom.getBoundingClientRect();
	    return [
	      ev.clientX - rect.left,
	      ev.clientY - rect.top
	    ];
	  }
	}


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var x  = __webpack_require__(5);
	var pu = __webpack_require__(6);
	var cu = __webpack_require__(12);
	var du = __webpack_require__(13);
	var CG = __webpack_require__(9);
	var Eventer = __webpack_require__(4);
	
	var ROLE = CG.ROLE;
	var SIDE = CG.SIDE;
	
	var toolbarFactory = function (options) {
	  var opts = Object.assign({
	    dnd: null,
	    samples: null,
	    $container: null,
	    inventory: null,
	    sideId: null
	  }, options);
	  var inventory = opts.inventory;
	  var $canvas   = null;
	  var ctx       = null;
	  var playerCommonStyle = {
	    position: 'absolute',
	    top: '15px',
	    width: '150px',
	    height: '560px',
	    border: '1px solid #ccc'
	  };
	  var playerConfig = { style: { left: '15px' }, title: '方方' };
	  var offsetX = 30;
	  var offsetY = 80;
	  var radius = 30;
	  var centers = inventory.map(function (c, index) {
	    return [offsetX + radius, offsetY + 2 * radius * index];
	  });
	  var humanSideIds = [];
	  var isYourTurn = opts.isYourTurn;
	
	  var pos2roleId = function (x, y) {
	    return centers.findIndex(function (center) {
	      return pu.d2.inHexagon(center, radius, [x, y]);
	    });
	  };
	
	  var _init = function () {
	    $canvas = (function () {
	      var $dom = document.createElement('canvas');
	      du.setStyle($dom, Object.assign({}, playerCommonStyle, playerConfig.style));
	      opts.$container.appendChild($dom);
	
	      opts.dnd.addSource({
	        $dom: $dom,
	        onDragStart: function (ev) {
	          if (humanSideIds.indexOf(opts.sideId) === -1) return null;
	          if (!opts.canMove())  return null;
	
	          var roleId = pos2roleId(ev.localX, ev.localY);
	          if (roleId === -1) return null;
	          if (inventory[roleId] <= 0) return null;
	
	          vToolbar.emit('START_PLACE_' + opts.sideId, {roleId: roleId});
	
	          return [
	            opts.samples[opts.sideId][roleId],
	            {
	              sideId: opts.sideId,
	              roleId: roleId,
	              from: 'toolbar',
	              originPos: null
	            }
	          ];
	        },
	        onDragEnd: function (ev) {
	          // if (!ev.success || !ev.dragging) return;
	          // opts.inventory[i][ev.dragging.type.roleId] --;
	          // _renderPlayers();
	        }
	      });
	
	      return $dom;
	    })();
	
	    ctx = $canvas.getContext('2d');
	    _renderPlayer();
	  };
	
	  var _renderPlayer = function () {
	    var reset;
	
	    ctx.canvas.width  = parseInt(playerCommonStyle.width, 10);
	    ctx.canvas.height = parseInt(playerCommonStyle.height, 10);
	
	    du.setStyle(ctx.canvas, {
	      backgroundColor: isYourTurn ? 'rgb(203, 249, 186)' : 'transparent'
	    });
	
	    // Render Title
	    reset = cu.setContext(ctx, [
	      ['font', '20px serif'],
	      ['fillStyle', '#333']
	    ]);
	
	    ctx.fillText(playerConfig.title, 10, 30);
	    reset();
	
	    // Render Available Chess
	    inventory.forEach(function (count, roleId) {
	      var side = x.findValue(SIDE, 'ID', opts.sideId);
	      var role = x.findValue(ROLE, 'ID', roleId);
	
	      cu.marginHexagon(ctx, {
	        center: centers[roleId],
	        radius: radius,
	        fillStyle: count > 0 ? side.COLOR : '#ccc',
	        image: x.sprintf(role.IMG, {side: side.ID ? 'op' : 'me'}),
	        imageSize: role.IMGSIZE
	      });
	
	      var reset = cu.setContext(ctx, [
	        ['fillStyle', count > 0 ? '#f00' : '#ccc'],
	        ['font', ' 20px bold']
	      ]);
	
	      ctx.fillText('x ' + count, centers[roleId][0] + radius + 20, centers[roleId][1] + 10);
	      reset();
	    });
	  };
	
	  var vToolbar = Eventer({
	    init: function () {
	      return _init();
	    },
	    setInventory: function (_inventory) {
	      inventory = _inventory;
	      _renderPlayer();
	    },
	    addHumanControl: function (sideId) {
	      humanSideIds.push(sideId);
	    },
	    enable: function () {
	      isYourTurn = true;
	      _renderPlayer();
	    },
	    disable: function () {
	      isYourTurn = false;
	      _renderPlayer();
	    }
	  });
	
	  return vToolbar;
	};
	
	module.exports = toolbarFactory;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var x  = __webpack_require__(5);
	var du = __webpack_require__(13);
	var cu = __webpack_require__(12);
	var CG = __webpack_require__(9);
	
	var SIDE = CG.SIDE;
	var ROLE = CG.ROLE;
	
	var sampleChesses = x.product(Object.keys(SIDE), Object.keys(ROLE)).reduce(function (prev, tuple, i) {
	  var CANVAS_WIDTH = 60;
	  var CANVAS_HEIGHT = 60;
	  var side = SIDE[tuple[0]];
	  var role = ROLE[tuple[1]];
	
	  var $canvas = document.createElement('canvas');
	  var ctx = $canvas.getContext('2d');
	  $canvas.width  = CANVAS_WIDTH;
	  $canvas.height = CANVAS_HEIGHT;
	  du.setStyle($canvas, {
	    pointerEvents: 'none',
	    position: 'absolute',
	    display: 'none',
	    top: '0',
	    left: CANVAS_WIDTH * i + 'px',
	    width: CANVAS_WIDTH + 'px',
	    height: CANVAS_HEIGHT + 'px'
	  });
	  document.body.appendChild($canvas);
	
	  cu.marginHexagon(ctx, {
	    center: [CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2],
	    radius: CANVAS_WIDTH / 2,
	    fillStyle: side.COLOR,
	    margin: 1,
	    image: x.sprintf(role.IMG, {side: side.ID ? 'op' : 'me'}),
	    imageSize: role.IMGSIZE
	  });
	
	  prev[side.ID][role.ID] = $canvas;
	  return prev;
	}, [new Array(Object.keys(ROLE).length), new Array(Object.keys(ROLE).length)]);
	
	module.exports = sampleChesses;


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var x = __webpack_require__(5);
	var du = __webpack_require__(13);
	
	var dnd = function (opts) {
	  var backend;
	  var destroyBackend;
	  var $inHand;
	  var sources = [];
	  var targets = [];
	  var isDragging = false;
	  var dragging = null;
	  var sourceTuples;
	  var targetTuples;
	
	  var hook = function () {
	    backend.bindEvent(opts.$container, onMove(null), onDragEnd(null), sourceGetter, targetGetter);
	  };
	  var sourceGetter = function (reset) {
	    if (reset || !sourceTuples) {
	      sourceTuples = sources.map(function (source) {
	        return [source.$dom, onDragStart(source), onDragEnd(source)];
	      });
	    }
	    return sourceTuples;
	  };
	  var targetGetter = function (reset) {
	    if (reset || !targetTuples) {
	      targetTuples = targets.map(function (target) {
	        return [target.$dom, onMove(target), onDrop(target), onDragLeave(target)];
	      });
	    }
	    return targetTuples;
	  };
	  var onDragStart = x.partial(function (source, ev) {
	    var tuple, type, $tmp;
	
	    tuple = source.onDragStart(ev);
	    if (!tuple) return;
	
	    $tmp = tuple[0];
	    type = tuple[1];
	    isDragging = true;
	
	    dragging = {
	      source: source,
	      type: type
	    };
	
	    if ($tmp) {
	      $inHand = $tmp;
	      if ($inHand.parentNode.tagName.toLowerCase() !== 'body') {
	        document.body.appendChild($inHand);
	      }
	    }
	  });
	  var onDragEnd = x.partial(function (source, ev) {
	    var s = source || (dragging && dragging.source);
	
	    if (!isDragging)  return;
	
	    if ($inHand) {
	      du.setStyle($inHand, {
	        display: 'none'
	      });
	      $inHand = null;
	    }
	
	    s && s.onDragEnd(Object.assign({success: false}, ev, {dragging: dragging}));
	
	    isDragging = false;
	    dragging = null;
	  });
	  var onMove = x.partial(function (target, ev) {
	    var inHandWidth, inHandHeight;
	
	    if ($inHand) {
	      inHandWidth  = parseInt(du.getStyle($inHand, 'width'), 10);
	      inHandHeight = parseInt(du.getStyle($inHand, 'height'), 10);
	      du.setStyle($inHand, {
	        position: 'fixed',
	        zIndex: '9999',
	        display: 'block',
	        top: (ev.clientY - inHandWidth  / 2) + 'px',
	        left: (ev.clientX - inHandHeight / 2) + 'px'
	      });
	    }
	
	    if (!isDragging)  return;
	    target && target.onMove(Object.assign(ev, {dragging: dragging}));
	  });
	  var onDrop = x.partial(function (target, ev) {
	    var success = target.onDrop(Object.assign(ev, {dragging: dragging}));
	    dragging && onDragEnd(dragging.source, Object.assign(ev, {success: success}));
	  });
	  var onDragLeave = x.partial(function (target, ev) {
	    target.onDragLeave(ev);
	  });
	
	  return {
	    addSource: function (source) {
	      sources.push(source);
	      sourceGetter(true);
	    },
	    addTarget: function (target) {
	      targets.push(target);
	      targetGetter(true);
	    },
	    backend: function (_backend) {
	      backend = _backend;
	      destroyBackend && destroyBackend();
	      destroyBackend = null;
	      hook();
	    }
	  };
	};
	
	module.exports = dnd;


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var du = __webpack_require__(13);
	
	var dndBackendMouse = function () {
	  // Note: Getter returns an array of triples, triples as [$dom, fn, fn], while fn is called with eventObject
	  var sourceGetter, targetGetter;
	  var onDragMove, onDragEnd;
	  var $container;
	  var unbind;
	
	  var inDom = function ($top, $holder, $sub) {
	    var $dom = $sub;
	
	    while ($dom) {
	      if ($dom === $holder)  return true;
	      if ($sub === $top) return false;
	      $dom = $dom.parentNode;
	    }
	
	    return false;
	  };
	  var onMouseDown = function (ev) {
	    var i, len, pos, $dom, onDragStart;
	    var triples = sourceGetter && sourceGetter();
	
	    if (!triples) return;
	
	    for (i = 0, len = triples.length; i < len; i++) {
	      $dom = triples[i][0];
	      onDragStart = triples[i][1];
	
	      if (inDom($container, $dom, ev.target)) {
	        pos = du.mousePosition($dom, ev);
	        ev.localX = pos[0];
	        ev.localY = pos[1];
	        onDragStart(ev);
	        break;
	      }
	    }
	  };
	  var onMouseUp = function (ev) {
	    var i, len, pos, $dom, onDrop;
	    var triples = targetGetter && targetGetter();
	
	    if (!triples) return;
	
	    for (i = 0, len = triples.length; i < len; i++) {
	      $dom = triples[i][0];
	      onDrop = triples[i][2];
	
	      if (inDom($container, $dom, ev.target)) {
	        pos = du.mousePosition($dom, ev);
	        ev.localX = pos[0];
	        ev.localY = pos[1];
	        onDrop(ev);
	        break;
	      }
	    }
	
	    onDragEnd(ev);
	  };
	  var $lastOver = null;
	  var onMouseMove = function (ev) {
	    var i, len, pos, $dom, onMove, onDragLeave, found;
	    var triples = targetGetter && targetGetter();
	    if (!triples) return;
	
	    for (i = 0, len = triples.length; i < len; i++) {
	      $dom = triples[i][0];
	      onMove = triples[i][1];
	      onDragLeave = triples[i][3];
	
	      if (inDom($container, $dom, ev.target)) {
	        pos = du.mousePosition($dom, ev);
	        ev.localX = pos[0];
	        ev.localY = pos[1];
	        found = true;
	        $lastOver = $dom;
	        onMove(ev);
	      } else if ($lastOver === $dom) {
	        $lastOver = null;
	        onDragLeave && onDragLeave(ev);
	      }
	    }
	
	    if (found)  return;
	    onDragMove(ev);
	  };
	
	  return {
	    bindEvent: function (_$container, _onDragMove, _onDragEnd, _sourceGetter, _targetGetter) {
	      unbind && unbind();
	      sourceGetter = _sourceGetter;
	      targetGetter = _targetGetter;
	      onDragMove = _onDragMove;
	      onDragEnd  = _onDragEnd;
	      $container = _$container;
	      _$container.addEventListener('mousedown', onMouseDown);
	      _$container.addEventListener('mouseup', onMouseUp);
	      _$container.addEventListener('mousemove', onMouseMove);
	      unbind = function () {
	        _$container.removeEventListener('mousedown', onMouseDown);
	        _$container.removeEventListener('mouseup', onMouseUp);
	        _$container.removeEventListener('mousemove', onMouseMove);
	      };
	      return unbind;
	    }
	  };
	};
	
	module.exports = dndBackendMouse;


/***/ }
/******/ ]);
//# sourceMappingURL=web.d.js.map