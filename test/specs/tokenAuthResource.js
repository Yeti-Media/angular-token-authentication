describe("tokenAuthResource", function() {

  var resource, scope, httpBackend,
      tokenKey = "whatever",
      token = "a1",
      data = {},
      url = "http://localhost:3000",
      doInject = function() {
        inject(function(tokenAuthResource, $rootScope, $httpBackend) {
          resource = tokenAuthResource;
          scope = $rootScope;
          httpBackend = $httpBackend;
        });
      };

  data[tokenKey] = token;

  describe("when access token is not expired", function() {

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

      doInject();
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

  describe("when access token is expired", function() {
    var refreshUrl = url + "/refresh";
    var refreshToken = "refreshToken";
    var requestData = function(refreshToken) {
      return {
        refresh_token: refreshToken
      }
    };
    var accessTokenChanged = false;
    var t = token;

    beforeEach(function() {
      module("tokenAuthentication");
      module(function($provide) {
        $provide.value("tokenAuthParams", {
          accessTokenKey: tokenKey,
          refreshToken: true,
          refreshTokenRequest: {
            method: "POST",
            url: refreshUrl,
            data: requestData
          }
        });
        $provide.value("sessionHandler", {
          checkExpiration: function() {
            return true;
          },
          getAccessToken: function() {
            return t;
          },
          getRefreshToken: function() {
            return refreshToken;
          },
          setAccessToken: function(tokenObj) {
            t = tokenObj.access_token;
          }
        });
      });
      module("tokenAuthResource");

      doInject();
    });

    it("requests the new access token and uses it if the access token is expired and the refresh token option is set", function() {
      var res = resource(url);
      var data2 = {};
      var newAccessToken = "b2";
      data2[tokenKey] = newAccessToken;

      httpBackend.expectPOST(refreshUrl, {refresh_token: refreshToken}).respond(200, {access_token: newAccessToken});
      httpBackend.expectPOST(url, angular.extend({a: 1}, data2)).respond(200);
      res.save({a: 1});
      httpBackend.flush();
      httpBackend.verifyNoOutstandingExpectation();
    });
  });
});
