describe("$sessionHandler", function() {

  var handler, cookies, scope;

  beforeEach(function() {
    module("tokenAuthentication");

    inject(function($sessionHandler, $cookies, $rootScope) {
      handler = $sessionHandler;
      cookies = $cookies;
      scope = $rootScope;

      angular.forEach(cookies, function(value, key) {
        delete cookies[key];
      });
    });
  });
   
  it("exists", function() {
    expect(handler).toBeTruthy();
  });

  describe("loggedIn()", function() {
    it("returns true if accessToken is set", function() {
      cookies.tokenAuth_accessToken = "a1";

      expect(handler.loggedIn()).toEqual(true);
    });

    it("returns false if accessToken is not set", function() {
      cookies.tokenAuth_accessToken = undefined;

      expect(handler.loggedIn()).toEqual(false);
    });
  });

  describe("getValue()", function() {
    it("works", function() {
      cookies.tokenAuth_whatever = "whatever";

      expect(handler.getValue("whatever")).toEqual("whatever");
    });
  });

  describe("setValue()", function() {
    it("should set a value and update the expiration if no expiration is set", function() {
      var updateExpirationCalled = false;
      handler.updateExpiration = function() {
        updateExpirationCalled = true;
      };
      handler.setValue("whatever", "whatever");

      expect(cookies.tokenAuth_whatever).toEqual("whatever");
      expect(updateExpirationCalled).toEqual(true);
    });

    it("should broadcast loggedIn if the value is the access token", function() {
      var broadcastCalledWith = [];
      scope.$broadcast = function() {
        broadcastCalledWith = arguments;
      };
      handler.setValue("accessToken", "whatever");

      expect(broadcastCalledWith[0]).toEqual("tokenAuth:loggedIn");
    });

    it("should start idle timer if the value is the access token", function() {
      var idleTimerCalled = false;
      handler.setIdleTimer = function() {
        idleTimerCalled = true;
      };
      handler.setValue("accessToken", "whatever");
      expect(idleTimerCalled).toEqual(true);
    });
  });

  describe("updateExpiration()", function() {
    it("does not do anything if duration is 0", function() {
      scope.tokenAuthParams.sessionDuration = 0;
      handler.updateExpiration();

      expect(cookies.tokenAuth_expiration).toBeUndefined();
    });

    it("sets the expiration otherwise", function() {
      var date = new Date();

      scope.tokenAuthParams.sessionDuration = 30;
      handler.updateExpiration();

      expect(cookies.tokenAuth_expiration).toBeDefined();
      expect(parseInt(cookies.tokenAuth_expiration, 10)).toBeGreaterThan(date.getTime());
    });
  });

  describe("checkExpiration()", function() {
    it("returns false if expiration is not met", function() {
      var date = new Date();

      cookies.tokenAuth_expiration = date.getTime() + 100;
      expect(handler.checkExpiration()).toEqual(false);
    });

    it("returns true and cleans session if expiration is met", function() {
      var date = new Date(),
      cleanWasCalled = false;
      handler.clean = function() {
        cleanWasCalled = true;
      };

      cookies.tokenAuth_expiration = date.getTime() - 1;
      expect(handler.checkExpiration()).toEqual(true);
      expect(cleanWasCalled).toEqual(true);
    });
  });

  describe("clean()", function() {
    beforeEach(function() {
      handler.keys.a = false;
      handler.keys.b = true;
      handler.keys.c = false;
      handler.keys.d = true;
      cookies.tokenAuth_a = "1";
      cookies.tokenAuth_b = "2";
      cookies.tokenAuth_c = "3";
      cookies.tokenAuth_d = "4";
    });

    it("removes all non remembered values by default", function() {
      handler.clean();

      expect(cookies.tokenAuth_a).toBeUndefined();
      expect(cookies.tokenAuth_b).toBeDefined();
      expect(cookies.tokenAuth_c).toBeUndefined();
      expect(cookies.tokenAuth_d).toBeDefined();
    });

    it("removes all values when forced", function() {
      handler.clean(true);

      expect(cookies.tokenAuth_a).toBeUndefined();
      expect(cookies.tokenAuth_b).toBeUndefined();
      expect(cookies.tokenAuth_c).toBeUndefined();
      expect(cookies.tokenAuth_d).toBeUndefined();
    });
  });
});