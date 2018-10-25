/**
 * Created by Sowvik on 10-10-2018.
 */
(function ($) {
    /**
     *
     * @typedef{{name:string, regDate:number, imei:number}} Device
     */

    /**
     *
     * @type {{}}
     */
    $.teoco.Sidebar = {};

    var _$sidepanel;
    var _$devices;
    var _$layers;
    var _$metrics, _$metricsHeader;
    var _url = $.teoco.baseUrl + "/rest/data/devices";

    function _$onSideMenuSelected(event) {
        var __$element = $(event.currentTarget);
        __$element.siblings().removeClass("active");
        __$element.addClass("active");
        var __$ul = __$element.closest("ul");
        if (__$ul.hasClass("navview-menu")) {
            if (__$ul.data("role") == "dropdown") {
                __$ul.siblings("a").find("span.caption").text(__$element.find("a>span.caption").text());
            }

            if(_$layers.find("li.active span.caption").text() == "Metrics"){
                _$metrics.show();
                _$metricsHeader.show();
            }
            else{
                _$metrics.hide();
                _$metricsHeader.hide();

            }



            try {
                eval(__$element.data("call"))
                    .call(this, eval(__$element.data("type")));
            } catch (ex) {
                console.error("An error occur during layer select: " + ex)
            }
        }

    }

    function _onClickDevices() {
        $.ajax({
                url: _url,
                method: "POST"
            })
            .done(
                /**
                 *
                 * @param {Array.<Device>}devices
                 */
                function (devices) {
                    var element =
                        '<li  data-call="$.teoco.Layer.onDeviceSelect" data-type="$devId">' +
                        '   <a href="#">' +
                        '       <span class="icon">$slNo</span>' +
                        '       <span class="caption">$devId</span>' +
                        '   </a>' +
                        '</li>';
                    _$devices.find("ul").empty();
                    for (var i = 0; i < devices.length; ++i) {
                        _$devices.find("ul").append(element
                            .replace("$devId", devices[i].imei)
                            .replace("$devId", devices[i].imei)
                            .replace("$slNo", i));
                    }
                })
            .fail(function () {

            })

    }


    $(document).ready(function () {

        _$sidepanel = $("#sidepanel");
        _$devices = $("#devices");
        _$layers = $("#layers");
        _$metrics = $("#metrics");
        _$metricsHeader = $("#metricsHeader");
        _$devices.on('click', '.navview-menu li', _$onSideMenuSelected);
        _$layers.find("li").click(_$onSideMenuSelected);
        _$metrics.find("li").click(_$onSideMenuSelected);
        _$devices.find("a.dropdown-toggle").click(_onClickDevices);

    });


})($);