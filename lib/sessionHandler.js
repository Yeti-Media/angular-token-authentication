angular.module("tokenAuthentication").factory("sessionHandler",
  ["$rootScope", "$window", "tokenAuthParams", "jwtHelper", function($scope, $window, tokenAuthParams, jwtHelper) {
    var accessTokenKey = "accessToken",
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
        if (key === accessTokenKey) {
          this.setExpiration(value);
          this.setIdleTimer();
          $scope.$broadcast("tokenAuth:loggedIn");
          if (value.refresh_token) {
            this.setValue('refreshToken', value.refresh_token);
          }
          value = value.access_token;
        } else if (this.empty()) {
          this.setExpiration();
          this.setIdleTimer();
        }
        setValue(key, value, remember);
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

      getRefreshToken: function() {
        return this.getValue("refreshToken");
      },

      setExpiration: function(token) {
        var duration = tokenAuthParams.sessionDuration,
        expiresAt,
        clientExpiration;

        if (token) {
          if (tokenAuthParams.jwt) {
            expiresAt = jwtHelper.getTokenExpirationDate(token);
          } else if (token.expires_in) {
            expiresAt = new Date();
            // 60 seconds less to secure browser and response latency
            expiresAt.setSeconds(expiresAt.getSeconds() + parseInt(token.expires_in) - 60);
          }
        }

        if (duration) {
          clientExpiration = new Date();
          clientExpiration.setMinutes(clientExpiration.getMinutes() + duration);
          if (!expiresAt || clientExpiration.getTime() < expiresAt.getTime()) {
            expiresAt = clientExpiration;
          }
        }

        if (expiresAt) {
          storage.tokenAuth_expiration = expiresAt.getTime().toString();
        }
      },

      checkExpiration: function() {
        var date = new Date();

        if (storage.tokenAuth_expiration && parseInt(storage.tokenAuth_expiration, 10) < date.getTime()) {
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
