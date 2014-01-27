/*describe("$tokenHandler", function() {

  var handler, cookies, scope;

  beforeEach(function() {
    module("tokenAuthentication");

    inject(function($tokenHandler, $cookies, $rootScope) {
      handler = $tokenHandler;
      cookies = $cookies;
      scope = $rootScope;
    });
  });
   
  it("exists", function() {
    expect(handler).toBeTruthy();
  });

  describe("set()", function() {
    it("should set cookies for the access token by default", function() {
      handler.set("a1");

      expect(cookies.tokenAuth_access).toEqual("a1");
    });

    it("should set an expiration token alongside by default", function() {
      var date = new Date();
      handler.set("a1");

      expect(cookies.tokenAuth_access_expiration).toBeDefined();
      expect(parseInt(cookies.tokenAuth_access_expiration, 10)).toBeGreaterThan(date.getTime());
    });

    it("should be possible not to define an expiration token", function() {
      handler.set("a1", true);

      expect(cookies.tokenAuth_access_expiration).toBeUndefined();
    });

    it("should be possible to set another token", function() {
      handler.set("a2", false, "another");

      expect(cookies.tokenAuth_another).toEqual("a2");
      expect(cookies.tokenAuth_another_expiration).toBeDefined()
    });
  });

  describe("get()", function() {
    it("gets the access token by default", function() {
      handler.set("a1");

      expect(handler.get()).toEqual("a1");
    });

    it("can get any token", function() {
      handler.set("a2", false, "another");

      expect(handler.get("another")).toEqual("a2");
    });
  });

  describe("updateExpiration()", function() {
    it("updates the expiration of the access token by default", function() {
      handler.updateExpiration();

      expect(cookies.tokenAuth_access_expiration).toBeDefined();
    });

    it("updates other token's expiration", function() {
      handler.updateExpiration("another");
      expect(cookies.tokenAuth_another_expiration).toBeDefined();
    });
  });

  describe("checkExpiration()", function() {
    it("checks the expiration of the access token by default", function() {
      handler.set("a1");
      expect(handler.checkExpiration()).toEqual(false);

      cookies.tokenAuth_access_expiration = (new Date()).getTime() - 1;
      expect(expect(handler.checkExpiration()).toEqual(true));
      expect(cookies.tokenAuth_access).toBeUndefined();
    });

    it("checks the expiration of any other tokens", function() {
      handler.set("a1", false, "another");
      expect(handler.checkExpiration("another")).toEqual(false);

      cookies.tokenAuth_another_expiration = (new Date()).getTime() - 1;
      expect(expect(handler.checkExpiration("another")).toEqual(true));
      expect(cookies.tokenAuth_another).toBeUndefined();
    });
  });

  describe("clean()", function() {
    it("removes all tokens by default", function() {
      handler.set("a1");
      handler.set("a2", true, "another");
      handler.clean();
      
      expect(cookies.tokenAuth_access).toBeUndefined();
      expect(cookies.tokenAuth_another).toBeUndefined();
    });

    it("removes the specified tokens", function() {
      handler.set("a1");
      handler.set("a2", true, "another");
      handler.clean("access");

      expect(cookies.tokenAuth_access).toBeUndefined();
      expect(cookies.tokenAuth_another).toBeDefined();
    });
  });
});*/