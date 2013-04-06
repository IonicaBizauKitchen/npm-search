
/**
 * Module dependencies.
 */

var redis = require('redis');
var db = redis.createClient();
var githubUrl = require('github-url-from-git');
var request = require('superagent');

/**
 * NPM search remote.
 */

var remote = process.env.NPM_REMOTE || 'http://165.225.144.103';

/**
 * Index the given `pkg` and invoke `fn(err)`.
 *
 * @param {Object} pkg
 * @param {Function} [fn]
 * @api public
 */

exports.index = function(pkg, fn){
  fn = fn || function(){};
  var str = [pkg.name, pkg.description].concat(pkg.keywords).join(' ');
  var words = str.split(/\s+/);

  words.forEach(function(word){
    db.sadd('word:' + word, pkg.name);
  });

  var json = JSON.stringify(pkg);
  db.set('package:' + pkg.name, json, fn);
};

/**
 * Query the remote index with `words` and invoke `fn(err, [pkgs])`.
 *
 * @param {Array} words
 * @param {Function} fn
 * @api public
 */

exports.query = function(words, fn){
  var query = words.join(' ');

  request
  .get(remote + '/' + query)
  .end(function(err, res){
    if (err) return fn(err);
    if (res.error) return fn(res.error);
    fn(null, res.body);
  });
};

/**
 * Query the index with `words` and invoke `fn(err, [pkgs])`.
 *
 * @param {Array} words
 * @param {Function} fn
 * @api public
 */

exports.queryLocal = function(words, fn){
  if (!words.length) return fn(new Error('query required'));

  var keys = words.map(lowercase).map(prefix('word:'));

  db.sinter(keys, function(err, ids){
    if (err) return fn(err);
    if (!ids.length) return fn();
    ids = ids.map(prefix('package:'));

    db.mget(ids, function(err, pkgs){
      if (err) return fn(err);
      fn(null, pkgs.map(JSON.parse));
    });
  });
};

/**
 * Output `pkgs` to stdout.
 *
 * @param {Array} pkgs
 * @api public
 */

exports.output = function(pkgs){
  var cols = process.stdout.columns;
  var width = cols * .75 | 0;

  console.log();
  pkgs.forEach(function(pkg){
    var name = pkg.name;
    var desc = pkg.description || 'no description';
    console.log('  \033[31m%s\033[0m', name);
    console.log('  %s', wrap(desc, width));
    var url = link(pkg);
    if (url) console.log('  \033[90m%s\033[0m', url);
    console.log();
  });
  console.log();

  process.exit(0);
};

/**
 * Return `pkg` link.
 *
 * @param {Object} pkg
 * @return {String}
 * @api private
 */

function link(pkg) {
  var repo = pkg.repository;
  if (!repo || !repo.url) return;

  if (~repo.url.indexOf('github')) {
    return githubUrl(repo.url);
  }

  return repo.url;
}

/**
 * Wrap `str` to `width`.
 *
 * @param {String} str
 * @param {Number} width
 * @return {String}
 * @api private
 */

function wrap(str, width) {
  if (!str) return '';
  var space;
  for (var i = 0; i < str.length; ++i) {
    if (i && i % width == 0) {
      space = str.indexOf(' ', i);
      str = str.slice(0, space) + '\n ' + str.slice(space);
    }
  }
  return str;
}

/**
 * Lowercase `str`.
 */

function lowercase(str) {
  return str.toLowerCase();
}

/**
 * Prefix with `str`.
 */

function prefix(str) {
  return function(val){
    return str + val;
  }
}
