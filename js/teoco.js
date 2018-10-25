(function ($){

    /**
     * @typedef {{lat: number, lon: number, value: number}} KpiValue
     */

    /**
     * @typedef {{min:number, rgba:string, count:number}} Stop
     */
    /**
     * @typedef {{title:string, unit:string, stops:Array.<Stop>, max:number, values:Array<KpiValue}}} KpiType
     */

    /**
     *
     * @type {{}}
     */
    $.teoco = {};
    $.teoco.baseUrl = "https://3ppw9lsvvk.execute-api.us-east-1.amazonaws.com/teoco";
    //$.teoco.baseUrl = "http://localhost:3000"

    $.teoco.KpiType = {};
    var opacity = "B0";


    /**
     *
     * @type {KpiType}
     */
    $.teoco.KpiType.RSRP = {
        title: "RSRP",
        unit: "dBm",
        stops: [
            {min: -140, rgba: "#FF0000" + opacity, count: null},
            {min: -110, rgba: "#FF5500" + opacity, count: null},
            {min: -100, rgba: "#FFAA00" + opacity, count: null},
            {min: -90, rgba: "#FFFF00" + opacity, count: null},
            {min: -80, rgba: "#AAFF00" + opacity, count: null},
            {min: -70, rgba: "#55FF00" + opacity, count: null},
            {min: -60, rgba: "#00FF00" + opacity, count: null}
        ],
        max: -30,
        na:"#000000FF",
        values:[]
    };
    /**
     *
     * @type {KpiType}
     */

    $.teoco.KpiType.RSRQ = {
        title: "RSRQ",
        unit: "dB",
        stops: [
            {min: -30, rgba: "#FF0000"+ opacity, count: null},
            {min: -20, rgba: "#FF8200"+ opacity, count: null},
            {min: -15, rgba: "#FFFF00"+ opacity, count: null},
            {min: -10, rgba: "#00FF00"+ opacity, count: null},
            {min: -6, rgba: "#FF00FF"+ opacity, count: null},
            {min: -3, rgba: "#0000FD"+ opacity, count: null}
        ],
        max: 0,
        values:[]
    };
    /**
     *
     * @type {KpiType}
     */

    $.teoco.KpiType.RSSINR = {
        title: "RS-SINR",
        unit: "dB",
        stops: [
            {min: -200, rgba: "#FF0000"+ opacity, count: null},
            {min: 10, rgba: "#FF8200"+ opacity, count: null},
            {min: 15, rgba: "#FFFF00"+ opacity, count: null},
            {min: 20, rgba: "#FF00FF"+ opacity, count: null},
            {min: 25, rgba: "#0000FD"+ opacity, count: null}
        ],
        max: 100,
        values:[]
    };
    /**
     *
     * @type {KpiType}
     */
    $.teoco.KpiType.BLER = {
        title: "BLER",
        unit: "%",
        factor: 0.01,
        stops: [
            {min: 0, rgba: "#00FF00" + opacity, count: null},
            {min: 0.01, rgba: "#FFFF00" + opacity, count: null},
            {min: 0.05, rgba: "#FF8200" + opacity, count: null},
            {min: 0.07, rgba: "#FF0000" + opacity, count: null}
        ],
        max: 1,
        values:[]
    };

})($);