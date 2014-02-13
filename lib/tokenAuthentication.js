var tokenAuthentication = angular.module("tokenAuthentication", ["ngCookies"]);

tokenAuthentication.value("tokenAuthParams", {
  sessionDuration: 30, // in minutes
  idleTime: 20, //in minutes
  accessTokenKey: "accessToken"
});