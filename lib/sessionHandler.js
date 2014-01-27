"use strict";

tokenAuthentication.factory("$sessionHandler", ["$cookies", "$rootScope", function($cookies, $scope) {
  var getKey = function(key) {
    return $scope.tokenAuthParams.keyPrefix + "_" + key;
  },
  accessTokenKey = "accessToken",
  instance = {
    keys: [],

    loggedIn: function() {
      return $cookies[accessTokenKey] ? true : false;
    },

    setValue: function(key, value, remember) {
      $cookies[getKey(key)] = value;
      if (keys.length === 0 && !remember)
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
          self.setValue(key, value.value, value.remember)
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

        angular.element(this).mousemove(function(e) {
          idleTimer = 0;
        });

        angular.element(this).keypress(function(e) {
          idleTimer = 0;
        });
      });
    },

    clean: function() {
      angular.forEach(this.keys, function(remember, key) {
        if (!remember) {
          $cookies[getKey(key)] = undefined;
          if (key === accessTokenKey) 
            $scope.$broadcast("tokenAuth:loggedOut");
        }
      });
      clearInterval(self.idleInterval);
    }
  };

  $scope.loggedIn = function() {
    return instance.loggedIn();
  };
  $scope.$on("logout", instance.clean);

  return instance;
}]);