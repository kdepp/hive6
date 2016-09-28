var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var uri = 'mongodb://localhost/hive6';
var dbInstance = null
var connectionPromise = null;
var collectionNames = ['users', 'games'];

var connect = function () {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (connectionPromise)  return connectionPromise;

  var connectionPromise = new Promise(function (resolve, reject) {
    MongoClient.connect(uri, function (err, db) {
      if (err)  reject(err);
      dbInstance = db;
      resolve(db);
    });
  });

  return connectionPromise;
};

var makeDB = function (name) {
  var cmds = ['insert', 'update', 'delete', 'find'];
  var ret  = cmds.reduce(function (prev, cmd) {
    return ['One', 'Many'].reduce(function (prev, postfix) {
      var method = cmd + postfix;

      if (cmd === 'find' && postfix === 'Many') {
        method = 'find';
      }

      prev[method] = function () {
        var args = [].slice.apply(arguments);

        return connect()
        .then(function (db) {
          return new Promise(function (resolve, reject) {
            var collection = db.collection(name);
            collection[method].apply(collection, args.concat(function (err, data) {
              if (err)  reject(err);
              resolve(data);
            }));
          })
        });
      };

      return prev;
    }, prev);
  }, {});

  ret.findById = function (id) {
    id = typeof id === 'string' ? ObjectID(id) : id;
    return ret.findOne({_id: id});
  };

  ret.updateById = function (id, data, options) {
    id = typeof id === 'string' ? ObjectID(id) : id;
    return ret.updateOne({_id: id}, data, options);
  };

  return ret;
};

module.exports = collectionNames.reduce(function (prev, collection) {
  prev[collection] = makeDB(collection);
  return prev;
}, {connection: connect});
