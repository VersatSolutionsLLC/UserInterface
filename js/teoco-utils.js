/**
 * Created by Sowvik on 03-10-2018.
 */
(function ($) {

    $.teoco.Utils = {};

    $.teoco.Utils.Ajax = {};

    /**
     * Parse cookie for the particular cookie name.
     * @param {string} name Cookie name
     * @returns {string| null} Cookie value. Returns Null value if the named cookie not available.
     */
    $.teoco.Utils.parseCookie = function (name) {
        var cookie = document.cookie.replace(new RegExp("(?:(?:^|.*;\s*)" + name + "\s*\=\s*([^;]*).*$)|^.*$"), "$1");
        return cookie == "" ? null : cookie;
    };

    /**
     *
     * @param content
     * @param title
     * @param type
     */
    $.teoco.Utils.notify = function (content, title, type) {

        Metro.notify.create(content, title, {
            cls: type
        });

    };
    /**
     *
     * @param {string} content
     * @param {number} [timeout]
     */
    $.teoco.Utils.toast = function (content, timeout) {

        timeout = timeout || 2000;
        Metro.toast.create(content, null, timeout);

    };
    $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
        options.crossDomain = {
            crossDomain: true
        };
        options.xhrFields = {
            withCredentials: true
        };
        if (!options.beforeSend && $.teoco.Auth.getTokens()) {
            options.beforeSend = function (xhr) {
                xhr.setRequestHeader('IdToken', $.teoco.Auth.getTokens().AuthenticationResult.IdToken);
            }
        }
        options.contentType = 'application/json';
    });
})($);