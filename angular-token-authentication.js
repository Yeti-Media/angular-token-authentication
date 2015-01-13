(function() {

"use strict";

var tokenAuthentication = angular.module("tokenAuthentication", ["ngCookies"]);

tokenAuthentication.value("tokenAuthParams", {
  sessionDuration: 30, // in minutes
  idleTime: 20, //in minutes
  accessTokenKey: "access_token"
});

tokenAuthentication.factory("sessionHandler", 
  ["$rootScope", "$window", "tokenAuthParams", function($scope, $window, tokenAuthParams) {
    var accessTokenKey = "access_token",
    storage = $window.sessionStorage,
    getKey = function(key) {
      return "tokenAuth_" + key;
    },
    setValue = function(key, value, remember) {
      var values = storage.tokenAuth_session ? JSON.parse(storage.tokenAuth_session) : {};

      values[key] = {value: value, remember: remember || false};
      storage.tokenAuth_session = JSON.stringify(values);
    },
    instance = {
      empty: function() {
        return storage.tokenAuth_session === "{}";
      },

      setValue: function(key, value, remember) {
        if (this.empty()) {
          this.setExpiration();
          this.setIdleTimer();
        }
        setValue(key, value, remember);
        if (key === accessTokenKey)
          $scope.$broadcast("tokenAuth:loggedIn");
      },

      setValues: function(data) {
        var values = JSON.parse(storage.tokenAuth_session);

        angular.forEach(data, function(value, key) {
          if (typeof value != "object" || !value.hasOwnProperty("value"))
            value = {value: value, remember: false};
          values[key] = value;
        });

        storage.tokenAuth_session = JSON.stringify(values);
      },

      getValue: function(key) {
        var value = JSON.parse(storage.tokenAuth_session)[key];
        return value ? value.value : null;
      },

      setAccessToken: function(token, remember) {
        this.setValue(accessTokenKey, token, remember);
      },

      getAccessToken: function() {
        return this.getValue(accessTokenKey);
      },

      setExpiration: function() {
        var date = new Date(),
        duration = tokenAuthParams.sessionDuration;
        if (!duration) return;

        date.setMinutes(date.getMinutes() + duration);
        storage.tokenAuth_expiration = date.getTime().toString();
      },

      checkExpiration: function() {
        var date = new Date();

        if (storage.tokenAuth_expiration && parseInt(storage.tokenAuth_expiration, 10) < date.getTime()) {
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
        values = JSON.parse(storage.tokenAuth_session);

        angular.forEach(values, function(data, key) {
          if (force || !data.remember) {
            delete values[key];
            if (key === accessTokenKey) 
              $scope.$broadcast("tokenAuth:loggedOut");
          }
        });
        storage.tokenAuth_session = JSON.stringify(values);
        delete storage.tokenAuth_expiration;
        if (this.idleInterval)
          clearInterval(this.idleInterval);
      }
    };

    $scope.$on("tokenAuth:logout", instance.clean);

    if (!storage.tokenAuth_session)
      storage.tokenAuth_session = "{}";

    return instance;
  }]
);

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

})();