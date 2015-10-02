var tokenAuthentication = angular.module("tokenAuthentication", ["angular-jwt"]);

tokenAuthentication.value("tokenAuthParams", {
  sessionDuration: 0, // in minutes
  idleTime: 0, //in minutes
  accessTokenKey: "accessToken",
  jwt: false
});
