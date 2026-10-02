/* eslint-disable */
// SocialCalc Formula Functions Module (built-in spreadsheet functions, sheet cache)
// Part of the SocialCalc core engine - see README.md in this folder for the module map and load order

// UMD wrapper
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.SocialCalcFormulaFunctions = factory();
    }
})(typeof globalThis !== "undefined" ? globalThis : (typeof self !== "undefined" ? self : this), function () {

    // Get SocialCalc namespace
    var SocialCalc;
    if (typeof window !== "undefined" && window.SocialCalc) {
        SocialCalc = window.SocialCalc;
    } else if (typeof global !== "undefined" && global.SocialCalc) {
        SocialCalc = global.SocialCalc;
    } else {
        SocialCalc = {};
    }

    /////////////////////////
    //
    // FUNCTION DEFINITIONS
    //
    // The standard function definitions follow.
    //
    // Note that some need SocialCalc.DetermineValueType to be defined.
    //

    /*
  #
  # AVERAGE(v1,c1:c2,...)
  # COUNT(v1,c1:c2,...)
  # COUNTA(v1,c1:c2,...)
  # COUNTBLANK(v1,c1:c2,...)
  # MAX(v1,c1:c2,...)
  # MIN(v1,c1:c2,...)
  # PRODUCT(v1,c1:c2,...)
  # STDEV(v1,c1:c2,...)
  # STDEVP(v1,c1:c2,...)
  # SUM(v1,c1:c2,...)
  # VAR(v1,c1:c2,...)
  # VARP(v1,c1:c2,...)
  #
  # Calculate all of these and then return the desired one (overhead is in accessing not calculating)
  # If this routine is changed, check the dseries_functions, too.
  #
  */

    SocialCalc.Formula.SeriesFunctions = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var value1, t, v1;

        var scf = SocialCalc.Formula;
        var operand_value_and_type = scf.OperandValueAndType;
        var lookup_result_type = scf.LookupResultType;
        var typelookupplus = scf.TypeLookupTable.plus;

        var PushOperand = function (t, v) {
            operand.push({ type: t, value: v });
        };

        var sum = 0;
        var resulttypesum = "";
        var count = 0;
        var counta = 0;
        var countblank = 0;
        var product = 1;
        var maxval;
        var minval;
        var mk, sk, mk1, sk1; // For variance, etc.: M sub k, k-1, and S sub k-1
        // as per Knuth "The Art of Computer Programming" Vol. 2 3rd edition, page 232

        while (foperand.length > 0) {
            value1 = operand_value_and_type(sheet, foperand);
            t = value1.type.charAt(0);
            if (t == "n") count += 1;
            if (t != "b") counta += 1;
            if (t == "b") countblank += 1;

            if (t == "n") {
                v1 = value1.value - 0; // get it as a number
                sum += v1;
                product *= v1;
                maxval = maxval != undefined ? (v1 > maxval ? v1 : maxval) : v1;
                minval = minval != undefined ? (v1 < minval ? v1 : minval) : v1;
                if (count == 1) {
                    // initialize with first values for variance used in STDEV, VAR, etc.
                    mk1 = v1;
                    sk1 = 0;
                } else {
                    // Accumulate S sub 1 through n as per Knuth noted above
                    mk = mk1 + (v1 - mk1) / count;
                    sk = sk1 + (v1 - mk1) * (v1 - mk);
                    sk1 = sk;
                    mk1 = mk;
                }
                resulttypesum = lookup_result_type(
                    value1.type,
                    resulttypesum || value1.type,
                    typelookupplus
                );
            } else if (t == "e" && resulttypesum.charAt(0) != "e") {
                resulttypesum = value1.type;
            }
        }

        resulttypesum = resulttypesum || "n";

        switch (fname) {
            case "SUM":
                PushOperand(resulttypesum, sum);
                break;

            case "PRODUCT": // may handle cases with text differently than some other spreadsheets
                PushOperand(resulttypesum, product);
                break;

            case "MIN":
                PushOperand(resulttypesum, minval || 0);
                break;

            case "MAX":
                PushOperand(resulttypesum, maxval || 0);
                break;

            case "COUNT":
                PushOperand("n", count);
                break;

            case "COUNTA":
                PushOperand("n", counta);
                break;

            case "COUNTBLANK":
                PushOperand("n", countblank);
                break;

            case "AVERAGE":
                if (count > 0) {
                    PushOperand(resulttypesum, sum / count);
                } else {
                    PushOperand("e#DIV/0!", 0);
                }
                break;

            case "STDEV":
                if (count > 1) {
                    PushOperand(resulttypesum, Math.sqrt(sk / (count - 1))); // sk is never negative according to Knuth
                } else {
                    PushOperand("e#DIV/0!", 0);
                }
                break;

            case "STDEVP":
                if (count > 1) {
                    PushOperand(resulttypesum, Math.sqrt(sk / count));
                } else {
                    PushOperand("e#DIV/0!", 0);
                }
                break;

            case "VAR":
                if (count > 1) {
                    PushOperand(resulttypesum, sk / (count - 1));
                } else {
                    PushOperand("e#DIV/0!", 0);
                }
                break;

            case "VARP":
                if (count > 1) {
                    PushOperand(resulttypesum, sk / count);
                } else {
                    PushOperand("e#DIV/0!", 0);
                }
                break;
        }

        return null;
    };

    // Add to function list
    SocialCalc.Formula.FunctionList["AVERAGE"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];
    SocialCalc.Formula.FunctionList["COUNT"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];
    SocialCalc.Formula.FunctionList["COUNTA"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];
    SocialCalc.Formula.FunctionList["COUNTBLANK"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];
    SocialCalc.Formula.FunctionList["MAX"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];
    SocialCalc.Formula.FunctionList["MIN"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];
    SocialCalc.Formula.FunctionList["PRODUCT"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];
    SocialCalc.Formula.FunctionList["STDEV"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];
    SocialCalc.Formula.FunctionList["STDEVP"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];
    SocialCalc.Formula.FunctionList["SUM"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];
    SocialCalc.Formula.FunctionList["VAR"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];
    SocialCalc.Formula.FunctionList["VARP"] = [
        SocialCalc.Formula.SeriesFunctions,
        -1,
        "vn",
        null,
        "stat",
    ];

    /*
  #
  # DAVERAGE(databaserange, fieldname, criteriarange)
  # DCOUNT(databaserange, fieldname, criteriarange)
  # DCOUNTA(databaserange, fieldname, criteriarange)
  # DGET(databaserange, fieldname, criteriarange)
  # DMAX(databaserange, fieldname, criteriarange)
  # DMIN(databaserange, fieldname, criteriarange)
  # DPRODUCT(databaserange, fieldname, criteriarange)
  # DSTDEV(databaserange, fieldname, criteriarange)
  # DSTDEVP(databaserange, fieldname, criteriarange)
  # DSUM(databaserange, fieldname, criteriarange)
  # DVAR(databaserange, fieldname, criteriarange)
  # DVARP(databaserange, fieldname, criteriarange)
  #
  # Calculate all of these and then return the desired one (overhead is in accessing not calculating)
  # If this routine is changed, check the series_functions, too.
  #
  */

    SocialCalc.Formula.DSeriesFunctions = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var criterianum, v1;
        var value1,
            tostype,
            cr,
            dbrange,
            fieldname,
            criteriarange,
            dbinfo,
            criteriainfo;
        var fieldasnum, targetcol, i, j, k, cell, criteriafieldnums;
        var testok, criteriacr, criteria, testcol, testcr;
        var t;

        var scf = SocialCalc.Formula;
        var operand_value_and_type = scf.OperandValueAndType;
        var lookup_result_type = scf.LookupResultType;
        var typelookupplus = scf.TypeLookupTable.plus;

        var PushOperand = function (t, v) {
            operand.push({ type: t, value: v });
        };

        var value1 = {};

        var sum = 0;
        var resulttypesum = "";
        var count = 0;
        var counta = 0;
        var countblank = 0;
        var product = 1;
        var maxval;
        var minval;
        var mk, sk, mk1, sk1; // For variance, etc.: M sub k, k-1, and S sub k-1
        // as per Knuth "The Art of Computer Programming" Vol. 2 3rd edition, page 232

        dbrange = scf.TopOfStackValueAndType(sheet, foperand); // get a range
        fieldname = scf.OperandValueAndType(sheet, foperand); // get a value
        criteriarange = scf.TopOfStackValueAndType(sheet, foperand); // get a range

        if (dbrange.type != "range" || criteriarange.type != "range") {
            return scf.FunctionArgsError(fname, operand);
        }

        dbinfo = scf.DecodeRangeParts(sheet, dbrange.value);
        criteriainfo = scf.DecodeRangeParts(sheet, criteriarange.value);

        fieldasnum = scf.FieldToColnum(
            dbinfo.sheetdata,
            dbinfo.col1num,
            dbinfo.ncols,
            dbinfo.row1num,
            fieldname.value,
            fieldname.type
        );
        if (fieldasnum <= 0) {
            PushOperand("e#VALUE!", 0);
            return;
        }

        targetcol = dbinfo.col1num + fieldasnum - 1;
        criteriafieldnums = [];

        for (i = 0; i < criteriainfo.ncols; i++) {
            // get criteria field colnums
            cell = criteriainfo.sheetdata.GetAssuredCell(
                SocialCalc.crToCoord(criteriainfo.col1num + i, criteriainfo.row1num)
            );
            criterianum = scf.FieldToColnum(
                dbinfo.sheetdata,
                dbinfo.col1num,
                dbinfo.ncols,
                dbinfo.row1num,
                cell.datavalue,
                cell.valuetype
            );
            if (criterianum <= 0) {
                PushOperand("e#VALUE!", 0);
                return;
            }
            criteriafieldnums.push(dbinfo.col1num + criterianum - 1);
        }

        for (i = 1; i < dbinfo.nrows; i++) {
            // go through each row of the database
            testok = false;
            CRITERIAROW: for (j = 1; j < criteriainfo.nrows; j++) {
                // go through each criteria row
                for (k = 0; k < criteriainfo.ncols; k++) {
                    // look at each column
                    criteriacr = SocialCalc.crToCoord(
                        criteriainfo.col1num + k,
                        criteriainfo.row1num + j
                    ); // where criteria is
                    cell = criteriainfo.sheetdata.GetAssuredCell(criteriacr);
                    criteria = cell.datavalue;
                    if (typeof criteria == "string" && criteria.length == 0) continue; // blank items are OK
                    testcol = criteriafieldnums[k];
                    testcr = SocialCalc.crToCoord(testcol, dbinfo.row1num + i); // cell to check
                    cell = criteriainfo.sheetdata.GetAssuredCell(testcr);
                    if (
                        !scf.TestCriteria(cell.datavalue, cell.valuetype || "b", criteria)
                    ) {
                        continue CRITERIAROW; // does not meet criteria - check next row
                    }
                }
                testok = true; // met all the criteria
                break CRITERIAROW;
            }
            if (!testok) {
                continue;
            }

            cr = SocialCalc.crToCoord(targetcol, dbinfo.row1num + i); // get cell of this row to do the function on
            cell = dbinfo.sheetdata.GetAssuredCell(cr);

            value1.value = cell.datavalue;
            value1.type = cell.valuetype;
            t = value1.type.charAt(0);
            if (t == "n") count += 1;
            if (t != "b") counta += 1;
            if (t == "b") countblank += 1;

            if (t == "n") {
                v1 = value1.value - 0; // get it as a number
                sum += v1;
                product *= v1;
                maxval = maxval != undefined ? (v1 > maxval ? v1 : maxval) : v1;
                minval = minval != undefined ? (v1 < minval ? v1 : minval) : v1;
                if (count == 1) {
                    // initialize with first values for variance used in STDEV, VAR, etc.
                    mk1 = v1;
                    sk1 = 0;
                } else {
                    // Accumulate S sub 1 through n as per Knuth noted above
                    mk = mk1 + (v1 - mk1) / count;
                    sk = sk1 + (v1 - mk1) * (v1 - mk);
                    sk1 = sk;
                    mk1 = mk;
                }
                resulttypesum = lookup_result_type(
                    value1.type,
                    resulttypesum || value1.type,
                    typelookupplus
                );
            } else if (t == "e" && resulttypesum.charAt(0) != "e") {
                resulttypesum = value1.type;
            }
        }

        resulttypesum = resulttypesum || "n";

        switch (fname) {
            case "DSUM":
                PushOperand(resulttypesum, sum);
                break;

            case "DPRODUCT": // may handle cases with text differently than some other spreadsheets
                PushOperand(resulttypesum, product);
                break;

            case "DMIN":
                PushOperand(resulttypesum, minval || 0);
                break;

            case "DMAX":
                PushOperand(resulttypesum, maxval || 0);
                break;

            case "DCOUNT":
                PushOperand("n", count);
                break;

            case "DCOUNTA":
                PushOperand("n", counta);
                break;

            case "DAVERAGE":
                if (count > 0) {
                    PushOperand(resulttypesum, sum / count);
                } else {
                    PushOperand("e#DIV/0!", 0);
                }
                break;

            case "DSTDEV":
                if (count > 1) {
                    PushOperand(resulttypesum, Math.sqrt(sk / (count - 1))); // sk is never negative according to Knuth
                } else {
                    PushOperand("e#DIV/0!", 0);
                }
                break;

            case "DSTDEVP":
                if (count > 1) {
                    PushOperand(resulttypesum, Math.sqrt(sk / count));
                } else {
                    PushOperand("e#DIV/0!", 0);
                }
                break;

            case "DVAR":
                if (count > 1) {
                    PushOperand(resulttypesum, sk / (count - 1));
                } else {
                    PushOperand("e#DIV/0!", 0);
                }
                break;

            case "DVARP":
                if (count > 1) {
                    PushOperand(resulttypesum, sk / count);
                } else {
                    PushOperand("e#DIV/0!", 0);
                }
                break;

            case "DGET":
                if (count == 1) {
                    PushOperand(resulttypesum, sum);
                } else if (count == 0) {
                    PushOperand("e#VALUE!", 0);
                } else {
                    PushOperand("e#NUM!", 0);
                }
                break;
        }

        return;
    };

    SocialCalc.Formula.FunctionList["DAVERAGE"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["DCOUNT"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["DCOUNTA"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["DGET"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["DMAX"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["DMIN"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["DPRODUCT"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["DSTDEV"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["DSTDEVP"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["DSUM"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["DVAR"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["DVARP"] = [
        SocialCalc.Formula.DSeriesFunctions,
        3,
        "dfunc",
        "",
        "stat",
    ];

    /*
  #
  # colnum = SocialCalc.Formula.FieldToColnum(sheet, col1num, ncols, row1num, fieldname, fieldtype)
  #
  # If fieldname is a number, uses it, otherwise looks up string in cells in row to find field number
  #
  # If not found, returns 0.
  #
  */

    SocialCalc.Formula.FieldToColnum = function (
        sheet,
        col1num,
        ncols,
        row1num,
        fieldname,
        fieldtype
    ) {
        var colnum, cell, value;

        if (fieldtype.charAt(0) == "n") {
            // number - return it if legal
            colnum = fieldname - 0; // make sure a number
            if (colnum <= 0 || colnum > ncols) {
                return 0;
            }
            return Math.floor(colnum);
        }

        if (fieldtype.charAt(0) != "t") {
            // must be text otherwise
            return 0;
        }

        fieldname = fieldname ? fieldname.toLowerCase() : "";

        for (colnum = 0; colnum < ncols; colnum++) {
            // look through column headers for a match
            cell = sheet.GetAssuredCell(
                SocialCalc.crToCoord(col1num + colnum, row1num)
            );
            value = cell.datavalue;
            value = (value + "").toLowerCase(); // ignore case
            if (value == fieldname) {
                // match
                return colnum + 1;
            }
        }
        return 0; // looked at all and no match
    };

    /*
  #
  # HLOOKUP(value, range, row, [rangelookup])
  # VLOOKUP(value, range, col, [rangelookup])
  # MATCH(value, range, [rangelookup])
  #
  */

    SocialCalc.Formula.LookupFunctions = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var lookupvalue, range, offset, rangelookup, offsetvalue, rangeinfo;
        var c,
            r,
            cincr,
            rincr,
            previousOK,
            csave,
            rsave,
            cell,
            value,
            valuetype,
            cr,
            lookupvalue;

        var scf = SocialCalc.Formula;
        var operand_value_and_type = scf.OperandValueAndType;
        var lookup_result_type = scf.LookupResultType;
        var typelookupplus = scf.TypeLookupTable.plus;

        var PushOperand = function (t, v) {
            operand.push({ type: t, value: v });
        };

        lookupvalue = operand_value_and_type(sheet, foperand);
        if (typeof lookupvalue.value == "string") {
            lookupvalue.value = lookupvalue.value.toLowerCase();
        }

        range = scf.TopOfStackValueAndType(sheet, foperand);

        rangelookup = 1; // default to true or 1
        if (fname == "MATCH") {
            if (foperand.length) {
                rangelookup = scf.OperandAsNumber(sheet, foperand);
                if (rangelookup.type.charAt(0) != "n") {
                    PushOperand("e#VALUE!", 0);
                    return;
                }
                if (foperand.length) {
                    scf.FunctionArgsError(fname, operand);
                    return 0;
                }
                rangelookup = rangelookup.value - 0;
            }
        } else {
            offsetvalue = scf.OperandAsNumber(sheet, foperand);
            if (offsetvalue.type.charAt(0) != "n") {
                PushOperand("e#VALUE!", 0);
                return;
            }
            offsetvalue = Math.floor(offsetvalue.value);
            if (foperand.length) {
                rangelookup = scf.OperandAsNumber(sheet, foperand);
                if (rangelookup.type.charAt(0) != "n") {
                    PushOperand("e#VALUE!", 0);
                    return;
                }
                if (foperand.length) {
                    scf.FunctionArgsError(fname, operand);
                    return 0;
                }
                rangelookup = rangelookup.value ? 1 : 0; // convert to 1 or 0
            }
        }
        lookupvalue.type = lookupvalue.type.charAt(0); // only deal with general type
        if (lookupvalue.type == "n") {
            // if number, make sure a number
            lookupvalue.value = lookupvalue.value - 0;
        }

        if (range.type != "range") {
            scf.FunctionArgsError(fname, operand);
            return 0;
        }

        rangeinfo = scf.DecodeRangeParts(sheet, range.value, range.type);
        if (!rangeinfo) {
            PushOperand("e#REF!", 0);
            return;
        }

        c = 0;
        r = 0;
        cincr = 0;
        rincr = 0;
        if (fname == "HLOOKUP") {
            cincr = 1;
            if (offsetvalue > rangeinfo.nrows) {
                PushOperand("e#REF!", 0);
                return;
            }
        } else if (fname == "VLOOKUP") {
            rincr = 1;
            if (offsetvalue > rangeinfo.ncols) {
                PushOperand("e#REF!", 0);
                return;
            }
        } else if (fname == "MATCH") {
            if (rangeinfo.ncols > 1) {
                if (rangeinfo.nrows > 1) {
                    PushOperand("e#N/A", 0);
                    return;
                }
                cincr = 1;
            } else {
                rincr = 1;
            }
        } else {
            scf.FunctionArgsError(fname, operand);
            return 0;
        }
        if (offsetvalue < 1 && fname != "MATCH") {
            PushOperand("e#VALUE!", 0);
            return 0;
        }

        previousOK; // if 1, previous test was <. If 2, also this one wasn't

        while (1) {
            cr = SocialCalc.crToCoord(rangeinfo.col1num + c, rangeinfo.row1num + r);
            cell = rangeinfo.sheetdata.GetAssuredCell(cr);
            value = cell.datavalue;
            valuetype = cell.valuetype ? cell.valuetype.charAt(0) : "b"; // only deal with general types
            if (valuetype == "n") {
                value = value - 0; // make sure number
            }
            if (rangelookup) {
                // rangelookup type 1 or -1: look for within brackets for matches
                if (lookupvalue.type == "n" && valuetype == "n") {
                    if (lookupvalue.value == value) {
                        // match
                        break;
                    }
                    if (
                        (rangelookup > 0 && lookupvalue.value > value) ||
                        (rangelookup < 0 && lookupvalue.value < value)
                    ) {
                        // possible match: wait and see
                        previousOK = 1;
                        csave = c; // remember col and row of last OK
                        rsave = r;
                    } else if (previousOK) {
                        // last one was OK, this one isn't
                        previousOK = 2;
                        break;
                    }
                } else if (lookupvalue.type == "t" && valuetype == "t") {
                    value = typeof value == "string" ? value.toLowerCase() : "";
                    if (lookupvalue.value == value) {
                        // match
                        break;
                    }
                    if (
                        (rangelookup > 0 && lookupvalue.value > value) ||
                        (rangelookup < 0 && lookupvalue.value < value)
                    ) {
                        // possible match: wait and see
                        previousOK = 1;
                        csave = c;
                        rsave = r;
                    } else if (previousOK) {
                        // last one was OK, this one isn't
                        previousOK = 2;
                        break;
                    }
                }
            } else {
                // exact value matches
                if (lookupvalue.type == "n" && valuetype == "n") {
                    if (lookupvalue.value == value) {
                        // match
                        break;
                    }
                } else if (lookupvalue.type == "t" && valuetype == "t") {
                    value = typeof value == "string" ? value.toLowerCase() : "";
                    if (lookupvalue.value == value) {
                        // match
                        break;
                    }
                }
            }

            r += rincr;
            c += cincr;
            if (r >= rangeinfo.nrows || c >= rangeinfo.ncols) {
                // end of range to check, no exact match
                if (previousOK) {
                    // at least one could have been OK
                    previousOK = 2;
                    break;
                }
                PushOperand("e#N/A", 0);
                return;
            }
        }

        if (previousOK == 2) {
            // back to last OK
            r = rsave;
            c = csave;
        }

        if (fname == "MATCH") {
            value = c + r + 1; // only one may be <> 0
            valuetype = "n";
        } else {
            cr = SocialCalc.crToCoord(
                rangeinfo.col1num + c + (fname == "VLOOKUP" ? offsetvalue - 1 : 0),
                rangeinfo.row1num + r + (fname == "HLOOKUP" ? offsetvalue - 1 : 0)
            );
            cell = rangeinfo.sheetdata.GetAssuredCell(cr);
            value = cell.datavalue;
            valuetype = cell.valuetype;
        }
        PushOperand(valuetype, value);

        return;
    };

    SocialCalc.Formula.FunctionList["HLOOKUP"] = [
        SocialCalc.Formula.LookupFunctions,
        -3,
        "hlookup",
        "",
        "lookup",
    ];
    SocialCalc.Formula.FunctionList["MATCH"] = [
        SocialCalc.Formula.LookupFunctions,
        -2,
        "match",
        "",
        "lookup",
    ];
    SocialCalc.Formula.FunctionList["VLOOKUP"] = [
        SocialCalc.Formula.LookupFunctions,
        -3,
        "vlookup",
        "",
        "lookup",
    ];

    /*
  #
  # INDEX(range, rownum, colnum)
  #
  */

    SocialCalc.Formula.IndexFunction = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var range, sheetname, indexinfo, rowindex, colindex, result, resulttype;

        var scf = SocialCalc.Formula;

        var PushOperand = function (t, v) {
            operand.push({ type: t, value: v });
        };

        range = scf.TopOfStackValueAndType(sheet, foperand); // get range
        if (range.type != "range") {
            scf.FunctionArgsError(fname, operand);
            return 0;
        }
        indexinfo = scf.DecodeRangeParts(sheet, range.value, range.type);
        if (indexinfo.sheetname) {
            sheetname = "!" + indexinfo.sheetname;
        } else {
            sheetname = "";
        }

        rowindex = { value: 0 };
        colindex = { value: 0 };

        if (foperand.length) {
            // look for row number
            rowindex = scf.OperandAsNumber(sheet, foperand);
            if (rowindex.type.charAt(0) != "n" || rowindex.value < 0) {
                PushOperand("e#VALUE!", 0);
                return;
            }
            if (foperand.length) {
                // look for col number
                colindex = scf.OperandAsNumber(sheet, foperand);
                if (colindex.type.charAt(0) != "n" || colindex.value < 0) {
                    PushOperand("e#VALUE!", 0);
                    return;
                }
                if (foperand.length) {
                    scf.FunctionArgsError(fname, operand);
                    return 0;
                }
            } else {
                // col number missing
                if (indexinfo.nrows == 1) {
                    // if only one row, then rowindex is really colindex
                    colindex.value = rowindex.value;
                    rowindex.value = 0;
                }
            }
        }

        if (rowindex.value > indexinfo.nrows || colindex.value > indexinfo.ncols) {
            PushOperand("e#REF!", 0);
            return;
        }

        if (rowindex.value == 0) {
            if (colindex.value == 0) {
                if (indexinfo.nrows == 1 && indexinfo.ncols == 1) {
                    result =
                        SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num) +
                        sheetname;
                    resulttype = "coord";
                } else {
                    result =
                        SocialCalc.crToCoord(indexinfo.col1num, indexinfo.row1num) +
                        sheetname +
                        "|" +
                        SocialCalc.crToCoord(
                            indexinfo.col1num + indexinfo.ncols - 1,
                            indexinfo.row1num + indexinfo.nrows - 1
                        ) +
                        "|";
                    resulttype = "range";
                }
            } else {
                if (indexinfo.nrows == 1) {
                    result =
                        SocialCalc.crToCoord(
                            indexinfo.col1num + colindex.value - 1,
                            indexinfo.row1num
                        ) + sheetname;
                    resulttype = "coord";
                } else {
                    result =
                        SocialCalc.crToCoord(
                            indexinfo.col1num + colindex.value - 1,
                            indexinfo.row1num
                        ) +
                        sheetname +
                        "|" +
                        SocialCalc.crToCoord(
                            indexinfo.col1num + colindex.value - 1,
                            indexinfo.row1num + indexinfo.nrows - 1
                        ) +
                        "|";
                    resulttype = "range";
                }
            }
        } else {
            if (colindex.value == 0) {
                if (indexinfo.ncols == 1) {
                    result =
                        SocialCalc.crToCoord(
                            indexinfo.col1num,
                            indexinfo.row1num + rowindex.value - 1
                        ) + sheetname;
                    resulttype = "coord";
                } else {
                    result =
                        SocialCalc.crToCoord(
                            indexinfo.col1num,
                            indexinfo.row1num + rowindex.value - 1
                        ) +
                        sheetname +
                        "|" +
                        SocialCalc.crToCoord(
                            indexinfo.col1num + indexinfo.ncols - 1,
                            indexinfo.row1num + rowindex.value - 1
                        ) +
                        "|";
                    resulttype = "range";
                }
            } else {
                result =
                    SocialCalc.crToCoord(
                        indexinfo.col1num + colindex.value - 1,
                        indexinfo.row1num + rowindex.value - 1
                    ) + sheetname;
                resulttype = "coord";
            }
        }

        PushOperand(resulttype, result);

        return;
    };

    SocialCalc.Formula.FunctionList["INDEX"] = [
        SocialCalc.Formula.IndexFunction,
        -1,
        "index",
        "",
        "lookup",
    ];

    /*
  #
  # COUNTIF(c1:c2,"criteria")
  # SUMIF(c1:c2,"criteria",[range2])
  #
  */

    SocialCalc.Formula.CountifSumifFunctions = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var range,
            criteria,
            sumrange,
            f2operand,
            result,
            resulttype,
            value1,
            value2;
        var sum = 0;
        var resulttypesum = "";
        var count = 0;

        var scf = SocialCalc.Formula;
        var operand_value_and_type = scf.OperandValueAndType;
        var lookup_result_type = scf.LookupResultType;
        var typelookupplus = scf.TypeLookupTable.plus;

        var PushOperand = function (t, v) {
            operand.push({ type: t, value: v });
        };

        range = scf.TopOfStackValueAndType(sheet, foperand); // get range or coord
        criteria = scf.OperandAsText(sheet, foperand); // get criteria
        if (fname == "SUMIF") {
            if (foperand.length == 1) {
                // three arg form of SUMIF
                sumrange = scf.TopOfStackValueAndType(sheet, foperand);
            } else if (foperand.length == 0) {
                // two arg form
                sumrange = { value: range.value, type: range.type };
            } else {
                scf.FunctionArgsError(fname, operand);
                return 0;
            }
        } else {
            sumrange = { value: range.value, type: range.type };
        }

        if (criteria.type.charAt(0) == "n") {
            criteria.value = criteria.value + ""; // make text
        } else if (criteria.type.charAt(0) == "e") {
            // error
            criteria.value = null;
        } else if (criteria.type.charAt(0) == "b") {
            // blank here is undefined
            criteria.value = null;
        }

        if (range.type != "coord" && range.type != "range") {
            scf.FunctionArgsError(fname, operand);
            return 0;
        }

        if (
            fname == "SUMIF" &&
            sumrange.type != "coord" &&
            sumrange.type != "range"
        ) {
            scf.FunctionArgsError(fname, operand);
            return 0;
        }

        foperand.push(range);
        f2operand = []; // to allow for 3 arg form
        f2operand.push(sumrange);

        while (foperand.length) {
            value1 = operand_value_and_type(sheet, foperand);
            value2 = operand_value_and_type(sheet, f2operand);

            if (!scf.TestCriteria(value1.value, value1.type, criteria.value)) {
                continue;
            }

            count += 1;

            if (value2.type.charAt(0) == "n") {
                sum += value2.value - 0;
                resulttypesum = lookup_result_type(
                    value2.type,
                    resulttypesum || value2.type,
                    typelookupplus
                );
            } else if (
                value2.type.charAt(0) == "e" &&
                resulttypesum.charAt(0) != "e"
            ) {
                resulttypesum = value2.type;
            }
        }

        resulttypesum = resulttypesum || "n";

        if (fname == "SUMIF") {
            PushOperand(resulttypesum, sum);
        } else if (fname == "COUNTIF") {
            PushOperand("n", count);
        }

        return;
    };

    SocialCalc.Formula.FunctionList["COUNTIF"] = [
        SocialCalc.Formula.CountifSumifFunctions,
        2,
        "rangec",
        "",
        "stat",
    ];
    SocialCalc.Formula.FunctionList["SUMIF"] = [
        SocialCalc.Formula.CountifSumifFunctions,
        -2,
        "sumif",
        "",
        "stat",
    ];

    /*
  #
  # IF(cond,truevalue,falsevalue)
  #
  */

    SocialCalc.Formula.IfFunction = function (fname, operand, foperand, sheet) {
        var cond, t;

        cond = SocialCalc.Formula.OperandValueAndType(sheet, foperand);
        t = cond.type.charAt(0);
        if (t != "n" && t != "b") {
            operand.push({ type: "e#VALUE!", value: 0 });
            return;
        }

        if (!cond.value) foperand.pop();
        operand.push(foperand.pop());
        if (cond.value) foperand.pop();

        return null;
    };

    // Add to function list
    SocialCalc.Formula.FunctionList["IF"] = [
        SocialCalc.Formula.IfFunction,
        3,
        "iffunc",
        "",
        "test",
    ];

    /*
  #
  # DATE(year,month,day)
  #
  */

    SocialCalc.Formula.DateFunction = function (fname, operand, foperand, sheet) {
        var scf = SocialCalc.Formula;
        var result = 0;
        var year = scf.OperandAsNumber(sheet, foperand);
        var month = scf.OperandAsNumber(sheet, foperand);
        var day = scf.OperandAsNumber(sheet, foperand);
        var resulttype = scf.LookupResultType(
            year.type,
            month.type,
            scf.TypeLookupTable.twoargnumeric
        );
        resulttype = scf.LookupResultType(
            resulttype,
            day.type,
            scf.TypeLookupTable.twoargnumeric
        );
        if (resulttype.charAt(0) == "n") {
            result =
                SocialCalc.FormatNumber.convert_date_gregorian_to_julian(
                    Math.floor(year.value),
                    Math.floor(month.value),
                    Math.floor(day.value)
                ) - SocialCalc.FormatNumber.datevalues.julian_offset;
            resulttype = "nd";
        }
        scf.PushOperand(operand, resulttype, result);
        return;
    };

    SocialCalc.Formula.FunctionList["DATE"] = [
        SocialCalc.Formula.DateFunction,
        3,
        "date",
        "",
        "datetime",
    ];

    /*
  #
  # TIME(hour,minute,second)
  #
  */

    SocialCalc.Formula.TimeFunction = function (fname, operand, foperand, sheet) {
        var scf = SocialCalc.Formula;
        var result = 0;
        var hours = scf.OperandAsNumber(sheet, foperand);
        var minutes = scf.OperandAsNumber(sheet, foperand);
        var seconds = scf.OperandAsNumber(sheet, foperand);
        var resulttype = scf.LookupResultType(
            hours.type,
            minutes.type,
            scf.TypeLookupTable.twoargnumeric
        );
        resulttype = scf.LookupResultType(
            resulttype,
            seconds.type,
            scf.TypeLookupTable.twoargnumeric
        );
        if (resulttype.charAt(0) == "n") {
            result =
                (hours.value * 60 * 60 + minutes.value * 60 + seconds.value) /
                (24 * 60 * 60);
            resulttype = "nt";
        }
        scf.PushOperand(operand, resulttype, result);
        return;
    };

    SocialCalc.Formula.FunctionList["TIME"] = [
        SocialCalc.Formula.TimeFunction,
        3,
        "hms",
        "",
        "datetime",
    ];

    /*
  #
  # DAY(date)
  # MONTH(date)
  # YEAR(date)
  # WEEKDAY(date, [type])
  #
  */

    SocialCalc.Formula.DMYFunctions = function (fname, operand, foperand, sheet) {
        var ymd, dtype, doffset;
        var scf = SocialCalc.Formula;
        var result = 0;

        var datevalue = scf.OperandAsNumber(sheet, foperand);
        var resulttype = scf.LookupResultType(
            datevalue.type,
            datevalue.type,
            scf.TypeLookupTable.oneargnumeric
        );

        if (resulttype.charAt(0) == "n") {
            ymd = SocialCalc.FormatNumber.convert_date_julian_to_gregorian(
                Math.floor(
                    datevalue.value + SocialCalc.FormatNumber.datevalues.julian_offset
                )
            );
            switch (fname) {
                case "DAY":
                    result = ymd.day;
                    break;

                case "MONTH":
                    result = ymd.month;
                    break;

                case "YEAR":
                    result = ymd.year;
                    break;

                case "WEEKDAY":
                    dtype = { value: 1 };
                    if (foperand.length) {
                        // get type if present
                        dtype = scf.OperandAsNumber(sheet, foperand);
                        if (
                            dtype.type.charAt(0) != "n" ||
                            dtype.value < 1 ||
                            dtype.value > 3
                        ) {
                            scf.PushOperand(operand, "e#VALUE!", 0);
                            return;
                        }
                        if (foperand.length) {
                            // extra args
                            scf.FunctionArgsError(fname, operand);
                            return;
                        }
                    }
                    doffset = 6;
                    if (dtype.value > 1) {
                        doffset -= 1;
                    }
                    result =
                        (Math.floor(datevalue.value + doffset) % 7) +
                        (dtype.value < 3 ? 1 : 0);
                    break;
            }
        }

        scf.PushOperand(operand, resulttype, result);
        return;
    };

    SocialCalc.Formula.FunctionList["DAY"] = [
        SocialCalc.Formula.DMYFunctions,
        1,
        "v",
        "",
        "datetime",
    ];
    SocialCalc.Formula.FunctionList["MONTH"] = [
        SocialCalc.Formula.DMYFunctions,
        1,
        "v",
        "",
        "datetime",
    ];
    SocialCalc.Formula.FunctionList["YEAR"] = [
        SocialCalc.Formula.DMYFunctions,
        1,
        "v",
        "",
        "datetime",
    ];
    SocialCalc.Formula.FunctionList["WEEKDAY"] = [
        SocialCalc.Formula.DMYFunctions,
        -1,
        "weekday",
        "",
        "datetime",
    ];

    /*
  #
  # HOUR(datetime)
  # MINUTE(datetime)
  # SECOND(datetime)
  #
  */

    SocialCalc.Formula.HMSFunctions = function (fname, operand, foperand, sheet) {
        var hours, minutes, seconds, fraction;
        var scf = SocialCalc.Formula;
        var result = 0;

        var datetime = scf.OperandAsNumber(sheet, foperand);
        var resulttype = scf.LookupResultType(
            datetime.type,
            datetime.type,
            scf.TypeLookupTable.oneargnumeric
        );

        if (resulttype.charAt(0) == "n") {
            if (datetime.value < 0) {
                scf.PushOperand(operand, "e#NUM!", 0); // must be non-negative
                return;
            }
            fraction = datetime.value - Math.floor(datetime.value); // fraction of a day
            fraction *= 24;
            hours = Math.floor(fraction);
            fraction -= Math.floor(fraction);
            fraction *= 60;
            minutes = Math.floor(fraction);
            fraction -= Math.floor(fraction);
            fraction *= 60;
            seconds = Math.floor(fraction + (datetime.value >= 0 ? 0.5 : -0.5));
            if (fname == "HOUR") {
                result = hours;
            } else if (fname == "MINUTE") {
                result = minutes;
            } else if (fname == "SECOND") {
                result = seconds;
            }
        }

        scf.PushOperand(operand, resulttype, result);
        return;
    };

    SocialCalc.Formula.FunctionList["HOUR"] = [
        SocialCalc.Formula.HMSFunctions,
        1,
        "v",
        "",
        "datetime",
    ];
    SocialCalc.Formula.FunctionList["MINUTE"] = [
        SocialCalc.Formula.HMSFunctions,
        1,
        "v",
        "",
        "datetime",
    ];
    SocialCalc.Formula.FunctionList["SECOND"] = [
        SocialCalc.Formula.HMSFunctions,
        1,
        "v",
        "",
        "datetime",
    ];

    /*
  #
  # EXACT(v1,v2)
  #
  */

    SocialCalc.Formula.ExactFunction = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var scf = SocialCalc.Formula;
        var result = 0;
        var resulttype = "nl";

        var value1 = scf.OperandValueAndType(sheet, foperand);
        var v1type = value1.type.charAt(0);
        var value2 = scf.OperandValueAndType(sheet, foperand);
        var v2type = value2.type.charAt(0);

        if (v1type == "t") {
            if (v2type == "t") {
                result = value1.value == value2.value ? 1 : 0;
            } else if (v2type == "b") {
                result = value1.value.length ? 0 : 1;
            } else if (v2type == "n") {
                result = value1.value == value2.value + "" ? 1 : 0;
            } else if (v2type == "e") {
                result = value2.value;
                resulttype = value2.type;
            } else {
                result = 0;
            }
        } else if (v1type == "n") {
            if (v2type == "n") {
                result = value1.value - 0 == value2.value - 0 ? 1 : 0;
            } else if (v2type == "b") {
                result = 0;
            } else if (v2type == "t") {
                result = value1.value + "" == value2.value ? 1 : 0;
            } else if (v2type == "e") {
                result = value2.value;
                resulttype = value2.type;
            } else {
                result = 0;
            }
        } else if (v1type == "b") {
            if (v2type == "t") {
                result = value2.value.length ? 0 : 1;
            } else if (v2type == "b") {
                result = 1;
            } else if (v2type == "n") {
                result = 0;
            } else if (v2type == "e") {
                result = value2.value;
                resulttype = value2.type;
            } else {
                result = 0;
            }
        } else if (v1type == "e") {
            result = value1.value;
            resulttype = value1.type;
        }

        scf.PushOperand(operand, resulttype, result);
        return;
    };

    SocialCalc.Formula.FunctionList["EXACT"] = [
        SocialCalc.Formula.ExactFunction,
        2,
        "",
        "",
        "text",
    ];

    /*
  #
  # FIND(key,string,[start])
  # LEFT(string,[length])
  # LEN(string)
  # LOWER(string)
  # MID(string,start,length)
  # PROPER(string)
  # REPLACE(string,start,length,new)
  # REPT(string,count)
  # RIGHT(string,[length])
  # SUBSTITUTE(string,old,new,[which])
  # TRIM(string)
  # UPPER(string)
  #
  */

    // SocialCalc.Formula.ArgList has an array for each function, one entry for each possible arg (up to max).
    // Min args are specified in SocialCalc.Formula.FunctionList.
    // If array element is 1 then it's a text argument, if it's 0 then it's numeric, if -1 then just get whatever's there
    // Text values are manipulated as UTF-8, converting from and back to byte strings

    SocialCalc.Formula.ArgList = {
        FIND: [1, 1, 0],
        LEFT: [1, 0],
        LEN: [1],
        LOWER: [1],
        MID: [1, 0, 0],
        PROPER: [1],
        REPLACE: [1, 0, 0, 1],
        REPT: [1, 0],
        RIGHT: [1, 0],
        SUBSTITUTE: [1, 1, 1, 0],
        TRIM: [1],
        UPPER: [1],
    };

    SocialCalc.Formula.StringFunctions = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var fulltext, newtext, oldpos, oldtext, pos, which;
        var i, value, offset, len, start, count;
        var scf = SocialCalc.Formula;
        var result = 0;
        var resulttype = "e#VALUE!";

        var numargs = foperand.length;
        var argdef = scf.ArgList[fname];
        var operand_value = [];
        var operand_type = [];

        for (i = 1; i <= numargs; i++) {
            // go through each arg, get value and type, and check for errors
            if (i > argdef.length) {
                // too many args
                scf.FunctionArgsError(fname, operand);
                return;
            }
            if (argdef[i - 1] == 0) {
                value = scf.OperandAsNumber(sheet, foperand);
            } else if (argdef[i - 1] == 1) {
                value = scf.OperandAsText(sheet, foperand);
            } else if (argdef[i - 1] == -1) {
                value = scf.OperandValueAndType(sheet, foperand);
            }
            operand_value[i] = value.value;
            operand_type[i] = value.type;
            if (value.type.charAt(0) == "e") {
                scf.PushOperand(operand, value.type, result);
                return;
            }
        }

        switch (fname) {
            case "FIND":
                offset = operand_type[3] ? operand_value[3] - 1 : 0;
                if (offset < 0) {
                    result = "Start is before string"; // !! not displayed, no need to translate
                } else {
                    result = operand_value[2].indexOf(operand_value[1], offset); // (null string matches first char)
                    if (result >= 0) {
                        result += 1;
                        resulttype = "n";
                    } else {
                        result = "Not found"; // !! not displayed, error is e#VALUE!
                    }
                }
                break;

            case "LEFT":
                len = operand_type[2] ? operand_value[2] - 0 : 1;
                if (len < 0) {
                    result = "Negative length";
                } else {
                    result = operand_value[1].substring(0, len);
                    resulttype = "t";
                }
                break;

            case "LEN":
                result = operand_value[1].length;
                resulttype = "n";
                break;

            case "LOWER":
                result = operand_value[1].toLowerCase();
                resulttype = "t";
                break;

            case "MID":
                start = operand_value[2] - 0;
                len = operand_value[3] - 0;
                if (len < 1 || start < 1) {
                    result = "Bad arguments";
                } else {
                    result = operand_value[1].substring(start - 1, start + len - 1);
                    resulttype = "t";
                }
                break;

            case "PROPER":
                result = operand_value[1].replace(/\b\w+\b/g, function (word) {
                    return word.substring(0, 1).toUpperCase() + word.substring(1);
                }); // uppercase first character of words (see JavaScript, Flanagan, 5th edition, page 704)
                resulttype = "t";
                break;

            case "REPLACE":
                start = operand_value[2] - 0;
                len = operand_value[3] - 0;
                if (len < 0 || start < 1) {
                    result = "Bad arguments";
                } else {
                    result =
                        operand_value[1].substring(0, start - 1) +
                        operand_value[4] +
                        operand_value[1].substring(start - 1 + len);
                    resulttype = "t";
                }
                break;

            case "REPT":
                count = operand_value[2] - 0;
                if (count < 0) {
                    result = "Negative count";
                } else {
                    result = "";
                    for (; count > 0; count--) {
                        result += operand_value[1];
                    }
                    resulttype = "t";
                }
                break;

            case "RIGHT":
                len = operand_type[2] ? operand_value[2] - 0 : 1;
                if (len < 0) {
                    result = "Negative length";
                } else {
                    result = operand_value[1].slice(-len);
                    resulttype = "t";
                }
                break;

            case "SUBSTITUTE":
                fulltext = operand_value[1];
                oldtext = operand_value[2];
                newtext = operand_value[3];
                if (operand_value[4] != null) {
                    which = operand_value[4] - 0;
                    if (which <= 0) {
                        result = "Non-positive instance number";
                        break;
                    }
                } else {
                    which = 0;
                }
                count = 0;
                oldpos = 0;
                result = "";
                while (true) {
                    pos = fulltext.indexOf(oldtext, oldpos);
                    if (pos >= 0) {
                        count++; //!!!!!! old test just in case: if (count>1000) {alert(pos); break;}
                        result += fulltext.substring(oldpos, pos);
                        if (which == 0) {
                            result += newtext; // substitute
                        } else if (which == count) {
                            result += newtext + fulltext.substring(pos + oldtext.length);
                            break;
                        } else {
                            result += oldtext; // leave as was
                        }
                        oldpos = pos + oldtext.length;
                    } else {
                        // no more
                        result += fulltext.substring(oldpos);
                        break;
                    }
                }
                resulttype = "t";
                break;

            case "TRIM":
                result = operand_value[1];
                result = result.replace(/^ */, "");
                result = result.replace(/ *$/, "");
                result = result.replace(/ +/g, " ");
                resulttype = "t";
                break;

            case "UPPER":
                result = operand_value[1].toUpperCase();
                resulttype = "t";
                break;
        }

        scf.PushOperand(operand, resulttype, result);
        return;
    };

    SocialCalc.Formula.FunctionList["FIND"] = [
        SocialCalc.Formula.StringFunctions,
        -2,
        "find",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["LEFT"] = [
        SocialCalc.Formula.StringFunctions,
        -2,
        "tc",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["LEN"] = [
        SocialCalc.Formula.StringFunctions,
        1,
        "txt",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["LOWER"] = [
        SocialCalc.Formula.StringFunctions,
        1,
        "txt",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["MID"] = [
        SocialCalc.Formula.StringFunctions,
        3,
        "mid",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["PROPER"] = [
        SocialCalc.Formula.StringFunctions,
        1,
        "v",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["REPLACE"] = [
        SocialCalc.Formula.StringFunctions,
        4,
        "replace",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["REPT"] = [
        SocialCalc.Formula.StringFunctions,
        2,
        "tc",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["RIGHT"] = [
        SocialCalc.Formula.StringFunctions,
        -1,
        "tc",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["SUBSTITUTE"] = [
        SocialCalc.Formula.StringFunctions,
        -3,
        "subs",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["TRIM"] = [
        SocialCalc.Formula.StringFunctions,
        1,
        "v",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["UPPER"] = [
        SocialCalc.Formula.StringFunctions,
        1,
        "v",
        "",
        "text",
    ];

    /*
  #
  # is_functions:
  #
  # ISBLANK(value)
  # ISERR(value)
  # ISERROR(value)
  # ISLOGICAL(value)
  # ISNA(value)
  # ISNONTEXT(value)
  # ISNUMBER(value)
  # ISTEXT(value)
  #
  */

    SocialCalc.Formula.IsFunctions = function (fname, operand, foperand, sheet) {
        var scf = SocialCalc.Formula;
        var result = 0;
        var resulttype = "nl";

        var value = scf.OperandValueAndType(sheet, foperand);
        var t = value.type.charAt(0);

        switch (fname) {
            case "ISBLANK":
                result = value.type == "b" ? 1 : 0;
                break;

            case "ISERR":
                result = t == "e" ? (value.type == "e#N/A" ? 0 : 1) : 0;
                break;

            case "ISERROR":
                result = t == "e" ? 1 : 0;
                break;

            case "ISLOGICAL":
                result = value.type == "nl" ? 1 : 0;
                break;

            case "ISNA":
                result = value.type == "e#N/A" ? 1 : 0;
                break;

            case "ISNONTEXT":
                result = t == "t" ? 0 : 1;
                break;

            case "ISNUMBER":
                result = t == "n" ? 1 : 0;
                break;

            case "ISTEXT":
                result = t == "t" ? 1 : 0;
                break;
        }

        scf.PushOperand(operand, resulttype, result);

        return;
    };

    SocialCalc.Formula.FunctionList["ISBLANK"] = [
        SocialCalc.Formula.IsFunctions,
        1,
        "v",
        "",
        "test",
    ];
    SocialCalc.Formula.FunctionList["ISERR"] = [
        SocialCalc.Formula.IsFunctions,
        1,
        "v",
        "",
        "test",
    ];
    SocialCalc.Formula.FunctionList["ISERROR"] = [
        SocialCalc.Formula.IsFunctions,
        1,
        "v",
        "",
        "test",
    ];
    SocialCalc.Formula.FunctionList["ISLOGICAL"] = [
        SocialCalc.Formula.IsFunctions,
        1,
        "v",
        "",
        "test",
    ];
    SocialCalc.Formula.FunctionList["ISNA"] = [
        SocialCalc.Formula.IsFunctions,
        1,
        "v",
        "",
        "test",
    ];
    SocialCalc.Formula.FunctionList["ISNONTEXT"] = [
        SocialCalc.Formula.IsFunctions,
        1,
        "v",
        "",
        "test",
    ];
    SocialCalc.Formula.FunctionList["ISNUMBER"] = [
        SocialCalc.Formula.IsFunctions,
        1,
        "v",
        "",
        "test",
    ];
    SocialCalc.Formula.FunctionList["ISTEXT"] = [
        SocialCalc.Formula.IsFunctions,
        1,
        "v",
        "",
        "test",
    ];

    /*
  #
  # ntv_functions:
  #
  # N(value)
  # T(value)
  # VALUE(value)
  #
  */

    SocialCalc.Formula.NTVFunctions = function (fname, operand, foperand, sheet) {
        var scf = SocialCalc.Formula;
        var result = 0;
        var resulttype = "e#VALUE!";

        var value = scf.OperandValueAndType(sheet, foperand);
        var t = value.type.charAt(0);

        switch (fname) {
            case "N":
                result = t == "n" ? value.value - 0 : 0;
                resulttype = "n";
                break;

            case "T":
                result = t == "t" ? value.value + "" : "";
                resulttype = "t";
                break;

            case "VALUE":
                if (t == "n" || t == "b") {
                    result = value.value || 0;
                    resulttype = "n";
                } else if (t == "t") {
                    value = SocialCalc.DetermineValueType(value.value);
                    if (value.type.charAt(0) != "n") {
                        result = 0;
                        resulttype = "e#VALUE!";
                    } else {
                        result = value.value - 0;
                        resulttype = "n";
                    }
                }
                break;
        }

        if (t == "e") {
            // error trumps
            resulttype = value.type;
        }

        scf.PushOperand(operand, resulttype, result);

        return;
    };

    SocialCalc.Formula.FunctionList["N"] = [
        SocialCalc.Formula.NTVFunctions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["T"] = [
        SocialCalc.Formula.NTVFunctions,
        1,
        "v",
        "",
        "text",
    ];
    SocialCalc.Formula.FunctionList["VALUE"] = [
        SocialCalc.Formula.NTVFunctions,
        1,
        "v",
        "",
        "text",
    ];

    /*
  #
  # ABS(value)
  # ACOS(value)
  # ASIN(value)
  # ATAN(value)
  # COS(value)
  # DEGREES(value)
  # EVEN(value)
  # EXP(value)
  # FACT(value)
  # INT(value)
  # LN(value)
  # LOG10(value)
  # ODD(value)
  # RADIANS(value)
  # SIN(value)
  # SQRT(value)
  # TAN(value)
  #
  */

    SocialCalc.Formula.Math1Functions = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var v1, value, f;
        var result = {};

        var scf = SocialCalc.Formula;

        v1 = scf.OperandAsNumber(sheet, foperand);
        value = v1.value;
        result.type = scf.LookupResultType(
            v1.type,
            v1.type,
            scf.TypeLookupTable.oneargnumeric
        );

        if (result.type == "n") {
            switch (fname) {
                case "ABS":
                    value = Math.abs(value);
                    break;

                case "ACOS":
                    if (value >= -1 && value <= 1) {
                        value = Math.acos(value);
                    } else {
                        result.type = "e#NUM!";
                    }
                    break;

                case "ASIN":
                    if (value >= -1 && value <= 1) {
                        value = Math.asin(value);
                    } else {
                        result.type = "e#NUM!";
                    }
                    break;

                case "ATAN":
                    value = Math.atan(value);
                    break;

                case "COS":
                    value = Math.cos(value);
                    break;

                case "DEGREES":
                    value = (value * 180) / Math.PI;
                    break;

                case "EVEN":
                    value = value < 0 ? -value : value;
                    if (value != Math.floor(value)) {
                        value = Math.floor(value + 1) + (Math.floor(value + 1) % 2);
                    } else {
                        // integer
                        value = value + (value % 2);
                    }
                    if (v1.value < 0) value = -value;
                    break;

                case "EXP":
                    value = Math.exp(value);
                    break;

                case "FACT":
                    f = 1;
                    value = Math.floor(value);
                    for (; value > 0; value--) {
                        f *= value;
                    }
                    value = f;
                    break;

                case "INT":
                    value = Math.floor(value); // spreadsheet INT is floor(), not int()
                    break;

                case "LN":
                    if (value <= 0) {
                        result.type = "e#NUM!";
                        result.error = SocialCalc.Constants.s_sheetfunclnarg;
                    }
                    value = Math.log(value);
                    break;

                case "LOG10":
                    if (value <= 0) {
                        result.type = "e#NUM!";
                        result.error = SocialCalc.Constants.s_sheetfunclog10arg;
                    }
                    value = Math.log(value) / Math.log(10);
                    break;

                case "ODD":
                    value = value < 0 ? -value : value;
                    if (value != Math.floor(value)) {
                        value = Math.floor(value + 1) + (1 - (Math.floor(value + 1) % 2));
                    } else {
                        // integer
                        value = value + (1 - (value % 2));
                    }
                    if (v1.value < 0) value = -value;
                    break;

                case "RADIANS":
                    value = (value * Math.PI) / 180;
                    break;

                case "SIN":
                    value = Math.sin(value);
                    break;

                case "SQRT":
                    if (value >= 0) {
                        value = Math.sqrt(value);
                    } else {
                        result.type = "e#NUM!";
                    }
                    break;

                case "TAN":
                    if (Math.cos(value) != 0) {
                        value = Math.tan(value);
                    } else {
                        result.type = "e#NUM!";
                    }
                    break;
            }
        }

        result.value = value;
        operand.push(result);

        return null;
    };

    // Add to function list
    SocialCalc.Formula.FunctionList["ABS"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["ACOS"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["ASIN"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["ATAN"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["COS"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["DEGREES"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["EVEN"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["EXP"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["FACT"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["INT"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["LN"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["LOG10"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["ODD"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["RADIANS"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["SIN"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["SQRT"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["TAN"] = [
        SocialCalc.Formula.Math1Functions,
        1,
        "v",
        "",
        "math",
    ];

    /*
  #
  # ATAN2(x, y)
  # MOD(a, b)
  # POWER(a, b)
  # TRUNC(value, precision)
  #
  */

    SocialCalc.Formula.Math2Functions = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var xval, yval, value, quotient, decimalscale, i;
        var result = {};

        var scf = SocialCalc.Formula;

        xval = scf.OperandAsNumber(sheet, foperand);
        yval = scf.OperandAsNumber(sheet, foperand);
        value = 0;
        result.type = scf.LookupResultType(
            xval.type,
            yval.type,
            scf.TypeLookupTable.twoargnumeric
        );

        if (result.type == "n") {
            switch (fname) {
                case "ATAN2":
                    if (xval.value == 0 && yval.value == 0) {
                        result.type = "e#DIV/0!";
                    } else {
                        result.value = Math.atan2(yval.value, xval.value);
                    }
                    break;

                case "POWER":
                    result.value = Math.pow(xval.value, yval.value);
                    if (isNaN(result.value)) {
                        result.value = 0;
                        result.type = "e#NUM!";
                    }
                    break;

                case "MOD": // en.wikipedia.org/wiki/Modulo_operation, etc.
                    if (yval.value == 0) {
                        result.type = "e#DIV/0!";
                    } else {
                        quotient = xval.value / yval.value;
                        quotient = Math.floor(quotient);
                        result.value = xval.value - quotient * yval.value;
                    }
                    break;

                case "TRUNC":
                    decimalscale = 1; // cut down to required number of decimal digits
                    if (yval.value >= 0) {
                        yval.value = Math.floor(yval.value);
                        for (i = 0; i < yval.value; i++) {
                            decimalscale *= 10;
                        }
                        result.value =
                            Math.floor(Math.abs(xval.value) * decimalscale) / decimalscale;
                    } else if (yval.value < 0) {
                        yval.value = Math.floor(-yval.value);
                        for (i = 0; i < yval.value; i++) {
                            decimalscale *= 10;
                        }
                        result.value =
                            Math.floor(Math.abs(xval.value) / decimalscale) * decimalscale;
                    }
                    if (xval.value < 0) {
                        result.value = -result.value;
                    }
            }
        }

        operand.push(result);

        return null;
    };

    // Add to function list
    SocialCalc.Formula.FunctionList["ATAN2"] = [
        SocialCalc.Formula.Math2Functions,
        2,
        "xy",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["MOD"] = [
        SocialCalc.Formula.Math2Functions,
        2,
        "",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["POWER"] = [
        SocialCalc.Formula.Math2Functions,
        2,
        "",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["TRUNC"] = [
        SocialCalc.Formula.Math2Functions,
        2,
        "valpre",
        "",
        "math",
    ];

    /*
  #
  # LOG(value,[base])
  #
  */

    SocialCalc.Formula.LogFunction = function (fname, operand, foperand, sheet) {
        var value, value2;
        var result = {};

        var scf = SocialCalc.Formula;

        result.value = 0;

        value = scf.OperandAsNumber(sheet, foperand);
        result.type = scf.LookupResultType(
            value.type,
            value.type,
            scf.TypeLookupTable.oneargnumeric
        );
        if (foperand.length == 1) {
            value2 = scf.OperandAsNumber(sheet, foperand);
            if (value2.type.charAt(0) != "n" || value2.value <= 0) {
                scf.FunctionSpecificError(
                    fname,
                    operand,
                    "e#NUM!",
                    SocialCalc.Constants.s_sheetfunclogsecondarg
                );
                return 0;
            }
        } else if (foperand.length != 0) {
            scf.FunctionArgsError(fname, operand);
            return 0;
        } else {
            value2 = { value: Math.E, type: "n" };
        }

        if (result.type == "n") {
            if (value.value <= 0) {
                scf.FunctionSpecificError(
                    fname,
                    operand,
                    "e#NUM!",
                    SocialCalc.Constants.s_sheetfunclogfirstarg
                );
                return 0;
            }
            result.value = Math.log(value.value) / Math.log(value2.value);
        }

        operand.push(result);

        return;
    };

    SocialCalc.Formula.FunctionList["LOG"] = [
        SocialCalc.Formula.LogFunction,
        -1,
        "log",
        "",
        "math",
    ];

    /*
  #
  # ROUND(value,[precision])
  #
  */

    SocialCalc.Formula.RoundFunction = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var value2, decimalscale, scaledvalue, i;

        var scf = SocialCalc.Formula;
        var result = 0;
        var resulttype = "e#VALUE!";

        var value = scf.OperandValueAndType(sheet, foperand);
        var resulttype = scf.LookupResultType(
            value.type,
            value.type,
            scf.TypeLookupTable.oneargnumeric
        );

        if (foperand.length == 1) {
            value2 = scf.OperandValueAndType(sheet, foperand);
            if (value2.type.charAt(0) != "n") {
                scf.FunctionSpecificError(
                    fname,
                    operand,
                    "e#NUM!",
                    SocialCalc.Constants.s_sheetfuncroundsecondarg
                );
                return 0;
            }
        } else if (foperand.length != 0) {
            scf.FunctionArgsError(fname, operand);
            return 0;
        } else {
            value2 = { value: 0, type: "n" }; // if no second arg, assume 0 for simple round
        }

        if (resulttype == "n") {
            value2.value = value2.value - 0;
            if (value2.value == 0) {
                result = Math.round(value.value);
            } else if (value2.value > 0) {
                decimalscale = 1; // cut down to required number of decimal digits
                value2.value = Math.floor(value2.value);
                for (i = 0; i < value2.value; i++) {
                    decimalscale *= 10;
                }
                scaledvalue = Math.round(value.value * decimalscale);
                result = scaledvalue / decimalscale;
            } else if (value2.value < 0) {
                decimalscale = 1; // cut down to required number of decimal digits
                value2.value = Math.floor(-value2.value);
                for (i = 0; i < value2.value; i++) {
                    decimalscale *= 10;
                }
                scaledvalue = Math.round(value.value / decimalscale);
                result = scaledvalue * decimalscale;
            }
        }

        scf.PushOperand(operand, resulttype, result);

        return;
    };

    SocialCalc.Formula.FunctionList["ROUND"] = [
        SocialCalc.Formula.RoundFunction,
        -1,
        "vp",
        "",
        "math",
    ];

    /*
  #
  # AND(v1,c1:c2,...)
  # OR(v1,c1:c2,...)
  #
  */

    SocialCalc.Formula.AndOrFunctions = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var value1, result;

        var scf = SocialCalc.Formula;
        var resulttype = "";

        if (fname == "AND") {
            result = 1;
        } else if (fname == "OR") {
            result = 0;
        }

        while (foperand.length) {
            value1 = scf.OperandValueAndType(sheet, foperand);
            if (value1.type.charAt(0) == "n") {
                value1.value = value1.value - 0;
                if (fname == "AND") {
                    result = value1.value != 0 ? result : 0;
                } else if (fname == "OR") {
                    result = value1.value != 0 ? 1 : result;
                }
                resulttype = scf.LookupResultType(
                    value1.type,
                    resulttype || "nl",
                    scf.TypeLookupTable.propagateerror
                );
            } else if (value1.type.charAt(0) == "e" && resulttype.charAt(0) != "e") {
                resulttype = value1.type;
            }
        }
        if (resulttype.length < 1) {
            resulttype = "e#VALUE!";
            result = 0;
        }

        scf.PushOperand(operand, resulttype, result);

        return;
    };

    SocialCalc.Formula.FunctionList["AND"] = [
        SocialCalc.Formula.AndOrFunctions,
        -1,
        "vn",
        "",
        "test",
    ];
    SocialCalc.Formula.FunctionList["OR"] = [
        SocialCalc.Formula.AndOrFunctions,
        -1,
        "vn",
        "",
        "test",
    ];

    /*
  #
  # NOT(value)
  #
  */

    SocialCalc.Formula.NotFunction = function (fname, operand, foperand, sheet) {
        var result = 0;
        var scf = SocialCalc.Formula;
        var value = scf.OperandValueAndType(sheet, foperand);
        var resulttype = scf.LookupResultType(
            value.type,
            value.type,
            scf.TypeLookupTable.propagateerror
        );

        if (value.type.charAt(0) == "n" || value.type == "b") {
            result = value.value - 0 != 0 ? 0 : 1; // do the "not" operation
            resulttype = "nl";
        } else if (value.type.charAt(0) == "t") {
            resulttype = "e#VALUE!";
        }

        scf.PushOperand(operand, resulttype, result);

        return;
    };

    SocialCalc.Formula.FunctionList["NOT"] = [
        SocialCalc.Formula.NotFunction,
        1,
        "v",
        "",
        "test",
    ];

    /*
  #
  # CHOOSE(index,value1,value2,...)
  #
  */

    SocialCalc.Formula.ChooseFunction = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var resulttype, count, value1;
        var result = 0;
        var scf = SocialCalc.Formula;

        var cindex = scf.OperandAsNumber(sheet, foperand);

        if (cindex.type.charAt(0) != "n") {
            cindex.value = 0;
        }
        cindex.value = Math.floor(cindex.value);

        count = 0;
        while (foperand.length) {
            value1 = scf.TopOfStackValueAndType(sheet, foperand);
            count += 1;
            if (cindex.value == count) {
                result = value1.value;
                resulttype = value1.type;
                break;
            }
        }
        if (resulttype) {
            // found something
            scf.PushOperand(operand, resulttype, result);
        } else {
            scf.PushOperand(operand, "e#VALUE!", 0);
        }

        return;
    };

    SocialCalc.Formula.FunctionList["CHOOSE"] = [
        SocialCalc.Formula.ChooseFunction,
        -2,
        "choose",
        "",
        "lookup",
    ];

    /*
  #
  # COLUMNS(c1:c2)
  # ROWS(c1:c2)
  #
  */

    SocialCalc.Formula.ColumnsRowsFunctions = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var resulttype, rangeinfo;
        var result = 0;
        var scf = SocialCalc.Formula;

        var value1 = scf.TopOfStackValueAndType(sheet, foperand);

        if (value1.type == "coord") {
            result = 1;
            resulttype = "n";
        } else if (value1.type == "range") {
            rangeinfo = scf.DecodeRangeParts(sheet, value1.value);
            if (fname == "COLUMNS") {
                result = rangeinfo.ncols;
            } else if (fname == "ROWS") {
                result = rangeinfo.nrows;
            }
            resulttype = "n";
        } else {
            result = 0;
            resulttype = "e#VALUE!";
        }

        scf.PushOperand(operand, resulttype, result);

        return;
    };

    SocialCalc.Formula.FunctionList["COLUMNS"] = [
        SocialCalc.Formula.ColumnsRowsFunctions,
        1,
        "range",
        "",
        "lookup",
    ];
    SocialCalc.Formula.FunctionList["ROWS"] = [
        SocialCalc.Formula.ColumnsRowsFunctions,
        1,
        "range",
        "",
        "lookup",
    ];

    /*
  #
  # FALSE()
  # NA()
  # NOW()
  # PI()
  # TODAY()
  # TRUE()
  #
  */

    SocialCalc.Formula.ZeroArgFunctions = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var startval, tzoffset, start_1_1_1970, seconds_in_a_day, nowdays;
        var result = { value: 0 };

        switch (fname) {
            case "FALSE":
                result.type = "nl";
                result.value = 0;
                break;

            case "NA":
                result.type = "e#N/A";
                break;

            case "NOW":
                startval = new Date();
                tzoffset = startval.getTimezoneOffset();
                startval = startval.getTime() / 1000; // convert to seconds
                start_1_1_1970 = 25569; // Day number of 1/1/1970 starting with 1/1/1900 as 1
                seconds_in_a_day = 24 * 60 * 60;
                nowdays =
                    start_1_1_1970 + startval / seconds_in_a_day - tzoffset / (24 * 60);
                result.value = nowdays;
                result.type = "ndt";
                SocialCalc.Formula.FreshnessInfo.volatile.NOW = true; // remember
                break;

            case "PI":
                result.type = "n";
                result.value = Math.PI;
                break;

            case "TODAY":
                startval = new Date();
                tzoffset = startval.getTimezoneOffset();
                startval = startval.getTime() / 1000; // convert to seconds
                start_1_1_1970 = 25569; // Day number of 1/1/1970 starting with 1/1/1900 as 1
                seconds_in_a_day = 24 * 60 * 60;
                nowdays =
                    start_1_1_1970 + startval / seconds_in_a_day - tzoffset / (24 * 60);
                result.value = Math.floor(nowdays);
                result.type = "nd";
                SocialCalc.Formula.FreshnessInfo.volatile.TODAY = true; // remember
                break;

            case "TRUE":
                result.type = "nl";
                result.value = 1;
                break;
        }

        operand.push(result);

        return null;
    };

    // Add to function list
    SocialCalc.Formula.FunctionList["FALSE"] = [
        SocialCalc.Formula.ZeroArgFunctions,
        0,
        "",
        "",
        "test",
    ];
    SocialCalc.Formula.FunctionList["NA"] = [
        SocialCalc.Formula.ZeroArgFunctions,
        0,
        "",
        "",
        "test",
    ];
    SocialCalc.Formula.FunctionList["NOW"] = [
        SocialCalc.Formula.ZeroArgFunctions,
        0,
        "",
        "",
        "datetime",
    ];
    SocialCalc.Formula.FunctionList["PI"] = [
        SocialCalc.Formula.ZeroArgFunctions,
        0,
        "",
        "",
        "math",
    ];
    SocialCalc.Formula.FunctionList["TODAY"] = [
        SocialCalc.Formula.ZeroArgFunctions,
        0,
        "",
        "",
        "datetime",
    ];
    SocialCalc.Formula.FunctionList["TRUE"] = [
        SocialCalc.Formula.ZeroArgFunctions,
        0,
        "",
        "",
        "test",
    ];

    //
    // * * * * * FINANCIAL FUNCTIONS * * * * *
    //

    /*
  #
  # DDB(cost,salvage,lifetime,period,[method])
  #
  # Depreciation, method defaults to 2 for double-declining balance
  # See: http://en.wikipedia.org/wiki/Depreciation
  #
  */

    SocialCalc.Formula.DDBFunction = function (fname, operand, foperand, sheet) {
        var method, depreciation, accumulateddepreciation, i;
        var scf = SocialCalc.Formula;

        var cost = scf.OperandAsNumber(sheet, foperand);
        var salvage = scf.OperandAsNumber(sheet, foperand);
        var lifetime = scf.OperandAsNumber(sheet, foperand);
        var period = scf.OperandAsNumber(sheet, foperand);

        if (scf.CheckForErrorValue(operand, cost)) return;
        if (scf.CheckForErrorValue(operand, salvage)) return;
        if (scf.CheckForErrorValue(operand, lifetime)) return;
        if (scf.CheckForErrorValue(operand, period)) return;

        if (lifetime.value < 1) {
            scf.FunctionSpecificError(
                fname,
                operand,
                "e#NUM!",
                SocialCalc.Constants.s_sheetfuncddblife
            );
            return 0;
        }

        method = { value: 2, type: "n" };
        if (foperand.length > 0) {
            method = scf.OperandAsNumber(sheet, foperand);
        }
        if (foperand.length != 0) {
            scf.FunctionArgsError(fname, operand);
            return 0;
        }
        if (scf.CheckForErrorValue(operand, method)) return;

        depreciation = 0; // calculated for each period
        accumulateddepreciation = 0; // accumulated by adding each period's

        for (i = 1; i <= period.value - 0 && i <= lifetime.value; i++) {
            // calculate for each period based on net from previous
            depreciation =
                (cost.value - accumulateddepreciation) *
                (method.value / lifetime.value);
            if (cost.value - accumulateddepreciation - depreciation < salvage.value) {
                // don't go lower than salvage value
                depreciation = cost.value - accumulateddepreciation - salvage.value;
            }
            accumulateddepreciation += depreciation;
        }

        scf.PushOperand(operand, "n$", depreciation);

        return;
    };

    SocialCalc.Formula.FunctionList["DDB"] = [
        SocialCalc.Formula.DDBFunction,
        -4,
        "ddb",
        "",
        "financial",
    ];

    /*
  #
  # SLN(cost,salvage,lifetime)
  #
  # Depreciation for each period by straight-line method
  # See: http://en.wikipedia.org/wiki/Depreciation
  #
  */

    SocialCalc.Formula.SLNFunction = function (fname, operand, foperand, sheet) {
        var depreciation;
        var scf = SocialCalc.Formula;

        var cost = scf.OperandAsNumber(sheet, foperand);
        var salvage = scf.OperandAsNumber(sheet, foperand);
        var lifetime = scf.OperandAsNumber(sheet, foperand);

        if (scf.CheckForErrorValue(operand, cost)) return;
        if (scf.CheckForErrorValue(operand, salvage)) return;
        if (scf.CheckForErrorValue(operand, lifetime)) return;

        if (lifetime.value < 1) {
            scf.FunctionSpecificError(
                fname,
                operand,
                "e#NUM!",
                SocialCalc.Constants.s_sheetfuncslnlife
            );
            return 0;
        }

        depreciation = (cost.value - salvage.value) / lifetime.value;

        scf.PushOperand(operand, "n$", depreciation);

        return;
    };

    SocialCalc.Formula.FunctionList["SLN"] = [
        SocialCalc.Formula.SLNFunction,
        3,
        "csl",
        "",
        "financial",
    ];

    /*
  #
  # SYD(cost,salvage,lifetime,period)
  #
  # Depreciation by Sum of Year's Digits method
  #
  */

    SocialCalc.Formula.SYDFunction = function (fname, operand, foperand, sheet) {
        var depreciation, sumperiods;
        var scf = SocialCalc.Formula;

        var cost = scf.OperandAsNumber(sheet, foperand);
        var salvage = scf.OperandAsNumber(sheet, foperand);
        var lifetime = scf.OperandAsNumber(sheet, foperand);
        var period = scf.OperandAsNumber(sheet, foperand);

        if (scf.CheckForErrorValue(operand, cost)) return;
        if (scf.CheckForErrorValue(operand, salvage)) return;
        if (scf.CheckForErrorValue(operand, lifetime)) return;
        if (scf.CheckForErrorValue(operand, period)) return;

        if (lifetime.value < 1 || period.value <= 0) {
            scf.PushOperand(operand, "e#NUM!", 0);
            return 0;
        }

        sumperiods = ((lifetime.value + 1) * lifetime.value) / 2; // add up 1 through lifetime
        depreciation =
            ((cost.value - salvage.value) * (lifetime.value - period.value + 1)) /
            sumperiods; // calc depreciation

        scf.PushOperand(operand, "n$", depreciation);

        return;
    };

    SocialCalc.Formula.FunctionList["SYD"] = [
        SocialCalc.Formula.SYDFunction,
        4,
        "cslp",
        "",
        "financial",
    ];

    /*
  #
  # FV(rate, n, payment, [pv, [paytype]])
  # NPER(rate, payment, pv, [fv, [paytype]])
  # PMT(rate, n, pv, [fv, [paytype]])
  # PV(rate, n, payment, [fv, [paytype]])
  # RATE(n, payment, pv, [fv, [paytype, [guess]]])
  #
  # Following the Open Document Format formula specification:
  #
  #    PV = - Fv - (Payment * Nper) [if rate equals 0]
  #    Pv*(1+Rate)^Nper + Payment * (1 + Rate*PaymentType) * ( (1+Rate)^nper -1)/Rate + Fv = 0
  #
  # For each function, the formulas are solved for the appropriate value (transformed using
  # basic algebra).
  #
  */

    SocialCalc.Formula.InterestFunctions = function (
        fname,
        operand,
        foperand,
        sheet
    ) {
        var delta, epsilon;
        var resulttype, result, dval, evalue, fval;
        var pv,
            fv,
            rate,
            n,
            payment,
            paytype,
            guess,
            part1,
            part2,
            part3,
            part4,
            part5;
        var olddelta, maxloop, tries, deltaepsilon, rate, oldrate, m;

        var scf = SocialCalc.Formula;

        var aval = scf.OperandAsNumber(sheet, foperand);
        var bval = scf.OperandAsNumber(sheet, foperand);
        var cval = scf.OperandAsNumber(sheet, foperand);

        resulttype = scf.LookupResultType(
            aval.type,
            bval.type,
            scf.TypeLookupTable.twoargnumeric
        );
        resulttype = scf.LookupResultType(
            resulttype,
            cval.type,
            scf.TypeLookupTable.twoargnumeric
        );
        if (foperand.length) {
            // optional arguments
            dval = scf.OperandAsNumber(sheet, foperand);
            resulttype = scf.LookupResultType(
                resulttype,
                dval.type,
                scf.TypeLookupTable.twoargnumeric
            );
            if (foperand.length) {
                // optional arguments
                evalue = scf.OperandAsNumber(sheet, foperand);
                resulttype = scf.LookupResultType(
                    resulttype,
                    evalue.type,
                    scf.TypeLookupTable.twoargnumeric
                );
                if (foperand.length) {
                    // optional arguments
                    if (fname != "RATE") {
                        // only rate has 6 possible args
                        scf.FunctionArgsError(fname, operand);
                        return 0;
                    }
                    fval = scf.OperandAsNumber(sheet, foperand);
                    resulttype = scf.LookupResultType(
                        resulttype,
                        fval.type,
                        scf.TypeLookupTable.twoargnumeric
                    );
                }
            }
        }

        if (resulttype == "n") {
            switch (fname) {
                case "FV": // FV(rate, n, payment, [pv, [paytype]])
                    rate = aval.value;
                    n = bval.value;
                    payment = cval.value;
                    pv = dval != null ? dval.value : 0; // get value if present, or use default
                    paytype = evalue != null ? (evalue.value ? 1 : 0) : 0;
                    if (rate == 0) {
                        // simple calculation if no interest
                        fv = -pv - payment * n;
                    } else {
                        fv = -(
                            pv * Math.pow(1 + rate, n) +
                            (payment * (1 + rate * paytype) * (Math.pow(1 + rate, n) - 1)) /
                            rate
                        );
                    }
                    result = fv;
                    resulttype = "n$";
                    break;

                case "NPER": // NPER(rate, payment, pv, [fv, [paytype]])
                    rate = aval.value;
                    payment = bval.value;
                    pv = cval.value;
                    fv = dval != null ? dval.value : 0;
                    paytype = evalue != null ? (evalue.value ? 1 : 0) : 0;
                    if (rate == 0) {
                        // simple calculation if no interest
                        if (payment == 0) {
                            scf.PushOperand(operand, "e#NUM!", 0);
                            return;
                        }
                        n = (pv + fv) / -payment;
                    } else {
                        part1 = (payment * (1 + rate * paytype)) / rate;
                        part2 = pv + part1;
                        if (part2 == 0 || rate <= -1) {
                            scf.PushOperand(operand, "e#NUM!", 0);
                            return;
                        }
                        part3 = (part1 - fv) / part2;
                        if (part3 <= 0) {
                            scf.PushOperand(operand, "e#NUM!", 0);
                            return;
                        }
                        part4 = Math.log(part3);
                        part5 = Math.log(1 + rate); // rate > -1
                        n = part4 / part5;
                    }
                    result = n;
                    resulttype = "n";
                    break;

                case "PMT": // PMT(rate, n, pv, [fv, [paytype]])
                    rate = aval.value;
                    n = bval.value;
                    pv = cval.value;
                    fv = dval != null ? dval.value : 0;
                    paytype = evalue != null ? (evalue.value ? 1 : 0) : 0;
                    if (n == 0) {
                        scf.PushOperand(operand, "e#NUM!", 0);
                        return;
                    } else if (rate == 0) {
                        // simple calculation if no interest
                        payment = (fv - pv) / n;
                    } else {
                        payment =
                            (0 - fv - pv * Math.pow(1 + rate, n)) /
                            (((1 + rate * paytype) * (Math.pow(1 + rate, n) - 1)) / rate);
                    }
                    result = payment;
                    resulttype = "n$";
                    break;

                case "PV": // PV(rate, n, payment, [fv, [paytype]])
                    rate = aval.value;
                    n = bval.value;
                    payment = cval.value;
                    fv = dval != null ? dval.value : 0;
                    paytype = evalue != null ? (eval.value ? 1 : 0) : 0;
                    if (rate == -1) {
                        scf.PushOperand(operand, "e#DIV/0!", 0);
                        return;
                    } else if (rate == 0) {
                        // simple calculation if no interest
                        pv = -fv - payment * n;
                    } else {
                        pv =
                            (-fv -
                                (payment * (1 + rate * paytype) * (Math.pow(1 + rate, n) - 1)) /
                                rate) /
                            Math.pow(1 + rate, n);
                    }
                    result = pv;
                    resulttype = "n$";
                    break;

                case "RATE": // RATE(n, payment, pv, [fv, [paytype, [guess]]])
                    n = aval.value;
                    payment = bval.value;
                    pv = cval.value;
                    fv = dval != null ? dval.value : 0;
                    paytype = evalue != null ? (evalue.value ? 1 : 0) : 0;
                    guess = fval != null ? fval.value : 0.1;

                    // rate is calculated by repeated approximations
                    // The deltas are used to calculate new guesses

                    maxloop = 100;
                    tries = 0;
                    delta = 1;
                    epsilon = 0.0000001; // this is close enough
                    rate = guess || 0.00000001; // zero is not allowed
                    while ((delta >= 0 ? delta : -delta) > epsilon && rate != oldrate) {
                        delta =
                            fv +
                            pv * Math.pow(1 + rate, n) +
                            (payment * (1 + rate * paytype) * (Math.pow(1 + rate, n) - 1)) /
                            rate;
                        if (olddelta != null) {
                            m = (delta - olddelta) / (rate - oldrate) || 0.001; // get slope (not zero)
                            oldrate = rate;
                            rate = rate - delta / m; // look for zero crossing
                            olddelta = delta;
                        } else {
                            // first time - no old values
                            oldrate = rate;
                            rate = 1.1 * rate;
                            olddelta = delta;
                        }
                        tries++;
                        if (tries >= maxloop) {
                            // didn't converge yet
                            scf.PushOperand(operand, "e#NUM!", 0);
                            return;
                        }
                    }
                    result = rate;
                    resulttype = "n%";
                    break;
            }
        }

        scf.PushOperand(operand, resulttype, result);

        return;
    };

    SocialCalc.Formula.FunctionList["FV"] = [
        SocialCalc.Formula.InterestFunctions,
        -3,
        "fv",
        "",
        "financial",
    ];
    SocialCalc.Formula.FunctionList["NPER"] = [
        SocialCalc.Formula.InterestFunctions,
        -3,
        "nper",
        "",
        "financial",
    ];
    SocialCalc.Formula.FunctionList["PMT"] = [
        SocialCalc.Formula.InterestFunctions,
        -3,
        "pmt",
        "",
        "financial",
    ];
    SocialCalc.Formula.FunctionList["PV"] = [
        SocialCalc.Formula.InterestFunctions,
        -3,
        "pv",
        "",
        "financial",
    ];
    SocialCalc.Formula.FunctionList["RATE"] = [
        SocialCalc.Formula.InterestFunctions,
        -3,
        "rate",
        "",
        "financial",
    ];

    /*
  #
  # NPV(rate,v1,v2,c1:c2,...)
  #
  */

    SocialCalc.Formula.NPVFunction = function (fname, operand, foperand, sheet) {
        var resulttypenpv, rate, sum, factor, value1;

        var scf = SocialCalc.Formula;

        var rate = scf.OperandAsNumber(sheet, foperand);
        if (scf.CheckForErrorValue(operand, rate)) return;

        sum = 0;
        resulttypenpv = "n";
        factor = 1;

        while (foperand.length) {
            value1 = scf.OperandValueAndType(sheet, foperand);
            if (value1.type.charAt(0) == "n") {
                factor *= 1 + rate.value;
                if (factor == 0) {
                    scf.PushOperand(operand, "e#DIV/0!", 0);
                    return;
                }
                sum += value1.value / factor;
                resulttypenpv = scf.LookupResultType(
                    value1.type,
                    resulttypenpv || value1.type,
                    scf.TypeLookupTable.plus
                );
            } else if (
                value1.type.charAt(0) == "e" &&
                resulttypenpv.charAt(0) != "e"
            ) {
                resulttypenpv = value1.type;
                break;
            }
        }

        if (resulttypenpv.charAt(0) == "n") {
            resulttypenpv = "n$";
        }

        scf.PushOperand(operand, resulttypenpv, sum);

        return;
    };

    SocialCalc.Formula.FunctionList["NPV"] = [
        SocialCalc.Formula.NPVFunction,
        -2,
        "npv",
        "",
        "financial",
    ];

    /*
  #
  # IRR(c1:c2,[guess])
  #
  */

    SocialCalc.Formula.IRRFunction = function (fname, operand, foperand, sheet) {
        var value1,
            guess,
            oldsum,
            maxloop,
            tries,
            epsilon,
            rate,
            oldrate,
            m,
            sum,
            factor,
            i;
        var rangeoperand = [];
        var cashflows = [];

        var scf = SocialCalc.Formula;

        rangeoperand.push(foperand.pop()); // first operand is a range

        while (rangeoperand.length) {
            // get values from range so we can do iterative approximations
            value1 = scf.OperandValueAndType(sheet, rangeoperand);
            if (value1.type.charAt(0) == "n") {
                cashflows.push(value1.value);
            } else if (value1.type.charAt(0) == "e") {
                scf.PushOperand(operand, "e#VALUE!", 0);
                return;
            }
        }

        if (!cashflows.length) {
            scf.PushOperand(operand, "e#NUM!", 0);
            return;
        }

        guess = { value: 0 };

        if (foperand.length) {
            // guess is provided
            guess = scf.OperandAsNumber(sheet, foperand);
            if (guess.type.charAt(0) != "n" && guess.type.charAt(0) != "b") {
                scf.PushOperand(operand, "e#VALUE!", 0);
                return;
            }
            if (foperand.length) {
                // should be no more args
                scf.FunctionArgsError(fname, operand);
                return;
            }
        }

        guess.value = guess.value || 0.1;

        // rate is calculated by repeated approximations
        // The deltas are used to calculate new guesses

        maxloop = 20;
        tries = 0;
        epsilon = 0.0000001; // this is close enough
        rate = guess.value;
        sum = 1;

        while ((sum >= 0 ? sum : -sum) > epsilon && rate != oldrate) {
            sum = 0;
            factor = 1;
            for (i = 0; i < cashflows.length; i++) {
                factor *= 1 + rate;
                if (factor == 0) {
                    scf.PushOperand(operand, "e#DIV/0!", 0);
                    return;
                }
                sum += cashflows[i] / factor;
            }

            if (oldsum != null) {
                m = (sum - oldsum) / (rate - oldrate); // get slope
                oldrate = rate;
                rate = rate - sum / m; // look for zero crossing
                oldsum = sum;
            } else {
                // first time - no old values
                oldrate = rate;
                rate = 1.1 * rate;
                oldsum = sum;
            }
            tries++;
            if (tries >= maxloop) {
                // didn't converge yet
                scf.PushOperand(operand, "e#NUM!", 0);
                return;
            }
        }

        scf.PushOperand(operand, "n%", rate);

        return;
    };

    SocialCalc.Formula.FunctionList["IRR"] = [
        SocialCalc.Formula.IRRFunction,
        -1,
        "irr",
        "",
        "financial",
    ];

    //
    // SHEET CACHE
    //

    SocialCalc.Formula.SheetCache = {
        // Sheet data: Attributes are each sheet in the cache with values of an object with:
        //
        //    sheet: sheet-obj (or null, meaning not found)
        //    recalcstate: constants.asloaded = as loaded
        //                 constants.recalcing = being recalced now
        //                 constants.recalcdone = recalc done
        //    name: name of sheet (in case just have object and don't know name)
        //

        sheets: {},

        // Waiting for loading:
        // If sheet is not in cache, this is set to the sheetname being loaded
        // so it can be tested in the recalc loop to start load and then wait until restarted.
        // Reset to null before restarting.

        waitingForLoading: null,

        // Constants to use for setting sheets[*].recalcstate:

        constants: { asloaded: 0, recalcing: 1, recalcdone: 2 },

        loadsheet: null, // (deprecated - use SocialCalc.RecalcInfo.LoadSheet)
    };

    //
    // othersheet = SocialCalc.Formula.FindInSheetCache(sheetname)
    //
    // Returns a SocialCalc.Sheet object corresponding to string sheetname
    // or null if the sheet is not available or in error.
    //
    // Each sheet is loaded only once and then stored in a cache.
    // Loading is handled elsewhere, e.g., in the recalc loop.
    //

    SocialCalc.Formula.FindInSheetCache = function (sheetname) {
        var str;
        var sfsc = SocialCalc.Formula.SheetCache;

        var nsheetname = SocialCalc.Formula.NormalizeSheetName(sheetname); // normalize different versions

        if (sfsc.sheets[nsheetname]) {
            // a sheet by that name is in the cache already
            return sfsc.sheets[nsheetname].sheet; // return it
        }

        if (sfsc.waitingForLoading) {
            // waiting already - only queue up one
            return null; // return not found
        }

        sfsc.waitingForLoading = nsheetname; // let recalc loop know that we have a sheet to load

        return null; // return not found
    };

    //
    // newsheet = SocialCalc.Formula.AddSheetToCache(sheetname, str)
    //
    // Adds a new sheet to the sheet cache.
    // Returns the sheet object filled out with the str (a saved sheet).
    //

    SocialCalc.Formula.AddSheetToCache = function (sheetname, str) {
        var newsheet = null;
        var sfsc = SocialCalc.Formula.SheetCache;
        var sfscc = sfsc.constants;
        var newsheetname = SocialCalc.Formula.NormalizeSheetName(sheetname);

        if (str) {
            newsheet = new SocialCalc.Sheet();
            newsheet.ParseSheetSave(str);
        }

        sfsc.sheets[newsheetname] = {
            sheet: newsheet,
            recalcstate: sfscc.asloaded,
            name: newsheetname,
        };

        SocialCalc.Formula.FreshnessInfo.sheets[newsheetname] = true;

        return newsheet;
    };

    //
    // nsheet = SocialCalc.Formula.NormalizeSheetName(sheetname)
    //

    SocialCalc.Formula.NormalizeSheetName = function (sheetname) {
        if (SocialCalc.Callbacks.NormalizeSheetName) {
            return SocialCalc.Callbacks.NormalizeSheetName(sheetname);
        } else {
            return sheetname.toLowerCase();
        }
    };

    //
    // REMOTE FUNCTION INFO
    //

    SocialCalc.Formula.RemoteFunctionInfo = {
        // Waiting for server:
        // If waiting for an XHR response from the server, this is set to some non-blank status text
        // so it can be tested in the recalc loop to start load and then wait until restarted.
        // Reset to null before restarting.

        waitingForServer: null,
    };

    //
    // FRESHNESS INFO
    //
    // This information is generated during recalc.
    // It may be used to help determine when the recalc data in a spreadsheet
    // may be out of date.
    // For example, it may be used to display a message like:
    // "Dependent on sheet 'FOO' which was updated more recently than this printout"

    SocialCalc.Formula.FreshnessInfo = {
        // For each external sheet referenced successfully an attribute of that name with value true.

        sheets: {},

        // For each volatile function that is called an attribute of that name with value true.

        volatile: {},

        // Set to false when started and true when recalc completes

        recalc_completed: false,
    };

    SocialCalc.Formula.FreshnessInfoReset = function () {
        var scffi = SocialCalc.Formula.FreshnessInfo;

        scffi.sheets = {};
        scffi.volatile = {};
        scffi.recalc_completed = false;
    };

    //
    // MISC ROUTINES
    //

    //
    // result = SocialCalc.Formula.PlainCoord(coord)
    //
    // Returns: coord without any $'s
    //

    SocialCalc.Formula.PlainCoord = function (coord) {
        if (coord.indexOf("$") == -1) return coord;

        return coord.replace(/\$/g, ""); // remove any $'s
    };

    //
    // result = SocialCalc.Formula.OrderRangeParts(coord1, coord2)
    //
    // Returns: {c1: col, r1: row, c2: col, r2 = row} with c1/r1 upper left
    //

    SocialCalc.Formula.OrderRangeParts = function (coord1, coord2) {
        var cr1, cr2;
        var result = {};

        cr1 = SocialCalc.coordToCr(coord1);
        cr2 = SocialCalc.coordToCr(coord2);
        if (cr1.col > cr2.col) {
            result.c1 = cr2.col;
            result.c2 = cr1.col;
        } else {
            result.c1 = cr1.col;
            result.c2 = cr2.col;
        }
        if (cr1.row > cr2.row) {
            result.r1 = cr2.row;
            result.r2 = cr1.row;
        } else {
            result.r1 = cr1.row;
            result.r2 = cr2.row;
        }

        return result;
    };

    //
    // cond = SocialCalc.Formula.TestCriteria(value, type, criteria)
    //
    // Determines whether a value/type meets the criteria.
    // A criteria can be a numeric value, text beginning with <, <=, =, >=, >, <>, text by itself is start of text to match.
    // Used by a variety of functions, including the "D" functions (DSUM, etc.).
    //
    // Returns true or false
    //

    SocialCalc.Formula.TestCriteria = function (value, type, criteria) {
        var comparitor, basestring, basevalue, cond, testvalue;

        if (criteria == null) {
            // undefined (e.g., error value) is always false
            return false;
        }

        criteria = criteria + "";
        comparitor = criteria.charAt(0); // look for comparitor
        if (comparitor == "=" || comparitor == "<" || comparitor == ">") {
            basestring = criteria.substring(1);
        } else {
            comparitor = criteria.substring(0, 2);
            if (comparitor == "<=" || comparitor == "<>" || comparitor == ">=") {
                basestring = criteria.substring(2);
            } else {
                comparitor = "none";
                basestring = criteria;
            }
        }

        basevalue = SocialCalc.DetermineValueType(basestring); // get type of value being compared
        if (!basevalue.type) {
            // no criteria base value given
            if (comparitor == "none") {
                // blank criteria matches nothing
                return false;
            }
            if (type.charAt(0) == "b") {
                // comparing to empty cell
                if (comparitor == "=") {
                    // empty equals empty
                    return true;
                }
            } else {
                if (comparitor == "<>") {
                    // "something" does not equal empty
                    return true;
                }
            }
            return false; // otherwise false
        }

        cond = false;

        if (basevalue.type.charAt(0) == "n" && type.charAt(0) == "t") {
            // criteria is number, but value is text
            testvalue = SocialCalc.DetermineValueType(value);
            if (testvalue.type.charAt(0) == "n") {
                // could be number - make it one
                value = testvalue.value;
                type = testvalue.type;
            }
        }

        if (type.charAt(0) == "n" && basevalue.type.charAt(0) == "n") {
            // compare two numbers
            value = value - 0; // make sure numbers
            basevalue.value = basevalue.value - 0;
            switch (comparitor) {
                case "<":
                    cond = value < basevalue.value;
                    break;

                case "<=":
                    cond = value <= basevalue.value;
                    break;

                case "=":
                case "none":
                    cond = value == basevalue.value;
                    break;

                case ">=":
                    cond = value >= basevalue.value;
                    break;

                case ">":
                    cond = value > basevalue.value;
                    break;

                case "<>":
                    cond = value != basevalue.value;
                    break;
            }
        } else if (type.charAt(0) == "e") {
            // error on left
            cond = false;
        } else if (basevalue.type.charAt(0) == "e") {
            // error on right
            cond = false;
        } else {
            // text, maybe mixed with number or blank
            if (type.charAt(0) == "n") {
                value = SocialCalc.format_number_for_display(value, "n", "");
            }
            if (basevalue.type.charAt(0) == "n") {
                return false; // if number and didn't match already, isn't a match
            }

            value = value ? value.toLowerCase() : "";
            basevalue.value = basevalue.value ? basevalue.value.toLowerCase() : "";

            switch (comparitor) {
                case "<":
                    cond = value < basevalue.value;
                    break;

                case "<=":
                    cond = value <= basevalue.value;
                    break;

                case "=":
                    cond = value == basevalue.value;
                    break;

                case "none":
                    cond = value.substring(0, basevalue.value.length) == basevalue.value;
                    break;

                case ">=":
                    cond = value >= basevalue.value;
                    break;

                case ">":
                    cond = value > basevalue.value;
                    break;

                case "<>":
                    cond = value != basevalue.value;
                    break;
            }
        }

        return cond;
    };



    // Make sure SocialCalc is available globally
    if (typeof window !== "undefined") {
        window.SocialCalc = SocialCalc;
    } else if (typeof global !== "undefined") {
        global.SocialCalc = SocialCalc;
    }

    return SocialCalc;
});
