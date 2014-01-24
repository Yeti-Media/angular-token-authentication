"use strict";

tokenAuthentication.factory("$tokenHandler", ["$cookies", "$rootScope", function($cookies, $scope) {
  var getKey = function(key) {
    return $scope.tokenAuthParams.keyPrefix + "_" + (key || "access");
  };
  
  return {
    tokens: [],

    set: function(token, remember, key) {
      var params = $scope.tokenAuthParams,
          fullKey = getKey(key);

      if (remember)
        $cookies[fullKey + "_expiration"] = undefined;
      else
        this.updateExpiration(key);
      if (this.tokens.indexOf(key) === -1)
        this.tokens.push(key);
      $cookies[fullKey] = token;
    },

    get: function(key) {
      return $cookies[getKey(key)];
    },

    updateExpiration: function(key) {
      var params = $scope.tokenAuthParams,
          date = new Date();

      date.setMinutes(date.getMinutes() + params.tokenDuration);
      $cookies[getKey(key) + "_expiration"] = date.getTime().toString();
    },

    checkExpiration: function(key) {
      var date = new Date(),
          fullKey = getKey(key),
          expirationKey = fullKey + "_expiration";

      if ($cookies[expirationKey] && parseInt($cookies[expirationKey], 10) < date.getTime()) {
        $cookies[fullKey] = undefined;
        return true;
      } else {
        return false;
      }
    },

    clean: function() {
      var tokens = arguments.length > 0 ? arguments : this.tokens;

      angular.forEach(tokens, function(token) {
        $cookies[getKey(token)] = undefined;
      });
    }
  };
}]);