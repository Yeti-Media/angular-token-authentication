describe("sessionHandler", function() {

  var handler, storage, scope, provide, params;

  beforeEach(function() {
    module("tokenAuthentication", function($provide) {
      provide = $provide;
    });

    inject(function($window, $rootScope, $injector) {
      storage = $window.sessionStorage;
      scope = $rootScope;
      handler = function() {
        return $injector.get("sessionHandler")
      };

      angular.forEach(storage, function(value, key) {
        delete storage[key];
      });
    });
  });
   
  it("exists", function() {
    expect(handler).toBeTruthy();
  });

  describe("loggedIn()", function() {
    it("returns true if accessToken is set", function() {
      storage.tokenAuth_accessToken = "a1";

      expect(handler().loggedIn()).toEqual(true);
    });

    it("returns false if accessToken is not set", function() {
      delete storage.tokenAuth_accessToken;

      expect(handler().loggedIn()).toEqual(false);
    });
  });

  describe("getValue()", function() {
    it("works", function() {
      storage.tokenAuth_whatever = "whatever";

      expect(handler().getValue("whatever")).toEqual("whatever");
    });
  });

  describe("setValue()", function() {
    it("should set a value and update the expiration if no expiration is set", function() {
      var setExpirationCalled = false,
      h = handler();

      h.setExpiration = function() {
        setExpirationCalled = true;
      };
      h.setValue("whatever", "whatever");

      expect(storage.tokenAuth_whatever).toEqual("whatever");
      expect(setExpirationCalled).toEqual(true);
    });

    it("should broadcast loggedIn if the value is the access token", function() {
      var broadcastCalledWith = [];
      scope.$broadcast = function() {
        broadcastCalledWith = arguments;
      };
      handler().setValue("accessToken", "whatever");

      expect(broadcastCalledWith[0]).toEqual("tokenAuth:loggedIn");
    });

    it("should start idle timer if the value is the access token", function() {
      var idleTimerCalled = false,
      h = handler();

      h.setIdleTimer = function() {
        idleTimerCalled = true;
      };
      h.setValue("accessToken", "whatever");
      expect(idleTimerCalled).toEqual(true);
    });
  });

  describe("setExpiration()", function() {
    it("does not do anything if duration is 0", function() {
      provide.value("tokenAuthParams", {sessionDuration: 0});
      handler().setExpiration();

      expect(storage.tokenAuth_expiration).toBeUndefined();
    });

    it("sets the expiration otherwise", function() {
      var date = new Date();

      provide.value("tokenAuthParams", {sessionDuration: 30});
      handler().setExpiration();

      expect(storage.tokenAuth_expiration).toBeDefined();
      expect(parseInt(storage.tokenAuth_expiration, 10)).toBeGreaterThan(date.getTime());
    });
  });

  describe("checkExpiration()", function() {
    it("returns false if expiration is not met", function() {
      var date = new Date();

      storage.tokenAuth_expiration = date.getTime() + 100;
      expect(handler().checkExpiration()).toEqual(false);
    });

    it("returns true and cleans session if expiration is met", function() {
      var date = new Date(),
      cleanWasCalled = false,
      h = handler();

      h.clean = function() {
        cleanWasCalled = true;
      };

      storage.tokenAuth_expiration = date.getTime() - 1;
      expect(h.checkExpiration()).toEqual(true);
      expect(cleanWasCalled).toEqual(true);
    });
  });

  describe("clean()", function() {
    var h;

    beforeEach(function() {
      h = handler();

      h.keys.a = false;
      h.keys.b = true;
      h.keys.c = false;
      h.keys.d = true;
      storage.tokenAuth_a = "1";
      storage.tokenAuth_b = "2";
      storage.tokenAuth_c = "3";
      storage.tokenAuth_d = "4";
    });

    it("removes all non remembered values by default", function() {

      h.clean();

      expect(storage.tokenAuth_a).toBeUndefined();
      expect(storage.tokenAuth_b).toBeDefined();
      expect(storage.tokenAuth_c).toBeUndefined();
      expect(storage.tokenAuth_d).toBeDefined();
    });

    it("removes all values when forced", function() {
      h.clean(true);

      expect(storage.tokenAuth_a).toBeUndefined();
      expect(storage.tokenAuth_b).toBeUndefined();
      expect(storage.tokenAuth_c).toBeUndefined();
      expect(storage.tokenAuth_d).toBeUndefined();
    });
  });
});