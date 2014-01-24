"use strict";

tokenAuthentication.factory("$session", ["$q", "$rootScope", "$http", "$tokenHandler", function($q, $scope, $http, $tokenHandler) {
  var instance = {
    login: function(endpoint, data, transform) {
      var deferred = $q.defer();

      $http.post(endpoint, data)
        .success(function(data) {
          if (transform) {
            transform(data, function(token) {
              tokenHandler.set(token);
            });
          } else
            tokenHandler.set(data[$scope.tokenAuthParams.accessTokenKey]);
          $scope.loggedIn = true;
          if (data.username) $scope.loggedAs = data.username;
          $scope.$broadcast("tokenAuth:loggedIn");
          deferred.resolve();
        })
        .error(function(data) {
          deferred.reject(data);
        });

      return deferred.promise;
    },

    logout: function() {
      tokenHandler.clean("access");
      $scope.loggedIn = false;
      $scope.loggedAs = null;
      $scope.$broadcast("tokenAuth:loggedOut");
    }
  };

  $scope.$on("logout", function() {
    instance.logout();
  });

  if ($scope.tokenAuthParams.idleTime) {
    $scope.$on("tokenAuth:loggedIn", function() {
      angular.element(document).ready(function() {
        var idleTimer = 0,
            idleInterval = setInterval(function() {
              idleTimer += 1;
              if (idleTimer >= $scope.tokenAuthParams.idleTime) {
                clearInterval(idleInterval);
                $scope.$broadcast("logout");
              }
            }, 60000);

        angular.element(this).mousemove(function(e) {
          idleTimer = 0;
        });

        angular.element(this).keypress(function(e) {
          idleTimer = 0;
        });
      });
    });
  }

  return instance;
}]);