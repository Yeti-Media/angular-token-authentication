(function() {

"use strict";

var tokenAuthentication = angular.module("tokenAuthentication", ["ngCookies"]);

tokenAuthentication.value("tokenAuthParams", {
  sessionDuration: 30, // in minutes
  idleTime: 20, //in minutes
  accessTokenKey: "accessToken"
});

tokenAuthentication.factory("sessionHandler", 
  ["$rootScope", "$window", "tokenAuthParams", function($scope, $window, tokenAuthParams) {
    var getKey = function(key) {
      return "tokenAuth_" + key;
    },
    accessTokenKey = "accessToken",
    expirationKey = getKey("expiration"),
    storage = $window.sessionStorage,
    instance = {
      keys: {},

      loggedIn: function() {
        return storage[getKey(accessTokenKey)] ? true : false;
      },

      setValue: function(key, value, remember) {
        storage[getKey(key)] = value;
        if (angular.equals(this.keys, {})) {
          this.setExpiration();
          this.setIdleTimer();
        }
        this.keys[key] = remember;
        if (key === accessTokenKey)
          $scope.$broadcast("tokenAuth:loggedIn");
      },

      setValues: function(data) {
        var self = this;

        angular.forEach(data, function(value, key) {
          if (typeof value === "object")
            self.setValue(key, value.value, value.remember);
          else
            self.setValue(key, value);
        });
      },

      getValue: function(key) {
        return storage[getKey(key)];
      },

      setAccessToken: function(token, remember) {
        this.setValue(getKey(accessTokenKey), token, remember);
      },

      getAccessToken: function() {
        return this.getValue(accessTokenKey);
      },

      setExpiration: function() {
        var date = new Date(),
        duration = tokenAuthParams.sessionDuration;
        if (!duration) return;

        date.setMinutes(date.getMinutes() + duration);
        storage[expirationKey] = date.getTime().toString();
        this.keys.expiration = false;
      },

      checkExpiration: function() {
        var date = new Date();

        if (storage[expirationKey] && parseInt(storage[expirationKey], 10) < date.getTime()) {
          this.clean();
          return true;
        } else {
          return false;
        }
      },

      setIdleTimer: function() {
        var time = tokenAuthParams.idleTime,
        self = this;
        if (!time) return;

        if (self.idleInterval) clearInterval(self.idleInterval);

        angular.element(document).ready(function() {
          var idleTimer = 0;

          self.idleInterval = setInterval(function() {
            idleTimer += 1;
            if (idleTimer >= time)
              self.clean();
          }, 60000);

          angular.element(this).on("mousemove", function() {
            idleTimer = 0;
          });

          angular.element(this).on("keypress", function() {
            idleTimer = 0;
          });
        });
      },

      clean: function(force) {
        var self = this,
        keys = angular.copy(this.keys);

        angular.forEach(keys, function(remember, key) {
          if (force || !remember) {
            delete storage[getKey(key)];
            delete self.keys[key];
            if (key === accessTokenKey) 
              $scope.$broadcast("tokenAuth:loggedOut");
          }
        });
        if (this.idleInterval)
          clearInterval(this.idleInterval);
      }
    };

    $scope.$on("tokenAuth:logout", instance.clean);

    return instance;
  }]
);

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
          if (sessionHandler.checkExpiration()) return;

          if (args.length === 0)
            args.push({});
          else if (typeof args[0] !== "object")
            args[0] = {};

          args[0][tokenAuthParams.accessTokenKey] = sessionHandler.getAccessToken();
          original.apply(this, args);
        };
      });

      return resource;
    };
}]);

})();