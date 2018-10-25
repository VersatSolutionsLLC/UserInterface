(function ($) {
    $.teoco.Auth = {};

    /**
     * @typedef {{NotAuthorizedException:string, message:string,code:string,time:Date,requestId:string,statusCode:number,retryable:boolean, retryDelay:number}} AWSCognitoError
     */
    /**
     * @typedef {{ChallengeParameters:{},AuthenticationResult:{AccessToken:string,ExpiresIn:number, TokenType:string, RefreshToken:string, IdToken:string }}} Tokens
     */

    /**
     * @typedef {{Username:string, UserAttributes:Array<{Name:string,Value:string}>, auth:Tokens}} User
     */

    var _$error, _$username, _$password, _$loginForm, _$main, _$login, _$userFullName, _$signout;
    var _loginUrl = $.teoco.baseUrl + "/rest/security/login";
    var _logoutUrl = $.teoco.baseUrl + "/rest/security/logout";
    var cookie = $.teoco.Utils.parseCookie("IdToken");

    var _mapInstance;
    /**
     * @type {Tokens}
     */
    var _auth;

    /**
     *
     * @param {boolean} isSuccess
     * @private
     */
    function _onLogin(isSuccess) {
        if (isSuccess) {
            _$login.hide();
            _$main.show();
            _mapInstance.updateSize();
        }
        else {
            _$login.show();
            _$main.hide();

        }

    }

    /**
     *
     * @returns {Tokens}
     */
    $.teoco.Auth.getTokens = function () {
        return _auth;
    };

    /**
     * Logout
     */
    $.teoco.Auth.logout = function () {
        $.ajax(
            {
                url: _logoutUrl,
                method: "POST",
                "Content-Type": 'application/json'
            }
            )
            .done(function () {
                //successfully logged out
                _$login.show();
                _$main.hide();
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR, textStatus, errorThrown);
                //failed to log out
            })
    };

    /**
     * Login
     * @param username
     * @param password
     */
    $.teoco.Auth.login = function (username, password) {

        if (cookie != null) {
            return _onLogin(true);
        }

        $.ajax(
            {
                url: _loginUrl,
                method: "POST",
                "Content-Type": 'application/json',
                data: JSON.stringify({username: username, password: password})
            }
            )
            .done(
                /**
                 *
                 * @param {User}data
                 */
                function (data) {
                    _auth = data.auth;
                    for (i = 0; i < data.UserAttributes.length; ++i) {
                        if (data.UserAttributes[i].Name == "email") {
                            _$userFullName.html(data.UserAttributes[i].Value);
                        }
                    }
                    _onLogin(true);
                })
            .fail(function (jqXHR, textStatus, errorThrown) {
                _$error.html(textStatus);
                _$error.show();
                _onLogin(false);
            })


    };


    $(document).ready(function () {

        _mapInstance = $.teoco.Map.getInstance();
        if (cookie != null) {
            return _onLogin(true);
        }
        _$username = $("#username");
        _$password = $("#password");
        _$loginForm = $("#loginForm");
        _$error = $("#err");
        _$main = $("#main");
        _$login = $("#login");
        _$signout = $("#signout");
        _$userFullName = $("#userFullName");

        _$loginForm.submit(function (event) {
            event.preventDefault();
            _$error.hide();
            $.teoco.Auth.login(_$username.val(), _$password.val());
        });

        _$signout.click(function () {
            $.teoco.Auth.logout();
        })


    })
})($);