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