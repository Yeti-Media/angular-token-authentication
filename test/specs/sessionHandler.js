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

  describe("getValue()", function() {
    it("works", function() {
      storage.tokenAuth_session = JSON.stringify({whatever: {value: "whatever"}});

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

      expect(JSON.parse(storage.tokenAuth_session).whatever).toEqual({value: "whatever", remember: false});
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
    var h, values;

    beforeEach(function() {
      h = handler();

      storage.tokenAuth_session = JSON.stringify({
        a: {
          value: 1,
          remember: false
        },
        b: {
          value: 2,
          remember: true
        },
        c: {
          value: 3,
          remember: false
        },
        d: {
          value: 4,
          remember: true
        }
      });
    });

    it("removes all non remembered values by default", function() {
      h.clean();
      values = JSON.parse(storage.tokenAuth_session);

      expect(values.a).toBeUndefined();
      expect(values.b).toBeDefined();
      expect(values.c).toBeUndefined();
      expect(values.d).toBeDefined();
    });

    it("removes all values when forced", function() {
      h.clean(true);
      values = JSON.parse(storage.tokenAuth_session);

      expect(values.a).toBeUndefined();
      expect(values.b).toBeUndefined();
      expect(values.c).toBeUndefined();
      expect(values.d).toBeUndefined();
    });
  });
});