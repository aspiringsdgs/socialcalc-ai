/* eslint-disable */
// SocialCalc Formula Module (tokenizer, parser, evaluator, function registry)
// Part of the SocialCalc core engine - see README.md in this folder for the module map and load order

// UMD wrapper
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.SocialCalcFormula = factory();
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

    //
    /*
  // SocialCalc Spreadsheet Formula Library
  //
  // Part of the SocialCalc package
  //
  // (c) Copyright 2008 Socialtext, Inc.
  // All Rights Reserved.
  //
  // The contents of this file are subject to the Artistic License 2.0; you may not
  // use this file except in compliance with the License. You may obtain a copy of 
  // the License at http://socialcalc.org/licenses/al-20/.
  //
  // Some of the other files in the SocialCalc package are licensed under
  // different licenses. Please note the licenses of the modules you use.
  //
  // Code History:
  //
  // Initially coded by Dan Bricklin of Software Garden, Inc., for Socialtext, Inc.
  // Based in part on the SocialCalc 1.1.0 code written in Perl.
  // The SocialCalc 1.1.0 code was:
  //    Portions (c) Copyright 2005, 2006, 2007 Software Garden, Inc.
  //    All Rights Reserved.
  //    Portions (c) Copyright 2007 Socialtext, Inc.
  //    All Rights Reserved.
  // The Perl SocialCalc started as modifications to the wikiCalc(R) program, version 1.0.
  // wikiCalc 1.0 was written by Software Garden, Inc.
  // Unless otherwise specified, referring to "SocialCalc" in comments refers to this
  // JavaScript version of the code, not the SocialCalc Perl code.
  //
  */

    var SocialCalc;
    if (!SocialCalc) SocialCalc = {}; // May be used with other SocialCalc libraries or standalone
    // In any case, requires SocialCalc.Constants.

    SocialCalc.Formula = {};

    //
    // Formula constants for parsing:
    //

    SocialCalc.Formula.ParseState = {
        num: 1,
        alpha: 2,
        coord: 3,
        string: 4,
        stringquote: 5,
        numexp1: 6,
        numexp2: 7,
        alphanumeric: 8,
        specialvalue: 9,
    };

    SocialCalc.Formula.TokenType = {
        num: 1,
        coord: 2,
        op: 3,
        name: 4,
        error: 5,
        string: 6,
        space: 7,
    };

    SocialCalc.Formula.CharClass = {
        num: 1,
        numstart: 2,
        op: 3,
        eof: 4,
        alpha: 5,
        incoord: 6,
        error: 7,
        quote: 8,
        space: 9,
        specialstart: 10,
    };

    SocialCalc.Formula.CharClassTable = {
        " ": 9,
        "!": 3,
        '"': 8,
        "#": 10,
        $: 6,
        "%": 3,
        "&": 3,
        "(": 3,
        ")": 3,
        "*": 3,
        "+": 3,
        ",": 3,
        "-": 3,
        ".": 2,
        "/": 3,
        0: 1,
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        ":": 3,
        "<": 3,
        "=": 3,
        ">": 3,
        A: 5,
        B: 5,
        C: 5,
        D: 5,
        E: 5,
        F: 5,
        G: 5,
        H: 5,
        I: 5,
        J: 5,
        K: 5,
        L: 5,
        M: 5,
        N: 5,
        O: 5,
        P: 5,
        Q: 5,
        R: 5,
        S: 5,
        T: 5,
        U: 5,
        V: 5,
        W: 5,
        X: 5,
        Y: 5,
        Z: 5,
        "^": 3,
        _: 5,
        a: 5,
        b: 5,
        c: 5,
        d: 5,
        e: 5,
        f: 5,
        g: 5,
        h: 5,
        i: 5,
        j: 5,
        k: 5,
        l: 5,
        m: 5,
        n: 5,
        o: 5,
        p: 5,
        q: 5,
        r: 5,
        s: 5,
        t: 5,
        u: 5,
        v: 5,
        w: 5,
        x: 5,
        y: 5,
        z: 5,
    };

    SocialCalc.Formula.UpperCaseTable = {
        a: "A",
        b: "B",
        c: "C",
        d: "D",
        e: "E",
        f: "F",
        g: "G",
        h: "H",
        i: "I",
        j: "J",
        k: "K",
        l: "L",
        m: "M",
        n: "N",
        o: "O",
        p: "P",
        q: "Q",
        r: "R",
        s: "S",
        t: "T",
        u: "U",
        v: "V",
        w: "W",
        x: "X",
        y: "Y",
        z: "Z",
    };

    SocialCalc.Formula.SpecialConstants = {
        // names that turn into constants for name lookup
        "#NULL!": "0,e#NULL!",
        "#NUM!": "0,e#NUM!",
        "#DIV/0!": "0,e#DIV/0!",
        "#VALUE!": "0,e#VALUE!",
        "#REF!": "0,e#REF!",
        "#NAME?": "0,e#NAME?",
    };

    // Operator Precedence table
    //
    // 1- !, 2- : ,, 3- M P, 4- %, 5- ^, 6- * /, 7- + -, 8- &, 9- < > = G(>=) L(<=) N(<>),
    // Negative value means Right Associative

    SocialCalc.Formula.TokenPrecedence = {
        "!": 1,
        ":": 2,
        ",": 2,
        M: -3,
        P: -3,
        "%": 4,
        "^": 5,
        "*": 6,
        "/": 6,
        "+": 7,
        "-": 7,
        "&": 8,
        "<": 9,
        ">": 9,
        G: 9,
        L: 9,
        N: 9,
    };

    // Convert one-char token text to input text:

    SocialCalc.Formula.TokenOpExpansion = {
        G: ">=",
        L: "<=",
        M: "-",
        N: "<>",
        P: "+",
    };

    //
    // Information about the resulting value types when doing operations on values (used by LookupResultType)
    //
    // Each object entry is an object with specific types with result type info as follows:
    //
    //    'type1a': '|type2a:resulta|type2b:resultb|...
    //    Type of t* or n* matches any of those types not listed
    //    Results may be a type or the numbers 1 or 2 specifying to return type1 or type2

    SocialCalc.Formula.TypeLookupTable = {
        unaryminus: {
            "n*": "|n*:1|",
            "e*": "|e*:1|",
            "t*": "|t*:e#VALUE!|",
            b: "|b:n|",
        },
        unaryplus: {
            "n*": "|n*:1|",
            "e*": "|e*:1|",
            "t*": "|t*:e#VALUE!|",
            b: "|b:n|",
        },
        unarypercent: {
            "n*": "|n:n%|n*:n|",
            "e*": "|e*:1|",
            "t*": "|t*:e#VALUE!|",
            b: "|b:n|",
        },
        plus: {
            "n%": "|n%:n%|nd:n|nt:n|ndt:n|n$:n|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|",
            nd: "|n%:n|nd:nd|nt:ndt|ndt:ndt|n$:n|n:nd|n*:n|b:n|e*:2|t*:e#VALUE!|",
            nt: "|n%:n|nd:ndt|nt:nt|ndt:ndt|n$:n|n:nt|n*:n|b:n|e*:2|t*:e#VALUE!|",
            ndt: "|n%:n|nd:ndt|nt:ndt|ndt:ndt|n$:n|n:ndt|n*:n|b:n|e*:2|t*:e#VALUE!|",
            n$: "|n%:n|nd:n|nt:n|ndt:n|n$:n$|n:n$|n*:n|b:n|e*:2|t*:e#VALUE!|",
            nl: "|n%:n|nd:n|nt:n|ndt:n|n$:n|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|",
            n: "|n%:n|nd:nd|nt:nt|ndt:ndt|n$:n$|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|",
            b: "|n%:n%|nd:nd|nt:nt|ndt:ndt|n$:n$|n:n|n*:n|b:n|e*:2|t*:e#VALUE!|",
            "t*": "|n*:e#VALUE!|t*:e#VALUE!|b:e#VALUE!|e*:2|",
            "e*": "|e*:1|n*:1|t*:1|b:1|",
        },
        concat: {
            t: "|t:t|th:th|tw:tw|tl:t|t*:2|e*:2|",
            th: "|t:th|th:th|tw:t|tl:th|t*:t|e*:2|",
            tw: "|t:tw|th:t|tw:tw|tl:tw|t*:t|e*:2|",
            tl: "|t:tl|th:th|tw:tw|tl:tl|t*:t|e*:2|",
            "e*": "|e*:1|n*:1|t*:1|",
        },
        oneargnumeric: {
            "n*": "|n*:n|",
            "e*": "|e*:1|",
            "t*": "|t*:e#VALUE!|",
            b: "|b:n|",
        },
        twoargnumeric: {
            "n*": "|n*:n|t*:e#VALUE!|e*:2|",
            "e*": "|e*:1|n*:1|t*:1|",
            "t*": "|t*:e#VALUE!|n*:e#VALUE!|e*:2|",
        },
        propagateerror: {
            "n*": "|n*:2|e*:2|",
            "e*": "|e*:2|",
            "t*": "|t*:2|e*:2|",
            b: "|b:2|e*:2|",
        },
    };

    /* *******************
  
   parseinfo = SocialCalc.Formula.ParseFormulaIntoTokens(line)
  
   Parses a text string as if it was a spreadsheet formula
  
   This uses a simple state machine run on each character in turn.
   States remember whether a number is being gathered, etc.
   The result is parseinfo which is an array with one entry for each token:
     parseinfo[i] = {
       text: "the characters making up the parsed token",
       type: the type of the token (a number),
       opcode: a single character version of an operator suitable for use in the
                    precedence table and distinguishing between unary and binary + and -.
  
  ************************* */

    SocialCalc.Formula.ParseFormulaIntoTokens = function (line) {
        var i,
            ch,
            chclass,
            haddecimal,
            last_token,
            last_token_type,
            last_token_text,
            t;

        var scf = SocialCalc.Formula;
        var scc = SocialCalc.Constants;
        var parsestate = scf.ParseState;
        var tokentype = scf.TokenType;
        var charclass = scf.CharClass;
        var charclasstable = scf.CharClassTable;
        var uppercasetable = scf.UpperCaseTable; // much faster than toUpperCase function
        var pushtoken = scf.ParsePushToken;
        var coordregex = /^\$?[A-Z]{1,2}\$?[1-9]\d*$/i;

        var parseinfo = [];
        var str = "";
        var state = 0;
        var haddecimal = false;
        var cclass;

        for (i = 0; i <= line.length; i++) {
            if (i < line.length) {
                ch = line.charAt(i);
                cclass = charclasstable[ch];
            } else {
                ch = "";
                cclass = charclass.eof;
            }

            if (state == parsestate.num) {
                if (cclass == charclass.num) {
                    str += ch;
                } else if (cclass == charclass.numstart && !haddecimal) {
                    haddecimal = true;
                    str += ch;
                } else if (ch == "E" || ch == "e") {
                    str += ch;
                    haddecimal = false;
                    state = parsestate.numexp1;
                } else {
                    // end of number - save it
                    pushtoken(parseinfo, str, tokentype.num, 0);
                    haddecimal = false;
                    state = 0;
                }
            }

            if (state == parsestate.numexp1) {
                if (cclass == parsestate.num) {
                    state = parsestate.numexp2;
                } else if (
                    (ch == "+" || ch == "-") &&
                    uppercasetable[str.charAt(str.length - 1)] == "E"
                ) {
                    str += ch;
                } else if (ch == "E" || ch == "e") {
                } else {
                    pushtoken(parseinfo, scc.s_parseerrexponent, tokentype.error, 0);
                    state = 0;
                }
            }

            if (state == parsestate.numexp2) {
                if (cclass == charclass.num) {
                    str += ch;
                } else {
                    // end of number - save it
                    pushtoken(parseinfo, str, tokentype.num, 0);
                    state = 0;
                }
            }

            if (state == parsestate.alpha) {
                if (cclass == charclass.num) {
                    state = parsestate.coord;
                } else if (cclass == charclass.alpha || ch == ".") {
                    // alpha may be letters, numbers, "_", or "."
                    str += ch;
                } else if (cclass == charclass.incoord) {
                    state = parsestate.coord;
                } else if (
                    cclass == charclass.op ||
                    cclass == charclass.numstart ||
                    cclass == charclass.space ||
                    cclass == charclass.eof
                ) {
                    pushtoken(parseinfo, str.toUpperCase(), tokentype.name, 0);
                    state = 0;
                } else {
                    pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
                    state = 0;
                }
            }

            if (state == parsestate.coord) {
                if (cclass == charclass.num) {
                    str += ch;
                } else if (cclass == charclass.incoord) {
                    str += ch;
                } else if (cclass == charclass.alpha) {
                    state = parsestate.alphanumeric;
                } else if (
                    cclass == charclass.op ||
                    cclass == charclass.numstart ||
                    cclass == charclass.eof ||
                    cclass == charclass.space
                ) {
                    if (coordregex.test(str)) {
                        t = tokentype.coord;
                    } else {
                        t = tokentype.name;
                    }
                    pushtoken(parseinfo, str.toUpperCase(), t, 0);
                    state = 0;
                } else {
                    pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
                    state = 0;
                }
            }

            if (state == parsestate.alphanumeric) {
                if (cclass == charclass.num || cclass == charclass.alpha) {
                    str += ch;
                } else if (
                    cclass == charclass.op ||
                    cclass == charclass.numstart ||
                    cclass == charclass.space ||
                    cclass == charclass.eof
                ) {
                    pushtoken(parseinfo, str.toUpperCase(), tokentype.name, 0);
                    state = 0;
                } else {
                    pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
                    state = 0;
                }
            }

            if (state == parsestate.string) {
                if (cclass == charclass.quote) {
                    state = parsestate.stringquote; // got quote in string: is it doubled (quote in string) or by itself (end of string)?
                } else if (cclass == charclass.eof) {
                    pushtoken(parseinfo, scc.s_parseerrstring, tokentype.error, 0);
                    state = 0;
                } else {
                    str += ch;
                }
            } else if (state == parsestate.stringquote) {
                // note else if here
                if (cclass == charclass.quote) {
                    str += '"';
                    state = parsestate.string; // double quote: add one then continue getting string
                } else {
                    // something else -- end of string
                    pushtoken(parseinfo, str, tokentype.string, 0);
                    state = 0; // drop through to process
                }
            } else if (state == parsestate.specialvalue) {
                // special values like #REF!
                if (str.charAt(str.length - 1) == "!") {
                    // done - save value as a name
                    pushtoken(parseinfo, str, tokentype.name, 0);
                    state = 0; // drop through to process
                } else if (cclass == charclass.eof) {
                    pushtoken(parseinfo, scc.s_parseerrspecialvalue, tokentype.error, 0);
                    state = 0;
                } else {
                    str += ch;
                }
            }

            if (state == 0) {
                if (cclass == charclass.num) {
                    str = ch;
                    state = parsestate.num;
                } else if (cclass == charclass.numstart) {
                    str = ch;
                    haddecimal = true;
                    state = parsestate.num;
                } else if (cclass == charclass.alpha || cclass == charclass.incoord) {
                    str = ch;
                    state = parsestate.alpha;
                } else if (cclass == charclass.specialstart) {
                    str = ch;
                    state = parsestate.specialvalue;
                } else if (cclass == charclass.op) {
                    str = ch;
                    if (parseinfo.length > 0) {
                        last_token = parseinfo[parseinfo.length - 1];
                        last_token_type = last_token.type;
                        last_token_text = last_token.text;
                        if (last_token_type == charclass.op) {
                            if (last_token_text == "<" || last_token_text == ">") {
                                str = last_token_text + str;
                                parseinfo.pop();
                                if (parseinfo.length > 0) {
                                    last_token = parseinfo[parseinfo.length - 1];
                                    last_token_type = last_token.type;
                                    last_token_text = last_token.text;
                                } else {
                                    last_token_type = charclass.eof;
                                    last_token_text = "EOF";
                                }
                            }
                        }
                    } else {
                        last_token_type = charclass.eof;
                        last_token_text = "EOF";
                    }
                    t = tokentype.op;
                    if (
                        parseinfo.length == 0 ||
                        (last_token_type == charclass.op &&
                            last_token_text != ")" &&
                            last_token_text != "%")
                    ) {
                        // Unary operator
                        if (str == "-") {
                            // M is unary minus
                            str = "M";
                            ch = "M";
                        } else if (str == "+") {
                            // P is unary plus
                            str = "P";
                            ch = "P";
                        } else if (str == ")" && last_token_text == "(") {
                            // null arg list OK
                        } else if (str != "(") {
                            // binary-op open-paren OK, others no
                            t = tokentype.error;
                            str = scc.s_parseerrtwoops;
                        }
                    } else if (str.length > 1) {
                        if (str == ">=") {
                            // G is >=
                            str = "G";
                            ch = "G";
                        } else if (str == "<=") {
                            // L is <=
                            str = "L";
                            ch = "L";
                        } else if (str == "<>") {
                            // N is <>
                            str = "N";
                            ch = "N";
                        } else {
                            t = tokentype.error;
                            str = scc.s_parseerrtwoops;
                        }
                    }
                    pushtoken(parseinfo, str, t, ch);
                    state = 0;
                } else if (cclass == charclass.quote) {
                    // starting a string
                    str = "";
                    state = parsestate.string;
                } else if (cclass == charclass.space) {
                    // store so can reconstruct spacing
                    pushtoken(parseinfo, " ", tokentype.space, 0);
                } else if (cclass == charclass.eof) {
                    // ignore -- needed to have extra loop to close out other things
                } else {
                    // unknown class - such as unknown char
                    pushtoken(parseinfo, scc.s_parseerrchar, tokentype.error, 0);
                }
            }
        }

        return parseinfo;
    };

    SocialCalc.Formula.ParsePushToken = function (
        parseinfo,
        ttext,
        ttype,
        topcode
    ) {
        parseinfo.push({ text: ttext, type: ttype, opcode: topcode });
    };

    /* *******************
  
   result = SocialCalc.Formula.evaluate_parsed_formula(parseinfo, sheet, allowrangereturn)
  
   Does the calculation expressed in a parsed formula, returning a value, its type, and error info
   returns: {value: value, type: valuetype, error: errortext}.
  
   If allowrangereturn is present and true, can return a range (e.g., "A1:A10" - translated from "A1|A10|")
  
  ************************* */

    SocialCalc.Formula.evaluate_parsed_formula = function (
        parseinfo,
        sheet,
        allowrangereturn
    ) {
        var result;

        var scf = SocialCalc.Formula;
        var tokentype = scf.TokenType;

        var revpolish;
        var parsestack = [];

        var errortext = "";

        revpolish = scf.ConvertInfixToPolish(parseinfo); // result is either an array or a string with error text

        result = scf.EvaluatePolish(parseinfo, revpolish, sheet, allowrangereturn);

        return result;
    };

    //
    // revpolish = SocialCalc.Formula.ConvertInfixToPolish(parseinfo)
    //
    // Convert infix to reverse polish notation
    //
    // Returns revpolish array with a sequence of references to tokens by number if successful.
    // Errors return a string with the error.
    //
    // Based upon the algorithm shown in Wikipedia "Reverse Polish notation" article
    // and then enhanced for additional spreadsheet things
    //

    SocialCalc.Formula.ConvertInfixToPolish = function (parseinfo) {
        var scf = SocialCalc.Formula;
        var scc = SocialCalc.Constants;
        var tokentype = scf.TokenType;
        var token_precedence = scf.TokenPrecedence;

        var revpolish = [];
        var parsestack = [];

        var errortext = "";

        var function_start = -1;

        var i, pii, ttype, ttext, tprecedence, tstackprecedence;

        for (i = 0; i < parseinfo.length; i++) {
            pii = parseinfo[i];
            ttype = pii.type;
            ttext = pii.text;
            if (
                ttype == tokentype.num ||
                ttype == tokentype.coord ||
                ttype == tokentype.string
            ) {
                revpolish.push(i);
            } else if (ttype == tokentype.name) {
                parsestack.push(i);
                revpolish.push(function_start);
            } else if (ttype == tokentype.space) {
                // ignore
                continue;
            } else if (ttext == ",") {
                while (
                    parsestack.length &&
                    parseinfo[parsestack[parsestack.length - 1]].text != "("
                ) {
                    revpolish.push(parsestack.pop());
                }
                if (parsestack.length == 0) {
                    // no ( -- error
                    errortext = scc.s_parseerrmissingopenparen;
                    break;
                }
            } else if (ttext == "(") {
                parsestack.push(i);
            } else if (ttext == ")") {
                while (
                    parsestack.length &&
                    parseinfo[parsestack[parsestack.length - 1]].text != "("
                ) {
                    revpolish.push(parsestack.pop());
                }
                if (parsestack.length == 0) {
                    // no ( -- error
                    errortext = scc.s_parseerrcloseparennoopen;
                    break;
                }
                parsestack.pop();
                if (
                    parsestack.length &&
                    parseinfo[parsestack[parsestack.length - 1]].type == tokentype.name
                ) {
                    revpolish.push(parsestack.pop());
                }
            } else if (ttype == tokentype.op) {
                if (
                    parsestack.length &&
                    parseinfo[parsestack[parsestack.length - 1]].type == tokentype.name
                ) {
                    revpolish.push(parsestack.pop());
                }
                while (
                    parsestack.length &&
                    parseinfo[parsestack[parsestack.length - 1]].type == tokentype.op &&
                    parseinfo[parsestack[parsestack.length - 1]].text != "("
                ) {
                    tprecedence = token_precedence[pii.opcode];
                    tstackprecedence =
                        token_precedence[
                        parseinfo[parsestack[parsestack.length - 1]].opcode
                        ];
                    if (tprecedence >= 0 && tprecedence < tstackprecedence) {
                        break;
                    } else if (tprecedence < 0) {
                        tprecedence = -tprecedence;
                        if (tstackprecedence < 0) tstackprecedence = -tstackprecedence;
                        if (tprecedence <= tstackprecedence) {
                            break;
                        }
                    }
                    revpolish.push(parsestack.pop());
                }
                parsestack.push(i);
            } else if (ttype == tokentype.error) {
                errortext = ttext;
                break;
            } else {
                errortext = "Internal error while processing parsed formula. ";
                break;
            }
        }
        while (parsestack.length > 0) {
            if (parseinfo[parsestack[parsestack.length - 1]].text == "(") {
                errortext = scc.s_parseerrmissingcloseparen;
                break;
            }
            revpolish.push(parsestack.pop());
        }

        if (errortext) {
            return errortext;
        }

        return revpolish;
    };

    //
    // result = SocialCalc.Formula.EvaluatePolish(parseinfo, revpolish, sheet, allowrangereturn)
    //
    // Execute reverse polish representation of formula
    //
    // Operand values are objects in the operand array with a "type" and an optional "value".
    // Type can have these values (many are type and sub-type as two or more letters):
    //    "tw", "th", "t", "n", "nt", "coord", "range", "start", "eErrorType", "b" (blank)
    // The value of a coord is in the form A57 or A57!sheetname
    // The value of a range is coord|coord|number where number starts at 0 and is
    // the offset of the next item to fetch if you are going through the range one by one
    // The number starts as a null string ("A1|B3|")
    //

    SocialCalc.Formula.EvaluatePolish = function (
        parseinfo,
        revpolish,
        sheet,
        allowrangereturn
    ) {
        var scf = SocialCalc.Formula;
        var scc = SocialCalc.Constants;
        var tokentype = scf.TokenType;
        var lookup_result_type = scf.LookupResultType;
        var typelookup = scf.TypeLookupTable;
        var operand_as_number = scf.OperandAsNumber;
        var operand_as_text = scf.OperandAsText;
        var operand_value_and_type = scf.OperandValueAndType;
        var operands_as_coord_on_sheet = scf.OperandsAsCoordOnSheet;
        var format_number_for_display =
            SocialCalc.format_number_for_display ||
            function (v, t, f) {
                return v + "";
            };

        var errortext = "";
        var function_start = -1;
        var missingOperandError = {
            value: "",
            type: "e#VALUE!",
            error: scc.s_parseerrmissingoperand,
        };
        var value;

        var operand = [];
        var PushOperand = function (t, v) {
            operand.push({ type: t, value: v });
        };

        var i,
            rii,
            prii,
            ttype,
            ttext,
            value1,
            value2,
            tostype,
            tostype2,
            resulttype,
            valuetype,
            cond,
            vmatch,
            smatch;

        if (!parseinfo.length || !(revpolish instanceof Array)) {
            return {
                value: "",
                type: "e#VALUE!",
                error: typeof revpolish == "string" ? revpolish : "",
            };
        }

        for (i = 0; i < revpolish.length; i++) {
            rii = revpolish[i];
            if (rii == function_start) {
                // Remember the start of a function argument list
                PushOperand("start", 0);
                continue;
            }

            prii = parseinfo[rii];
            ttype = prii.type;
            ttext = prii.text;

            if (ttype == tokentype.num) {
                PushOperand("n", ttext - 0);
            } else if (ttype == tokentype.coord) {
                PushOperand("coord", ttext);
            } else if (ttype == tokentype.string) {
                PushOperand("t", ttext);
            } else if (ttype == tokentype.op) {
                if (operand.length <= 0) {
                    // Nothing on the stack...
                    return missingOperandError;
                    break; // done
                }

                // Unary minus

                if (ttext == "M") {
                    value1 = operand_as_number(sheet, operand);
                    resulttype = lookup_result_type(
                        value1.type,
                        value1.type,
                        typelookup.unaryminus
                    );
                    PushOperand(resulttype, -value1.value);
                }

                // Unary plus
                else if (ttext == "P") {
                    value1 = operand_as_number(sheet, operand);
                    resulttype = lookup_result_type(
                        value1.type,
                        value1.type,
                        typelookup.unaryplus
                    );
                    PushOperand(resulttype, value1.value);
                }

                // Unary % - percent, left associative
                else if (ttext == "%") {
                    value1 = operand_as_number(sheet, operand);
                    resulttype = lookup_result_type(
                        value1.type,
                        value1.type,
                        typelookup.unarypercent
                    );
                    PushOperand(resulttype, 0.01 * value1.value);
                }

                // & - string concatenate
                else if (ttext == "&") {
                    if (operand.length <= 1) {
                        // Need at least two things on the stack...
                        return missingOperandError;
                    }
                    value2 = operand_as_text(sheet, operand);
                    value1 = operand_as_text(sheet, operand);
                    resulttype = lookup_result_type(
                        value1.type,
                        value1.type,
                        typelookup.concat
                    );
                    PushOperand(resulttype, value1.value + value2.value);
                }

                // : - Range constructor
                else if (ttext == ":") {
                    if (operand.length <= 1) {
                        // Need at least two things on the stack...
                        return missingOperandError;
                    }
                    value1 = scf.OperandsAsRangeOnSheet(sheet, operand); // get coords even if use name on other sheet
                    if (value1.error) {
                        // not available
                        errortext = errortext || value1.error;
                    }
                    PushOperand(value1.type, value1.value); // push sheetname with range on that sheet
                }

                // ! - sheetname!coord
                else if (ttext == "!") {
                    if (operand.length <= 1) {
                        // Need at least two things on the stack...
                        return missingOperandError;
                    }
                    value1 = operands_as_coord_on_sheet(sheet, operand); // get coord even if name on other sheet
                    if (value1.error) {
                        // not available
                        errortext = errortext || value1.error;
                    }
                    PushOperand(value1.type, value1.value); // push sheetname with coord or range on that sheet
                }

                // Comparison operators: < L = G > N (< <= = >= > <>)
                else if (
                    ttext == "<" ||
                    ttext == "L" ||
                    ttext == "=" ||
                    ttext == "G" ||
                    ttext == ">" ||
                    ttext == "N"
                ) {
                    if (operand.length <= 1) {
                        // Need at least two things on the stack...
                        errortext = scc.s_parseerrmissingoperand; // remember error
                        break;
                    }
                    value2 = operand_value_and_type(sheet, operand);
                    value1 = operand_value_and_type(sheet, operand);
                    if (value1.type.charAt(0) == "n" && value2.type.charAt(0) == "n") {
                        // compare two numbers
                        cond = 0;
                        if (ttext == "<") {
                            cond = value1.value < value2.value ? 1 : 0;
                        } else if (ttext == "L") {
                            cond = value1.value <= value2.value ? 1 : 0;
                        } else if (ttext == "=") {
                            cond = value1.value == value2.value ? 1 : 0;
                        } else if (ttext == "G") {
                            cond = value1.value >= value2.value ? 1 : 0;
                        } else if (ttext == ">") {
                            cond = value1.value > value2.value ? 1 : 0;
                        } else if (ttext == "N") {
                            cond = value1.value != value2.value ? 1 : 0;
                        }
                        PushOperand("nl", cond);
                    } else if (value1.type.charAt(0) == "e") {
                        // error on left
                        PushOperand(value1.type, 0);
                    } else if (value2.type.charAt(0) == "e") {
                        // error on right
                        PushOperand(value2.type, 0);
                    } else {
                        // text maybe mixed with numbers or blank
                        tostype = value1.type.charAt(0);
                        tostype2 = value2.type.charAt(0);
                        if (tostype == "n") {
                            value1.value = format_number_for_display(value1.value, "n", "");
                        } else if (tostype == "b") {
                            value1.value = "";
                        }
                        if (tostype2 == "n") {
                            value2.value = format_number_for_display(value2.value, "n", "");
                        } else if (tostype2 == "b") {
                            value2.value = "";
                        }
                        cond = 0;
                        value1.value = value1.value.toLowerCase(); // ignore case
                        value2.value = value2.value.toLowerCase();
                        if (ttext == "<") {
                            cond = value1.value < value2.value ? 1 : 0;
                        } else if (ttext == "L") {
                            cond = value1.value <= value2.value ? 1 : 0;
                        } else if (ttext == "=") {
                            cond = value1.value == value2.value ? 1 : 0;
                        } else if (ttext == "G") {
                            cond = value1.value >= value2.value ? 1 : 0;
                        } else if (ttext == ">") {
                            cond = value1.value > value2.value ? 1 : 0;
                        } else if (ttext == "N") {
                            cond = value1.value != value2.value ? 1 : 0;
                        }
                        PushOperand("nl", cond);
                    }
                }

                // Normal infix arithmethic operators: +, -. *, /, ^
                else {
                    // what's left are the normal infix arithmetic operators
                    if (operand.length <= 1) {
                        // Need at least two things on the stack...
                        errortext = scc.s_parseerrmissingoperand; // remember error
                        break;
                    }
                    value2 = operand_as_number(sheet, operand);
                    value1 = operand_as_number(sheet, operand);
                    if (ttext == "+") {
                        resulttype = lookup_result_type(
                            value1.type,
                            value2.type,
                            typelookup.plus
                        );
                        PushOperand(resulttype, value1.value + value2.value);
                    } else if (ttext == "-") {
                        resulttype = lookup_result_type(
                            value1.type,
                            value2.type,
                            typelookup.plus
                        );
                        PushOperand(resulttype, value1.value - value2.value);
                    } else if (ttext == "*") {
                        resulttype = lookup_result_type(
                            value1.type,
                            value2.type,
                            typelookup.plus
                        );
                        PushOperand(resulttype, value1.value * value2.value);
                    } else if (ttext == "/") {
                        if (value2.value != 0) {
                            PushOperand("n", value1.value / value2.value); // gives plain numeric result type
                        } else {
                            PushOperand("e#DIV/0!", 0);
                        }
                    } else if (ttext == "^") {
                        value1.value = Math.pow(value1.value, value2.value);
                        value1.type = "n"; // gives plain numeric result type
                        if (isNaN(value1.value)) {
                            value1.value = 0;
                            value1.type = "e#NUM!";
                        }
                        PushOperand(value1.type, value1.value);
                    }
                }
            }

            // function or name
            else if (ttype == tokentype.name) {
                errortext = scf.CalculateFunction(ttext, operand, sheet);
                if (errortext) break;
            } else {
                errortext =
                    scc.s_InternalError + "Unknown token " + ttype + " (" + ttext + "). ";
                break;
            }
        }

        // look at final value and handle special cases

        value = operand[0] ? operand[0].value : "";
        tostype = operand[0] ? operand[0].type : "";

        if (tostype == "name") {
            // name - expand it
            value1 = SocialCalc.Formula.LookupName(sheet, value);
            value = value1.value;
            tostype = value1.type;
            errortext = errortext || value1.error;
        }

        if (tostype == "coord") {
            // the value is a coord reference, get its value and type
            value1 = operand_value_and_type(sheet, operand);
            value = value1.value;
            tostype = value1.type;
            if (tostype == "b") {
                tostype = "n";
                value = 0;
            }
        }

        if (operand.length > 1 && !errortext) {
            // something left - error
            errortext += scc.s_parseerrerrorinformula;
        }

        // set return type

        valuetype = tostype;

        if (tostype.charAt(0) == "e") {
            // error value
            errortext =
                errortext || tostype.substring(1) || scc.s_calcerrerrorvalueinformula;
        } else if (tostype == "range") {
            vmatch = value.match(/^(.*)\|(.*)\|/);
            smatch = vmatch[1].indexOf("!");
            if (smatch >= 0) {
                // swap sheetname
                vmatch[1] =
                    vmatch[1].substring(smatch + 1) +
                    "!" +
                    vmatch[1].substring(0, smatch).toUpperCase();
            } else {
                vmatch[1] = vmatch[1].toUpperCase();
            }
            value = vmatch[1] + ":" + vmatch[2].toUpperCase();
            if (!allowrangereturn) {
                errortext = scc.s_formularangeresult + " " + value;
            }
        }

        if (errortext && valuetype.charAt(0) != "e") {
            value = errortext;
            valuetype = "e";
        }

        // look for overflow

        if (valuetype.charAt(0) == "n" && (isNaN(value) || !isFinite(value))) {
            value = 0;
            valuetype = "e#NUM!";
            errortext = isNaN(value)
                ? scc.s_calcerrnumericnan
                : scc.s_calcerrnumericoverflow;
        }

        return { value: value, type: valuetype, error: errortext };
    };

    /*
  #
  # resulttype = SocialCalc.Formula.LookupResultType(type1, type2, typelookup);
  #
  # typelookup has values of the following form:
  #
  #    typelookup{"typespec1"} = "|typespec2A:resultA|typespec2B:resultB|..."
  #
  # First type1 is looked up. If no match, then the first letter (major type) of type1 plus "*" is looked up
  # resulttype is type1 if result is "1", type2 if result is "2", otherwise the value of result.
  #
  */

    SocialCalc.Formula.LookupResultType = function (type1, type2, typelookup) {
        var pos1, pos2, result;

        var table1 = typelookup[type1];

        if (!table1) {
            table1 = typelookup[type1.charAt(0) + "*"];
            if (!table1) {
                return (
                    "e#VALUE! (internal error, missing LookupResultType " +
                    type1.charAt(0) +
                    "*)"
                ); // missing from table -- please add it
            }
        }
        pos1 = table1.indexOf("|" + type2 + ":");
        if (pos1 >= 0) {
            pos2 = table1.indexOf("|", pos1 + 1);
            if (pos2 < 0)
                return (
                    "e#VALUE! (internal error, incorrect LookupResultType " + table1 + ")"
                );
            result = table1.substring(pos1 + type2.length + 2, pos2);
            if (result == "1") return type1;
            if (result == "2") return type2;
            return result;
        }
        pos1 = table1.indexOf("|" + type2.charAt(0) + "*:");
        if (pos1 >= 0) {
            pos2 = table1.indexOf("|", pos1 + 1);
            if (pos2 < 0)
                return (
                    "e#VALUE! (internal error, incorrect LookupResultType " + table1 + ")"
                );
            result = table1.substring(pos1 + 4, pos2);
            if (result == "1") return type1;
            if (result == "2") return type2;
            return result;
        }
        return "e#VALUE!";
    };

    /*
  #
  # operandinfo = SocialCalc.Formula.TopOfStackValueAndType(sheet, operand)
  #
  # Returns top of stack value and type and then pops the stack.
  # The result is {value: value, type: type, error: "only if bad error"}
  #
  */

    SocialCalc.Formula.TopOfStackValueAndType = function (sheet, operand) {
        var cellvtype, cell, pos, coordsheet;
        var scf = SocialCalc.Formula;

        var result = { type: "", value: "" };

        var stacklen = operand.length;

        if (!stacklen) {
            // make sure something is there
            result.error =
                SocialCalc.Constants.s_InternalError + "no operand on stack";
            return result;
        }

        result.value = operand[stacklen - 1].value; // get top of stack
        result.type = operand[stacklen - 1].type;
        operand.pop(); // we have data - pop stack

        if (result.type == "name") {
            result = scf.LookupName(sheet, result.value);
        }

        return result;
    };

    /*
  #
  # operandinfo = OperandAsNumber(sheet, operand)
  #
  # Uses operand_value_and_type to get top of stack and pops it.
  # Returns numeric value and type.
  # Text values are treated as 0 if they can't be converted somehow.
  #
  */

    SocialCalc.Formula.OperandAsNumber = function (sheet, operand) {
        var t, valueinfo;
        var operandinfo = SocialCalc.Formula.OperandValueAndType(sheet, operand);

        t = operandinfo.type.charAt(0);

        if (t == "n") {
            operandinfo.value = operandinfo.value - 0;
        } else if (t == "b") {
            // blank cell
            operandinfo.type = "n";
            operandinfo.value = 0;
        } else if (t == "e") {
            // error
            operandinfo.value = 0;
        } else {
            valueinfo = SocialCalc.DetermineValueType
                ? SocialCalc.DetermineValueType(operandinfo.value)
                : { value: operandinfo.value - 0, type: "n" }; // if without rest of SocialCalc
            if (valueinfo.type.charAt(0) == "n") {
                operandinfo.value = valueinfo.value - 0;
                operandinfo.type = valueinfo.type;
            } else {
                operandinfo.value = 0;
                operandinfo.type = valueinfo.type;
            }
        }

        return operandinfo;
    };

    /*
  #
  # operandinfo = OperandAsText(sheet, operand)
  #
  # Uses operand_value_and_type to get top of stack and pops it.
  # Returns text value, preserving sub-type.
  #
  */

    SocialCalc.Formula.OperandAsText = function (sheet, operand) {
        var t, valueinfo;
        var operandinfo = SocialCalc.Formula.OperandValueAndType(sheet, operand);

        t = operandinfo.type.charAt(0);

        if (t == "t") {
            // any flavor of text returns as is
        } else if (t == "n") {
            operandinfo.value = SocialCalc.format_number_for_display
                ? SocialCalc.format_number_for_display(
                    operandinfo.value,
                    operandinfo.type,
                    ""
                )
                : (operandinfo.value = operandinfo.value + "");
            operandinfo.type = "t";
        } else if (t == "b") {
            // blank
            operandinfo.value = "";
            operandinfo.type = "t";
        } else if (t == "e") {
            // error
            operandinfo.value = "";
        } else {
            operand.value = operandinfo.value + "";
            operand.type = "t";
        }

        return operandinfo;
    };

    /*
  #
  # result = SocialCalc.Formula.OperandValueAndType(sheet, operand)
  #
  # Pops the top of stack and returns it, following a coord reference if necessary.
  # The result is {value: value, type: type, error: "only if bad error"}
  # Ranges are returned as if they were pushed onto the stack first coord first
  # Also sets type with "t", "n", "th", etc., as appropriate
  #
  */

    SocialCalc.Formula.OperandValueAndType = function (sheet, operand) {
        var cellvtype, cell, pos, coordsheet;
        var scf = SocialCalc.Formula;

        var result = { type: "", value: "" };

        var stacklen = operand.length;

        if (!stacklen) {
            // make sure something is there
            result.error =
                SocialCalc.Constants.s_InternalError + "no operand on stack";
            return result;
        }

        result.value = operand[stacklen - 1].value; // get top of stack
        result.type = operand[stacklen - 1].type;
        operand.pop(); // we have data - pop stack

        if (result.type == "name") {
            result = scf.LookupName(sheet, result.value);
        }

        if (result.type == "range") {
            result = scf.StepThroughRangeDown(operand, result.value);
        }

        if (result.type == "coord") {
            // value is a coord reference
            coordsheet = sheet;
            pos = result.value.indexOf("!");
            if (pos != -1) {
                // sheet reference
                coordsheet = scf.FindInSheetCache(result.value.substring(pos + 1)); // get other sheet
                if (coordsheet == null) {
                    // unavailable
                    result.type = "e#REF!";
                    result.error =
                        SocialCalc.Constants.s_sheetunavailable +
                        " " +
                        result.value.substring(pos + 1);
                    result.value = 0;
                    return result;
                }
                result.value = result.value.substring(0, pos); // get coord part
            }

            if (coordsheet) {
                cell = coordsheet.cells[SocialCalc.Formula.PlainCoord(result.value)];
                if (cell) {
                    cellvtype = cell.valuetype; // get type of value in the cell it points to
                    result.value = cell.datavalue;
                } else {
                    cellvtype = "b";
                }
            } else {
                cellvtype = "e#N/A";
                result.value = 0;
            }
            result.type = cellvtype || "b";
            if (result.type == "b") {
                // blank
                result.value = 0;
            }
        }

        return result;
    };

    /*
  #
  # operandinfo = SocialCalc.Formula.OperandAsCoord(sheet, operand)
  #
  # Gets top of stack and pops it.
  # Returns coord value. All others are treated as an error.
  #
  */

    SocialCalc.Formula.OperandAsCoord = function (sheet, operand) {
        var scf = SocialCalc.Formula;

        var result = { type: "", value: "" };

        var stacklen = operand.length;

        result.value = operand[stacklen - 1].value; // get top of stack
        result.type = operand[stacklen - 1].type;
        operand.pop(); // we have data - pop stack
        if (result.type == "name") {
            result = SocialCalc.Formula.LookupName(sheet, result.value);
        }
        if (result.type == "coord") {
            // value is a coord reference
            return result;
        } else {
            result.value = SocialCalc.Constants.s_calcerrcellrefmissing;
            result.type = "e#REF!";
            return result;
        }
    };

    /*
  #
  # result = SocialCalc.Formula.OperandsAsCoordOnSheet(sheet, operand)
  #
  # Gets 2 at top of stack and pops them, treating them as sheetname!coord-or-name.
  # Returns stack-style coord value (coord!sheetname, or coord!sheetname|coord|) with
  # a type of coord or range. All others are treated as an error.
  # If sheetname not available, sets result.error.
  #
  */

    SocialCalc.Formula.OperandsAsCoordOnSheet = function (sheet, operand) {
        var sheetname, othersheet, pos1, pos2;
        var value1 = {};
        var result = {};
        var scf = SocialCalc.Formula;

        var stacklen = operand.length;
        value1.value = operand[stacklen - 1].value; // get top of stack - coord or name
        value1.type = operand[stacklen - 1].type;
        operand.pop(); // we have data - pop stack

        sheetname = scf.OperandAsSheetName(sheet, operand); // get sheetname as text
        othersheet = scf.FindInSheetCache(sheetname.value);
        if (othersheet == null) {
            // unavailable
            result.type = "e#REF!";
            result.value = 0;
            result.error =
                SocialCalc.Constants.s_sheetunavailable + " " + sheetname.value;
            return result;
        }

        if (value1.type == "name") {
            value1 = scf.LookupName(othersheet, value1.value);
        }
        result.type = value1.type;
        if (value1.type == "coord") {
            // value is a coord reference
            result.value = value1.value + "!" + sheetname.value; // return in the format as used on stack
        } else if (value1.type == "range") {
            // value is a range reference
            pos1 = value1.value.indexOf("|");
            pos2 = value1.value.indexOf("|", pos1 + 1);
            result.value =
                value1.value.substring(0, pos1) +
                "!" +
                sheetname.value +
                "|" +
                value1.value.substring(pos1 + 1, pos2) +
                "|";
        } else if (value1.type.charAt(0) == "e") {
            result.value = value1.value;
        } else {
            result.error = SocialCalc.Constants.s_calcerrcellrefmissing;
            result.type = "e#REF!";
            result.value = 0;
        }
        return result;
    };

    /*
  #
  # result = SocialCalc.Formula.OperandsAsRangeOnSheet(sheet, operand)
  #
  # Gets 2 at top of stack and pops them, treating them as coord2-or-name:coord1.
  # Name is evaluated on sheet of coord1.
  # Returns result with "value" of stack-style range value (coord!sheetname|coord|) and
  # "type" of "range". All others are treated as an error.
  #
  */

    SocialCalc.Formula.OperandsAsRangeOnSheet = function (sheet, operand) {
        var value1, othersheet, pos1, pos2;
        var value2 = {};
        var scf = SocialCalc.Formula;
        var scc = SocialCalc.Constants;

        var stacklen = operand.length;
        value2.value = operand[stacklen - 1].value; // get top of stack - coord or name for "right" side
        value2.type = operand[stacklen - 1].type;
        operand.pop(); // we have data - pop stack

        value1 = scf.OperandAsCoord(sheet, operand); // get "left" coord
        if (value1.type != "coord") {
            // not a coord, which it must be
            return { value: 0, type: "e#REF!" };
        }

        othersheet = sheet;
        pos1 = value1.value.indexOf("!");
        if (pos1 != -1) {
            // sheet reference
            pos2 = value1.value.indexOf("|", pos1 + 1);
            if (pos2 < 0) pos2 = value1.value.length;
            othersheet = scf.FindInSheetCache(value1.value.substring(pos1 + 1, pos2)); // get other sheet
            if (othersheet == null) {
                // unavailable
                return {
                    value: 0,
                    type: "e#REF!",
                    errortext:
                        scc.s_sheetunavailable +
                        " " +
                        value1.value.substring(pos1 + 1, pos2),
                };
            }
        }

        if (value2.type == "name") {
            // coord:name is allowed, if name is just one cell
            value2 = scf.LookupName(othersheet, value2.value);
        }

        if (value2.type == "coord") {
            // value is a coord reference, so return the combined range
            return { value: value1.value + "|" + value2.value + "|", type: "range" }; // return range in the format as used on stack
        } else {
            // bad form
            return { value: scc.s_calcerrcellrefmissing, type: "e#REF!" };
        }
    };

    /*
  #
  # result = SocialCalc.Formula.OperandAsSheetName(sheet, operand)
  #
  # Gets top of stack and pops it.
  # Returns sheetname value. All others are treated as an error.
  # Accepts text, cell reference, and named value which is one of those two.
  #
  */

    SocialCalc.Formula.OperandAsSheetName = function (sheet, operand) {
        var nvalue, cell;

        var scf = SocialCalc.Formula;

        var result = { type: "", value: "" };

        var stacklen = operand.length;

        result.value = operand[stacklen - 1].value; // get top of stack
        result.type = operand[stacklen - 1].type;
        operand.pop(); // we have data - pop stack
        if (result.type == "name") {
            nvalue = SocialCalc.Formula.LookupName(sheet, result.value);
            if (!nvalue.value) {
                // not a known name - return bare name as the name value
                return result;
            }
            result.value = nvalue.value;
            result.type = nvalue.type;
        }
        if (result.type == "coord") {
            // value is a coord reference, follow it to find sheet name
            cell = sheet.cells[SocialCalc.Formula.PlainCoord(result.value)];
            if (cell) {
                result.value = cell.datavalue;
                result.type = cell.valuetype;
            } else {
                result.value = "";
                result.type = "b";
            }
        }
        if (result.type.charAt(0) == "t") {
            // value is a string which could be a sheet name
            return result;
        } else {
            result.value = "";
            result.error = SocialCalc.Constants.s_calcerrsheetnamemissing;
            return result;
        }
    };

    //
    // value = SocialCalc.Formula.LookupName(sheet, name)
    //
    // Returns value and type of a named value
    // Names are case insensitive
    // Names may have a definition which is a coord (A1), a range (A1:B7), or a formula (=OFFSET(A1,0,0,5,1))
    // Note: The range must not have sheet names ("!") in them.
    //

    SocialCalc.Formula.LookupName = function (sheet, name) {
        var pos, specialc, parseinfo;
        var names = sheet.names;
        var value = {};
        var startedwalk = false;

        if (names[name.toUpperCase()]) {
            // is name defined?

            value.value = names[name.toUpperCase()].definition; // yes

            if (value.value.charAt(0) == "=") {
                // formula
                if (!sheet.checknamecirc) {
                    // are we possibly walking the name tree?
                    sheet.checknamecirc = {}; // not yet
                    startedwalk = true; // remember we are the reference that started it
                } else {
                    if (sheet.checknamecirc[name]) {
                        // circular reference
                        value.type = "e#NAME?";
                        value.error =
                            SocialCalc.Constants.s_circularnameref + ' "' + name + '".';
                        return value;
                    }
                }
                sheet.checknamecirc[name] = true;

                parseinfo = SocialCalc.Formula.ParseFormulaIntoTokens(
                    value.value.substring(1)
                );
                value = SocialCalc.Formula.evaluate_parsed_formula(parseinfo, sheet, 1); // parse formula, allowing range return

                delete sheet.checknamecirc[name]; // done with us
                if (startedwalk) {
                    delete sheet.checknamecirc; // done with walk
                }

                if (value.type != "range") {
                    return value;
                }
            }

            pos = value.value.indexOf(":");
            if (pos != -1) {
                // range
                value.type = "range";
                value.value =
                    value.value.substring(0, pos) +
                    "|" +
                    value.value.substring(pos + 1) +
                    "|";
                value.value = value.value.toUpperCase();
            } else {
                value.type = "coord";
                value.value = value.value.toUpperCase();
            }
            return value;
        } else if (
            (specialc = SocialCalc.Formula.SpecialConstants[name.toUpperCase()])
        ) {
            // special constant, like #REF!
            pos = specialc.indexOf(",");
            value.value = specialc.substring(0, pos) - 0;
            value.type = specialc.substring(pos + 1);
            return value;
        } else {
            value.value = "";
            value.type = "e#NAME?";
            value.error =
                SocialCalc.Constants.s_calcerrunknownname + ' "' + name + '"';
            return value;
        }
    };

    /*
  #
  # coord = SocialCalc.Formula.StepThroughRangeDown(operand, rangevalue)
  #
  # Returns next coord in a range, keeping track on the operand stack
  # Goes from upper left across and down to bottom right.
  #
  */

    SocialCalc.Formula.StepThroughRangeDown = function (operand, rangevalue) {
        var value1, value2, sequence, pos1, pos2, sheet1, rp, c, r, count;
        var scf = SocialCalc.Formula;

        pos1 = rangevalue.indexOf("|");
        pos2 = rangevalue.indexOf("|", pos1 + 1);
        value1 = rangevalue.substring(0, pos1);
        value2 = rangevalue.substring(pos1 + 1, pos2);
        sequence = rangevalue.substring(pos2 + 1) - 0;

        pos1 = value1.indexOf("!");
        if (pos1 != -1) {
            sheet1 = value1.substring(pos1);
            value1 = value1.substring(0, pos1);
        } else {
            sheet1 = "";
        }
        pos1 = value2.indexOf("!");
        if (pos1 != -1) {
            value2 = value2.substring(0, pos1);
        }

        rp = scf.OrderRangeParts(value1, value2);

        count = 0;
        for (r = rp.r1; r <= rp.r2; r++) {
            for (c = rp.c1; c <= rp.c2; c++) {
                count++;
                if (count > sequence) {
                    if (r != rp.r2 || c != rp.c2) {
                        // keep on stack until done
                        scf.PushOperand(
                            operand,
                            "range",
                            value1 + sheet1 + "|" + value2 + "|" + count
                        );
                    }
                    return { value: SocialCalc.crToCoord(c, r) + sheet1, type: "coord" };
                }
            }
        }
    };

    /*
  #
  # result = SocialCalc.Formula.DecodeRangeParts(sheetdata, range)
  #
  # Returns sheetdata for the sheet where the range is, as well as
  # the number of the first column in the range, the number of columns,
  # and equivalent row information:
  #
  # {sheetdata: sheet, sheetname: name-or-"", col1num: n, ncols: n, row1num: n, nrows: n}
  #
  # If any errors, a null result is returned.
  #
  */

    SocialCalc.Formula.DecodeRangeParts = function (sheetdata, range) {
        var value1, value2, pos1, pos2, sheet1, coordsheetdata, rp;

        var scf = SocialCalc.Formula;

        pos1 = range.indexOf("|");
        pos2 = range.indexOf("|", pos1 + 1);
        value1 = range.substring(0, pos1);
        value2 = range.substring(pos1 + 1, pos2);

        pos1 = value1.indexOf("!");
        if (pos1 != -1) {
            sheet1 = value1.substring(pos1 + 1);
            value1 = value1.substring(0, pos1);
        } else {
            sheet1 = "";
        }
        pos1 = value2.indexOf("!");
        if (pos1 != -1) {
            value2 = value2.substring(0, pos1);
        }

        coordsheetdata = sheetdata;
        if (sheet1) {
            // sheet reference
            coordsheetdata = scf.FindInSheetCache(sheet1);
            if (coordsheetdata == null) {
                // unavailable
                return null;
            }
        }

        rp = scf.OrderRangeParts(value1, value2);

        return {
            sheetdata: coordsheetdata,
            sheetname: sheet1,
            col1num: rp.c1,
            ncols: rp.c2 - rp.c1 + 1,
            row1num: rp.r1,
            nrows: rp.r2 - rp.r1 + 1,
        };
    };

    //*********************
    //
    // Function Handling
    //
    //*********************

    // List of functions -- Define after functions are defined
    //
    // SocialCalc.Formula.FunctionList["function_name"] = [function_subroutine, number_of_arguments, arg_def, func_def, func_class]
    //   function_subroutine takes arguments (fname, operand, foperand, sheet), returns
    //      errortext or null, pushing result on operand stack.
    //   number_of_arguments is:
    //      0 = no arguments
    //      >0 = exactly that many arguments
    //      <0 = that many arguments (abs value) or more
    //      100 = don't check
    //
    //   arg_def, if present, is the name of the element in SocialCalc.Formula.FunctionArgDefs.
    //   func_def, if present, is a string explaining the function. If not, looked up in SocialCalc.Constants.
    //   func_class, if present, is the comma-separated names of the elements in SocialCalc.Formula.FunctionClasses.
    //
    // To add a function, just add it to this object.

    if (!SocialCalc.Formula.FunctionList) {
        // make sure it is defined (could have been in another module)
        SocialCalc.Formula.FunctionList = {};
    }

    // FunctionClasses[classname] = {name: full-name-string, items: [sorted list of function names]};
    // filled in by SocialCalc.Formula.FillFunctionInfo

    SocialCalc.Formula.FunctionClasses = null; // start null to say needs filling in

    // FunctionArgDef[argname] = explicit-string-for-arg-list;
    // filled in by SocialCalc.Formula.FillFunctionInfo

    SocialCalc.Formula.FunctionArgDefs = {};

    /*
  #
  # errortext = SocialCalc.Formula.CalculateFunction(fname, operand, sheet)
  #
  # Dispatches for function fname.
  #
  */

    SocialCalc.Formula.CalculateFunction = function (fname, operand, sheet) {
        var fobj, foperand, ffunc, argnum, ttext;
        var scf = SocialCalc.Formula;
        var ok = 1;
        var errortext = "";

        fobj = scf.FunctionList[fname];

        if (fobj) {
            foperand = [];
            ffunc = fobj[0];
            argnum = fobj[1];
            scf.CopyFunctionArgs(operand, foperand);
            if (argnum != 100) {
                if (argnum < 0) {
                    if (foperand.length < -argnum) {
                        errortext = scf.FunctionArgsError(fname, operand);
                        return errortext;
                    }
                } else {
                    if (foperand.length != argnum) {
                        errortext = scf.FunctionArgsError(fname, operand);
                        return errortext;
                    }
                }
            }
            errortext = ffunc(fname, operand, foperand, sheet);
        } else {
            ttext = fname;

            if (operand.length && operand[operand.length - 1].type == "start") {
                // no arguments - name or zero arg function
                operand.pop();
                scf.PushOperand(operand, "name", ttext);
            } else {
                errortext =
                    SocialCalc.Constants.s_sheetfuncunknownfunction + " " + ttext + ". ";
            }
        }

        return errortext;
    };

    //
    // SocialCalc.Formula.PushOperand(operand, t, v)
    //
    // Pushes the type and value onto the operand stack
    //

    SocialCalc.Formula.PushOperand = function (operand, t, v) {
        operand.push({ type: t, value: v });
    };

    //
    // SocialCalc.Formula.CopyFunctionArgs(operand, foperand)
    //
    // Pops operands from operand and pushes on foperand up to function start
    // reversing order in the process.
    //

    SocialCalc.Formula.CopyFunctionArgs = function (operand, foperand) {
        var fobj, foperand, ffunc, argnum;
        var scf = SocialCalc.Formula;
        var ok = 1;
        var errortext = null;

        while (operand.length > 0 && operand[operand.length - 1].type != "start") {
            // get each arg
            foperand.push(operand.pop()); // copy it
        }
        operand.pop(); // get rid of "start"

        return;
    };

    //
    // errortext = SocialCalc.Formula.FunctionArgsError(fname, operand)
    //
    // Pushes appropriate error on operand stack and returns errortext, including fname
    //

    SocialCalc.Formula.FunctionArgsError = function (fname, operand) {
        var errortext =
            SocialCalc.Constants.s_calcerrincorrectargstofunction +
            " " +
            fname +
            ". ";
        SocialCalc.Formula.PushOperand(operand, "e#VALUE!", errortext);

        return errortext;
    };

    //
    // errortext = SocialCalc.Formula.FunctionSpecificError(fname, operand, errortype, errortext)
    //
    // Pushes specified error and text on operand stack.
    //

    SocialCalc.Formula.FunctionSpecificError = function (
        fname,
        operand,
        errortype,
        errortext
    ) {
        SocialCalc.Formula.PushOperand(operand, errortype, errortext);

        return errortext;
    };

    //
    // haserror = SocialCalc.Formula.CheckForErrorValue(operand, v)
    //
    // If v.type is an error, push it on operand stack and return true, otherwise return false.
    //

    SocialCalc.Formula.CheckForErrorValue = function (operand, v) {
        if (v.type.charAt(0) == "e") {
            operand.push(v);
            return true;
        } else {
            return false;
        }
    };

    /////////////////////////
    //
    // FUNCTION INFORMATION ROUTINES
    //

    //
    // SocialCalc.Formula.FillFunctionInfo()
    //
    // Goes through function definitions and fills out FunctionArgDefs and FunctionClasses.
    // Execute this after any changes to SocialCalc.Constants but before UI is used.
    //

    SocialCalc.Formula.FillFunctionInfo = function () {
        var scf = SocialCalc.Formula;
        var scc = SocialCalc.Constants;

        var fname, f, classes, cname, i;

        if (scf.FunctionClasses) {
            // only do once
            return;
        }

        for (fname in scf.FunctionList) {
            f = scf.FunctionList[fname];
            if (f[2]) {
                // has an arg def
                scf.FunctionArgDefs[f[2]] = scc["s_farg_" + f[2]] || ""; // get it from constants
            }
            if (!f[3]) {
                // no text def, see if in constants
                if (scc["s_fdef_" + fname]) {
                    scf.FunctionList[fname][3] = scc["s_fdef_" + fname];
                }
            }
        }

        scf.FunctionClasses = {};

        for (i = 0; i < scc.function_classlist.length; i++) {
            cname = scc.function_classlist[i];
            scf.FunctionClasses[cname] = {
                name: scc["s_fclass_" + cname],
                items: [],
            };
        }

        for (fname in scf.FunctionList) {
            f = scf.FunctionList[fname];
            classes = f[4] ? f[4].split(",") : []; // get classes
            classes.push("all");
            for (i = 0; i < classes.length; i++) {
                cname = classes[i];
                scf.FunctionClasses[cname].items.push(fname);
            }
        }
        for (cname in scf.FunctionClasses) {
            scf.FunctionClasses[cname].items.sort();
        }
    };

    //
    // str = SocialCalc.Formula.FunctionArgString(fname)
    //
    // Returns a string representing the arguments to function fname.
    //

    SocialCalc.Formula.FunctionArgString = function (fname) {
        var scf = SocialCalc.Formula;
        var fdata = scf.FunctionList[fname];
        var nargs, i, str;

        var adef = fdata[2];

        if (!adef) {
            nargs = fdata[1];
            if (nargs == 0) {
                adef = " ";
            } else if (nargs > 0) {
                str = "v1";
                for (i = 2; i <= nargs; i++) {
                    str += ", v" + i;
                }
                return str;
            } else if (nargs < 0) {
                str = "v1";
                for (i = 2; i < -nargs; i++) {
                    str += ", v" + i;
                }
                return str + ", ...";
            } else {
                return "nargs: " + nargs;
            }
        }

        str = scf.FunctionArgDefs[adef] || adef;

        return str;
    };


    // Make sure SocialCalc is available globally
    if (typeof window !== "undefined") {
        window.SocialCalc = SocialCalc;
    } else if (typeof global !== "undefined") {
        global.SocialCalc = SocialCalc;
    }

    return SocialCalc;
});
