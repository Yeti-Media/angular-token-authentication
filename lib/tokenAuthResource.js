angular.module("tokenAuthResource", ["ngResource", "tokenAuthentication"]).factory("tokenAuthResource",
  ["$resource", "sessionHandler", "tokenAuthParams", function($resource, sessionHandler, tokenAuthParams) {
    return function() {
      var resource = $resource.apply(this, arguments),
      actions = ["get", "save", "query", "remove", "delete"];

      if (arguments.length === 3) {
        // modify custom actions as well
        angular.forEach(arguments[2], function(value, key) {
          actions.push(key);
        });
      }

      angular.forEach(actions, function(action) {
        var original = resource[action];

        resource[action] = function() {
          var args = Array.prototype.slice.call(arguments);

          if (!sessionHandler.checkExpiration()) {
            if (args.length === 0)
              args.push({});
            else if (typeof args[0] !== "object")
              args.unshift({});

            args[0][tokenAuthParams.accessTokenKey] = sessionHandler.getAccessToken();

            original.apply(this, args);
          }
        };
      });

      return resource;
    };
}]);
