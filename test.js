const Improviser = require("./improviser");

const fs = require("fs");

function loadMidiFiles(path, maxFiles = 25) {
  var normalizedPath = require("path").join(__dirname, path);
  const files = [];
  fs.readdirSync(normalizedPath).forEach(function (file) {
    if (file.endsWith(".mid") || file.endsWith(".midi")) {
      if (files.length < maxFiles) {
        files.push(`./${path}/` + file);
      } else {
        return files;
      }
    }
  });
  return files;
}

im = new Improviser(3);

im.train(loadMidiFiles("pop_music/ABBA"));
im.generate(1000, 90, "A", "major");
