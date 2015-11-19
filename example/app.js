var app = angular.module("App", ["tokenAuthResource", "ngMockE2E"])
  .value("tokenAuthParams", {
    sessionDuration: 0,
    idleTime: 0,
    accessTokenKey: "accessToken",
    jwt: false,
    refreshToken: true,
    refreshTokenRequest: {
      url: "/refreshToken",
      method: "POST",
      data: function(refreshToken) {
        return {
          refresh_token: refreshToken
        }
      }
    }
  });

/* Backend mock */
app.run(function($httpBackend) {
  var refreshToken = "refreshIt";
  $httpBackend.whenPOST("/login").respond(200, {access_token: "a1", expires_in: 75, refresh_token: refreshToken});
  $httpBackend.whenPOST("/refreshToken", {refresh_token: refreshToken}).respond(200, {access_token: "b2", refresh_token: refreshToken});
  $httpBackend.whenGET("/privatePosts").respond(401, {error: "You are not authorized to view the posts."});
  $httpBackend.whenGET("/privatePosts?accessToken=a1").respond(200, [{body: "This is a private post."}, {body: "This is another."}, {body: "etc."}]);
  $httpBackend.whenGET("/privatePosts?accessToken=b2").respond(200, [{body: "Token successfully refreshed"}]);
});
/* - */

app.factory("privatePosts", function(tokenAuthResource) {
  return tokenAuthResource("/privatePosts");
});

app.controller("MainCtrl", function($scope, $http, privatePosts, sessionHandler) {
  function queryPosts() {
    $scope.error = "";
    $scope.posts = [];

    privatePosts.query(function(data) {
      $scope.posts = data;
    }, function(data) {
      $scope.error = data.data.error;
    });
  }

  $scope.login = function() {
    $http({
      method: "POST",
      url: "/login"
    }).success(function(data) {
      sessionHandler.setAccessToken(data);
      queryPosts();
    });
  }

  $scope.logout = function() {
    sessionHandler.clean();
    queryPosts();
  }

  queryPosts();
});
