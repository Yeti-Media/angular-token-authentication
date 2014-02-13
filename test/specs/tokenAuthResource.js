describe("tokenAuthResource", function() {

  var resource, scope, httpBackend,
      tokenKey = "whatever",
      token = "a1",
      data = {},
      url = "http://localhost:3000";

  data[tokenKey] = token;

  beforeEach(function() {
    module("tokenAuthentication");
    module(function($provide) {
      $provide.value("tokenAuthParams", {accessTokenKey: tokenKey});
      $provide.value("sessionHandler", {
        getAccessToken: function() {
          return token;
        },
        checkExpiration: function() {
          return false;
        }
      });
    });
    module("tokenAuthResource");

    inject(function(tokenAuthResource, $rootScope, $httpBackend) {
      resource = tokenAuthResource;
      scope = $rootScope;
      httpBackend = $httpBackend;
    });
  });

  it("includes access token with all default actions", function() {
    var res = resource(url);

    angular.forEach(["get", "query", "delete", "remove"], function(action, i) {
      httpBackend.expect(i < 2 ? "GET" : "DELETE", url + "?" + tokenKey + "=" + token).respond(200);
      res[action]();
      httpBackend.verifyNoOutstandingExpectation();
    });

    httpBackend.expectPOST(url, data).respond(200);
    res.save();
    httpBackend.verifyNoOutstandingExpectation();
  });

  it("includes access token with custom actions", function() {
    var res = resource(url, undefined, {
      custom: {
        method: "PUT"
      }
    });

    httpBackend.expectPUT(url, data).respond(200);
    res.custom();
    httpBackend.verifyNoOutstandingExpectation();
  });

  it("includes access token when there is already data", function() {
    var res = resource(url);

    httpBackend.expectPOST(url, angular.extend({a: 1}, data)).respond(200);
    res.save({a: 1});
    httpBackend.verifyNoOutstandingExpectation();
  });
});