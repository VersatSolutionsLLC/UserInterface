/**
 * Created by Sowvik on 11-10-2018.
 */
(function ($) {
    var _dataTable;

    /**
     * @typedef {{RATS:string,RSSI:number,BLER:number,RSRP:number,RSRQ:number,SNR:number,IsSc:boolean,CellID:number,LAC:number,TAC:number, BER: number, ECIO:number}} Cell
     */

    /**
     * @typedef {{Lat:number, Long:number, Alt:number, AltWgs84:number, HAcc:number, VAcc:number}} Location
     */

    /**
     * @typedef {{imei:number, imsi:number, Temp:number, timestamp:number, Cells:Array<Cell>, Gps:Location}} RadioInfo
     */

    /**
     *
     * @type {{}}
     */

    $.teoco.Footer = {};

    /**
     *
     * @returns {*}
     */
    $.teoco.Footer.getTable = function () {
        return _dataTable;
    };

    /**
     *
     * @param {RadioInfo} data
     */
    $.teoco.Footer.addData = function (data) {
        _dataTable
            .clear()
            .rows.add(data)
            .draw();
    };

    var __rowData = {};

    /**
     *
     * @param {Array.<Cell>} cells
     * @param {number} row
     * @private
     */
    function _getServingCellInfo(cells, row) {
        if (!__rowData[row]) {
            for (var i=0;i<cells.length;++i) {
                var cell = cells[i];
                if(cell.IsSc){
                    __rowData[row] = cell;
                    break;
                }
            }
        }
        return __rowData[row];
    }


    $(document).ready(function () {
        _dataTable = $("#footerTable").DataTable({
            destroy: true, // recreate
            autoWidth: true,
            pageLength: 5,
            lengthChange: false,
            processing: true,
            columns: [
                {data: null},
                {data: null},
                {data: null},
                {data: null},
                {data: null}
            ],
            columnDefs: [
                {
                    targets: 0,
                    /**
                     * @param {RadioInfo}data
                     * @param type
                     * @param {RadioInfo} full
                     * @param {{col:number, row:number, settings:{}}}meta
                     * @return {string}
                     */
                    render: function (data, type, full, meta) {
                        return new Date(full.timestamp * 1000).toDateString();
                    }
                },
                {
                    targets: 1,
                    /**
                     * @param {RadioInfo}data
                     * @param type
                     * @param {RadioInfo} full
                     * @param {{col:number, row:number, settings:{}}}meta
                     * @return {number}
                     */
                    render: function (data, type, full, meta) {
                        return _getServingCellInfo(full.Cells, meta.row).RSRP;
                    }
                },
                {
                    targets: 2,
                    /**
                     * @param {RadioInfo}data
                     * @param type
                     * @param {RadioInfo} full
                     * @param {{col:number, row:number, settings:{}}}meta
                     * @return {number}
                     */
                    render: function (data, type, full, meta) {
                        return _getServingCellInfo(full.Cells, meta.row).RSRQ;
                    }
                },
                {
                    targets: 3,
                    /**
                     * @param {RadioInfo}data
                     * @param type
                     * @param {RadioInfo} full
                     * @param {{col:number, row:number, settings:{}}}meta
                     * @return {number}
                     */
                    render: function (data, type, full, meta) {
                        return _getServingCellInfo(full.Cells, meta.row).RSSI;
                    }
                },
                {
                    targets: 4,
                    /**
                     * @param {RadioInfo}data
                     * @param type
                     * @param {RadioInfo} full
                     * @param {{col:number, row:number, settings:{}}}meta
                     * @return {number}
                     */
                    render: function (data, type, full, meta) {
                        return _getServingCellInfo(full.Cells, meta.row).BLER;
                    }
                },
                {
                    targets: 5,
                    /**
                     * @param {RadioInfo}data
                     * @param type
                     * @param {RadioInfo} full
                     * @param {{col:number, row:number, settings:{}}}meta
                     * @return {number}
                     */
                    render: function (data, type, full, meta) {
                        return _getServingCellInfo(full.Cells, meta.row).SNR;
                    }
                }
            ]

        });

    });

})($);