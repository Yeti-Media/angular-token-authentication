angular.module("tokenAuthResource", ["ngResource", "tokenAuthentication"]).factory("tokenAuthResource",
  ["$resource", "sessionHandler", "tokenAuthParams", "$http", function($resource, sessionHandler, tokenAuthParams, $http) {
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
          var doIt = function() {
            if (args.length === 0)
              args.push({});
            else if (typeof args[0] !== "object")
              args.unshift({});

            args[0][tokenAuthParams.accessTokenKey] = sessionHandler.getAccessToken();

            original.apply(this, args);
          };

          if (sessionHandler.checkExpiration()) {
            if (tokenAuthParams.refreshToken) {
              var requestConfig = angular.copy(tokenAuthParams.refreshTokenRequest);
              requestConfig.data = requestConfig.data(sessionHandler.getRefreshToken());
              $http(requestConfig).then(function(response) {
                sessionHandler.setAccessToken(response.data);
                doIt();
              });
            }
          } else {
            doIt();
          }
        };
      });

      return resource;
    };
}]);
