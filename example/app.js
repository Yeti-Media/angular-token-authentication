var app = angular.module("App", ["tokenAuthResource", "ngMockE2E"]);

/* Backend mock */
app.run(function($httpBackend) {
  $httpBackend.whenPOST("/login").respond(200, {accessToken: "a1"});
  $httpBackend.whenGET("/privatePosts").respond(401, {error: "You are not authorized to view the posts."});
  $httpBackend.whenGET("/privatePosts?accessToken=a1").respond(200, [{body: "This is a private post."}, {body: "This is another."}, {body: "etc."}]);
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
      sessionHandler.setAccessToken(data.accessToken);
      queryPosts();
    });
  }

  $scope.logout = function() {
    sessionHandler.clean();
    queryPosts();
  }

  queryPosts();
});