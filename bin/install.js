'use strict';

var colors = require('colors/safe'),
  trycatch = require('trycatch'),
  exit = require('exit'),
  lib = require('../lib/lib.js'),
  os = require('os'),
  async = require('async'),
  wget = require('wget-improved'),
  Progress = require('progress'),
  fs = require('fs'),
  path = require('path'),
  tarball = require('tarball-extract'),
  AdmZip = require('adm-zip');

trycatch(function () {

  // Current Platform
  var platform = lib.getPlatformByNodePlatformAndArch(os.platform(), os.arch());

  if (!platform) {
    console.log(colors.red.bold('[nibble] There is no platform configured for the current operating system: %s %s'), os.platform(), os.arch());
    exit(-1);
  } else {
    console.log(colors.green('[nibble] Current platform: %s'), platform.name);
  }

  async.series({

      nibble: function (callback) {

        console.log(colors.magenta('[nibble] Downloading nibble... %s'), platform.nibble_url);

        var percentStatus = -1;
        var nibble_dir = path.dirname(fs.realpathSync(__filename)) + platform.nibble_dir;
        var nibble_file = nibble_dir + platform.nibble_file;

        var bar = new Progress('[:bar] :percent :elapseds :etas ', {
          complete: '=',
          incomplete: ' ',
          total: 101,
          width: 50
        });

        if (!fs.existsSync(nibble_dir)) {
          fs.mkdirSync(nibble_dir);
        }

        var download = wget.download(platform.nibble_url, nibble_file, null);

        download.on('error', function (err) {
          callback(err);
        });

        download.on('end', function () {

          console.log(colors.magenta('[nibble] Extracting nibble: %s'), nibble_file);

          if (platform.nibble_ext === 'tar') {

            tarball.extractTarball(nibble_file, nibble_dir, function (err) {
              if (err) {
                callback(err);
              }
              console.log(colors.magenta('[nibble] Succesfully extracted nibble'));
              callback(null);
            });

          } else if (platform.nibble_ext === 'zip') {

            var zip = new AdmZip(nibble_file);
            zip.extractAllTo(nibble_dir, true);

            console.log(colors.magenta('[nibble] Succesfully extracted nibble'));
            callback(null);

          }
        });

        download.on('progress', function (progress) {
          var percent = (progress * 100).toFixed(0);
          if (percent !== percentStatus) {
            percentStatus = percent;
            bar.tick();
          }
        });
      }
    },
    // optional callback
    function (err) {

      if (err) {
        console.log(colors.red.bold('[nibble] Error: %s'), err);
        exit(-1);
      } else {
        exit(0);
      }
    });


}, function (err) {

  console.log(colors.red.bold('[nibble] Error: %s'), err);
  exit(-1);
});
