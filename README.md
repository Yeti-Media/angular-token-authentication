Angular token authentication are services for handling token-based authentication as a client-side session with automatic (optional) handling of REST resources in angular apps. It is divided in two modules.

# Parameters

- `sessionDuration`: duration of the session (in minutes). A falsy value (`0`, `false`) means the session will not expire. Default: `30`
- `idleTime`: duration of the session while idle (in minutes). A falsy value (`0`, `false`) means the session will not expire by idle time. Default: `20`
- `accessTokenKey`: access token key for calls to the API (necessary for resource authentication in tokenAuthResource). Default: `'accessToken'`

# API

## tokenAuthentication (module)

### sessionHandler (service)

Handles the session values and their expiration.

API is as follows:

#### getValue(key)
- key: String (required)

Returns a defined session value.

#### setValue(key, value, remember)
- key: String (required)
- value: * (will be converted to String, required)
- remember: Boolean. Determines whether or not the value is remembered after the session is terminated.

Stores a value in the session. If the value is the first to be set in an empty session it will start both expiration clocks. If the value's key is `'accessToken'` it will emit the `'tokenAuth::loggedIn'`event.

#### setValues(data)
- data: Object (required). A hash of key/values to store in the session, like follows:
```javascript
{
  key: {
    value: "value",
    remember: true
  },
  other: "otherValue" // will not be remembered
}
```

Calls `setValue()`on each key/value pair.

#### setAccessToken(token, remember)

Same as calling `setValue("accessToken", token, remember)`

#### getAccessToken()

Same as calling `getValue("accessToken")`

#### clean(force)
- force: Boolean. Whether or not to force the removal of remembered values.

Remove session's values. If the access token is removed, emits `'tokenAuth::loggedOut'` event. Conversely, a `'tokenAuth:logout'` event on the rootScope will trigger a call to it.

#### setExpiration()

Sets the session's expiration time to `sessionDuration` minutes from now. Called on `setValue()` for first value of empty session.

#### checkExpiration()

Checks on the session's expiration time. If the expiration time is met or exceeded, calls `clean()` and returns `true`. Otherwise returns `false`.

#### setIdleTimer()

Sets the idle timer to `idleTime` minutes from now.


## tokenAuthResource (module)

Optional module to include automatic REST resource authentication management. It depends on [angular-resource](http://docs.angularjs.org/api/ngResource.$resource) and tokenAuthentication.

### tokenAuthResource (service)

A wrapped version of the [angular-resource](http://docs.angularjs.org/api/ngResource.$resource) constructor that automatically attaches the session's access token to each resource request (be it from standard or custom actions), with the API key defined in the `accessTokenKey` parameter.

# Usage

Install:

```sh
bower install angular-token-authentication
```

Include the files, load the modules on the app and set parameters:

```javascript
angular.module("AppModule", ["tokenAuthResource"]) //should be enough to load both modules (it depends on tokenAuthentication)
  .value("tokenAuthParams", {
    //...
  });
```

or

```javascript
angular.module("AppModule", ["tokenAuthentication"]) // if you just want to use the sessionHandler
  .value("tokenAuthParams", {
    //...
  });
```

Afterwards it is simply a matter of using the `sessionHandler` on a controller to set the access token and possibly other values after a request to the API login endpoint. After that, using `tokenAuthResource` exactly as you would `$resource` will automatically append the access token for resource requests. If the token is found to be expired before the request, the session will be wiped and `'tokenAuth:loggedOut'` will be triggered instead.
