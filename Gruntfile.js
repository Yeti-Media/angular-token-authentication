module.exports = function(grunt) {
  var files = ["lib/tokenAuthentication.js", "lib/sessionHandler.js", "lib/tokenAuthResource.js"];

  grunt.initConfig({
    pkg: grunt.file.readJSON("bower.json"),

    concat: {
      options: {
        process: function(src, filepath) {
          var index = files.indexOf(filepath);

          if (index === 0)
            src = "(function() {\n\n\"use strict\";\n\n" + src;
          else if (index === files.length - 1)
            src += "\n\n})();";

          return src;
        },
        separator: "\n\n"
      },
      dist: {
        src: files,
        dest: "angular-token-authentication.js"
      }
    },

    uglify: {
      dist: {
        src: "angular-token-authentication.js",
        dest: "angular-token-authentication.min.js"
      }
    },

    jshint: {
      beforeConcat: ["lib/*.js"],
      afterConcat: ["angular-token-authentication.js"]
    }
  });

  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  grunt.registerTask("test", function() {
    var done = this.async();
    require("child_process").exec(require("path").join("node_modules", "karma", "bin", "karma") + " start", function(err, stdout) {
      if (stdout.indexOf("FAILED") > -1)
        grunt.fail.fatal(stdout);
      else
        console.log(stdout); 
      done();
    });
  });

  grunt.registerTask("default", ["test", "jshint:beforeConcat", "concat", "jshint:afterConcat", "uglify"]);
};