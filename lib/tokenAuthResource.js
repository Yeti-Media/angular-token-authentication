"use strict";

angular.module("tokenAuthResource", ["ngResource", "tokenAuthentication"]).factory("$tokenAuthResource", ["$rootScope", "$resource", "$tokenHandler", function($scope, $resource, $tokenHandler) {
  return function() {
    var resource = $resource.apply(this, arguments),
        actions = ["get", "save", "query", "remove", "delete"];

    if (arguments.length === 3) {
      angular.forEach(arguments[2], function(value, key) {
        actions.push(key);
      });
    }

    angular.forEach(actions, function(action) {
      var original = resource[action];

      resource[action] = function() {
        var args = Array.prototype.slice.call(arguments);

        if (args.length === 0)
          args.push({});
        else if (typeof args[0] !== "object")
          args[0] = {};

        args[0][$scope.tokenAuthParams.accessTokenKey] = $tokenHandler.get();
        original.apply(this, args);
      };
    });

    return resource;
  };
}]);