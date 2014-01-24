describe("session", function() {

  var resource, scope, httpBackend,
      endpoint = "//localhost:3000/session";

  beforeEach(function() {
    var calledGetWith = [],
        calledCleanWith = [];

    module("tokenAuthentication");
    module(function($provide) {
      $provide.value("$tokenHandler", {
        get: function() {
          calledGetWith.push(arguments);
        },
        clean: function() {
          calledCleanWith.push(arguments);
        }
      });
    });

    inject(function($session, $rootScope, $httpBackend) {
      session = $session;
      scope = $rootScope;
      httpBackend = $httpBackend;
    });

    scope.tokenAuthParams.accessTokenKey = "tokenKey";
  });

  describe("login()", function() {
    it("makes a post to the endpoint", function() {
      httpBackend.expectPOST(endpoint).respond(200);
      session.login(endpoint, {});
      httpBackend.verifyNoOutstandingExpectation();
    });

    it("returns a promse", function() {
      expect(session.login(endpoint, {}).then).toBeDefined();
    });

    it("assigns the data with the accessTokenKey as access token by default", inject(function($cookies) {
      httpBackend.expectPOST(endpoint).respond(200, {"tokenKey": "token"});
      session.login(endpoint, {}).then(function() {
        expect($cookies.tokenKey).toEqual("token");
      });
    }));
  });
});