/**
 * Created by Sowvik on 10-10-2018.
 */
(function ($) {
    $.teoco.Layer = {};
    var _selectedDeviceId;
    $.teoco.Layer.LAYER_NAME = {
        Metrics: "Metrics"
    };

    $.teoco.Layer.getSelectedDeviceId = function () {
      return _selectedDeviceId;
    };
    $.teoco.Layer.onDeviceSelect = function (deviceId) {
        _selectedDeviceId = deviceId;
    };
    /**
     *
     * @param {$.teoco.Layer.LAYER_NAME} layer
     */
    $.teoco.Layer.onLayerSelect = function (layer) {

        if (!_selectedDeviceId) {
            $.teoco.Utils.notify("Select device id first", "Error", "alert");
        }
    }

})($);