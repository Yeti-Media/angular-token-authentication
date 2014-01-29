(function() {

"use strict";

var tokenAuthentication = angular.module("tokenAuthentication", ["ngCookies"]);

tokenAuthentication.run(["$rootScope", function($rootScope) {
  $rootScope.tokenAuthParams = {
    tokenDuration: 30, // in minutes
    idleTime: 20, //in minutes
    keyPrefix: "tokenAuth",
    accessTokenKey: "accessToken"
  };
}]);

tokenAuthentication.factory("$sessionHandler", ["$cookies", "$rootScope", function($cookies, $scope) {
  var getKey = function(key) {
    return $scope.tokenAuthParams.keyPrefix + "_" + key;
  },
  accessTokenKey = "accessToken",
  instance = {
    keys: {},

    loggedIn: function() {
      return $cookies[getKey(accessTokenKey)] ? true : false;
    },

    setValue: function(key, value, remember) {
      $cookies[getKey(key)] = value;
      if (!this.keys.hasOwnProperty("expiration"))
        this.updateExpiration();
      this.keys[key] = remember;
      if (key === accessTokenKey) {
        this.setIdleTimer();
        $scope.$broadcast("tokenAuth:loggedIn");
      }
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
      return $cookies[getKey(key)];
    },

    setAccessToken: function(token, remember) {
      this.setValue(getKey(accessTokenKey), token, remember);
    },

    getAccessToken: function() {
      return this.getValue(accessTokenKey);
    },

    updateExpiration: function() {
      var date = new Date(),
      duration = $scope.tokenAuthParams.sessionDuration;
      if (!duration) return;

      date.setMinutes(date.getMinutes() + duration);
      $cookies[getKey("expiration")] = date.getTime().toString();
      this.keys.expiration = false;
    },

    checkExpiration: function() {
      var date = new Date(),
          expirationKey = getKey("expiration");

      if ($cookies[expirationKey] && parseInt($cookies[expirationKey], 10) < date.getTime()) {
        this.clean();
        return true;
      } else {
        return false;
      }
    },

    setIdleTimer: function() {
      var time = $scope.tokenAuthParams.idleTime,
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
      angular.forEach(this.keys, function(remember, key) {
        if (force || !remember) {
          delete $cookies[getKey(key)];
          if (key === accessTokenKey) 
            $scope.$broadcast("tokenAuth:loggedOut");
        }
      });
      if (this.idleInterval)
        clearInterval(this.idleInterval);
    }
  };

  $scope.$on("logout", instance.clean);

  return instance;
}]);

angular.module("tokenAuthResource", ["ngResource", "tokenAuthentication"]).factory("$tokenAuthResource", ["$rootScope", "$resource", "$sessionHandler", function($scope, $resource, $sessionHandler) {
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

        if (args.length === 0)
          args.push({});
        else if (typeof args[0] !== "object")
          args[0] = {};

        args[0][$scope.tokenAuthParams.accessTokenKey] = $sessionHandler.getAccessToken();
        original.apply(this, args);
      };
    });

    return resource;
  };
}]);

})();