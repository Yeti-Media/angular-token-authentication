angular.module("tokenAuthResource", ["ngResource", "tokenAuthentication"]).factory("tokenAuthResource", 
  ["$resource", "sessionHandler", "tokenAuthParams", function($resource, sessionHandler, tokenAuthParams) {
      return {
        build: function () {

          var resource = $resource.apply(this, arguments);
          var actions = ["get", "save", "query", "remove", "delete"];
          
          if (arguments.length === 3) {
            // modify custom actions as well
            angular.forEach(arguments[2], function(value, key) {
              actions.push(key);
            });
          }
          this.wrapActions(resource, actions);
          return resource;
        },
        wrapActions: function(resource, actions) {
          var _this = this;
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
              }

              return original.apply(resource, args);
            };
          });
        }
      };
}]);