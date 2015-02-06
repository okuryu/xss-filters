!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.xssFilters=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
Copyright (c) 2015, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.

Authors: Nera Liu <neraliu@yahoo-inc.com>
         Adonis Fung <adon@yahoo-inc.com>
         Albert Yu <albertyu@yahoo-inc.com>
*/
(function () {
"use strict";

/*
* =====================================================
* NOT TO BE DIRECTLY USED. USE xss-filters.js INSTEAD
* =====================================================
*/


// TODO: remove the following mappings 
exports.FILTER_NOT_HANDLE = "y";
exports.FILTER_DATA = "yd";
exports.FILTER_COMMENT = "yc";
exports.FILTER_ATTRIBUTE_VALUE_DOUBLE_QUOTED = "yavd";
exports.FILTER_ATTRIBUTE_VALUE_SINGLE_QUOTED = "yavs";
exports.FILTER_ATTRIBUTE_VALUE_UNQUOTED = "yavu";
exports.FILTER_ENCODE_URI = "yu";
exports.FILTER_ENCODE_URI_COMPONENT = "yuc";
exports.FILTER_URI_SCHEME_BLACKLIST = "yubl";
exports.FILTER_FULL_URI = "yufull";


var LT     = /</g,
    QUOT   = /\"/g,
    SQUOT  = /\'/g,
    SPECIAL_HTML_CHARS = /[&<>"']/g;

/*
 * @param {string} s - An untrusted user input
 * @returns {string} s - The original user input with & < > " ' encoded respectively as &amp; &lt; &gt; &quot; and &#39;.
 *
 * @description
 * <p>This filter is a fallback to use the standard HTML escaping (i.e., encoding &<>"')
 * in contexts that are currently not handled by the automatic context-sensitive templating solution.</p>
 *
 * Workaround this problem by following the suggestion below:
 * Use <input id="strJS" value="{{xssFilters.inHTMLData(data)}}"> 
 * and retrieve your data with document.getElementById('strJS').value. 
 *
 */
exports.y = function(s) {
    // s if undefined has no toString() method. String(s) will return 'undefined'
    if (typeof s !== 'string') {
        s = String(s);
    }

    return s.replace(SPECIAL_HTML_CHARS, function (m) {
        if (m === '&')       return '&amp;';
        if (m === '<')       return '&lt;';
        if (m === '>')       return '&gt;';
        if (m === '"')       return '&quot;';
        /* if (m === "'") */ return '&#39;';
    });
};


// FOR DETAILS, refer to inHTMLData()
// Reference: https://html.spec.whatwg.org/multipage/syntax.html#data-state
exports.yd = function (s) {
    // s if undefined has no toString() method. String(s) will return 'undefined'
    if (typeof s !== 'string') {
        s = String(s);
    }
    return s.replace(LT, '&lt;');
};


var COMMENT_SENSITIVE_CHARS = /(--!?>|--?!?$|\]>|\]$)/g;
// FOR DETAILS, refer to inHTMLComment()
// '-->' and '--!>' are modified as '-- >' and '--! >' so as stop comment state breaking
// for string ends with '--!', '--', or '-' are appended with a space, so as to stop collaborative state breaking at {{s}}>, {{s}}!>, {{s}}->
// Reference: https://html.spec.whatwg.org/multipage/syntax.html#comment-state
// ']>' and 'ends with ]' patterns deal with IE conditional comments. verified in IE that '] >' can stop that.
// Reference: http://msdn.microsoft.com/en-us/library/ms537512%28v=vs.85%29.aspx
exports.yc = function (s) {
    // s if undefined has no toString() method. String(s) will return 'undefined'
    if (typeof s !== 'string') {
        s = String(s);
    }
    return s.replace(COMMENT_SENSITIVE_CHARS, function(m){
        if (m === '-->')  { return '-- >';  }
        if (m === '--!>') { return '--! >'; }
        if (m === '--!')  { return '--! ';  }
        if (m === '--')   { return '-- ';   }
        if (m === '-')    { return '- ';    }
        if (m === ']>')   { return '] >';   }
        /*if (m === ']')*/   return '] ';
    });
};

// Reference: https://html.spec.whatwg.org/multipage/syntax.html#before-attribute-value-state
var BEFORE_ATTR_VALUE_CHARS = /^["']/;
var ATTR_VALUE_UNQUOTED_CHARS = /[\t\n\f >]/g;

// FOR DETAILS, refer to inDoubleQuotedAttr()
// Reference: https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(double-quoted)-state
exports.yavd = function (s) {
    if (typeof s !== 'string') {
        s = String(s);
    }

    return s.replace(QUOT, '&quot;');
};

// FOR DETAILS, refer to inSingleQuotedAttr()
// Reference: https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(single-quoted)-state
exports.yavs = function (s) {
    if (typeof s !== 'string') {
        s = String(s);
    }

    return s.replace(SQUOT, '&#39;');
};

// FOR DETAILS, refer to inUnQuotedAttr()
// Reference: https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(unquoted)-state
// Reference: https://html.spec.whatwg.org/multipage/syntax.html#before-attribute-value-state
exports.yavu = function (s, preserveEmptyString) {
    if (typeof s !== 'string') {
        s = String(s);
    }

    s = s.replace(ATTR_VALUE_UNQUOTED_CHARS, function (m) {
        if (m === '\t')    { return '&Tab;';     }
        if (m === '\n')    { return '&NewLine;'; }
        if (m === '\f')    { return '&#12;';     } // in hex: 0C
        if (m === ' ')     { return '&#32;';     } // in hex: 20
        /*if (m === '>')*/   return '&gt;';
    });

    // if s starts with ' or ", encode it resp. as &#39; or &quot; to enforce the attr value (unquoted) state
    // if instead starts with some whitespaces [\t\n\f ] then optionally a quote, 
    //    then the above encoding has already enforced the attr value (unquoted) state
    //    therefore, no need to encode the quote
    // Reference: https://html.spec.whatwg.org/multipage/syntax.html#before-attribute-value-state
    s = s.replace(BEFORE_ATTR_VALUE_CHARS, function (m) {
        if (m === '"')     { return '&quot;'; }
        /*if (m === "'")*/   return '&#39;';
    });

    // Inject NULL character if an empty string is encountered in 
    // unquoted attribute value state.
    //
    // Example:
    // <input value={{yav(s, exports.VALUE_UNQUOTED)}} name="passwd"/>
    //
    // Rationale 1: our belief is that developers wouldn't expect an 
    //   empty string would result in ' name="firstname"' rendered as 
    //   attribute value, even though this is how HTML5 is specified.
    // Rationale 2: an empty string can effectively alter its immediate
    //   subsequent state, which violates our design principle. As per 
    //   the HTML 5 spec, NULL or \u0000 is the magic character to end 
    //   the comment state, which therefore will not mess up later 
    //   contexts.
    // Reference: https://html.spec.whatwg.org/multipage/syntax.html#before-attribute-value-state
    if (!preserveEmptyString && s === '') {
        return '\u0000';
    }

    return s;
};

exports.VALUE_DOUBLE_QUOTED = 1;
exports.VALUE_SINGLE_QUOTED = 2;
exports.VALUE_UNQUOTED      = 3;
exports.yav = function (s, mode, preserveUnquotedEmptyString) {
    if (typeof mode !== 'number' || !(mode === 1 || mode === 2 || mode === 3)) {
        throw new Error('yav: mode must be either VALUE_DOUBLE_QUOTED, VALUE_SINGLE_QUOTED, or VALUE_UNQUOTED');
    }
    switch(mode) {
        case exports.VALUE_DOUBLE_QUOTED:
            return exports.yavd(s);
        case exports.VALUE_SINGLE_QUOTED:
            return exports.yavs(s);
        case exports.VALUE_UNQUOTED:
            return exports.yavu(s, preserveUnquotedEmptyString);
    }
};


exports.yu = encodeURI;
exports.yuc = encodeURIComponent;


var URI_FASTLANE = ['&', 'j', 'J', 'v', 'V'];

// Reference: https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet#Null_breaks_up_JavaScript_directive
// Reference: https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet#Embedded_newline_to_break_up_XSS
// Reference: https://html.spec.whatwg.org/multipage/syntax.html#consume-a-character-reference
// Reference for named characters: https://html.spec.whatwg.org/multipage/entities.json
/*
var URI_BLACKLIST_INTERIM_WHITESPACE = [
    '(?:',
    [
        // encodeURI/encodeURIComponent has percentage encoded ASCII chars of decimal 0-32
        // '\u0000',                                
        // '\t', '\n', '\r',                        // tab, newline, carriage return
        '&#[xX]0*[9aAdD];?',                    // &#x9, &#xA, &#xD in hex
        '&#0*(?:9|10|13);?',                    // &#9, &#10, &#13 in dec
        '&Tab;', '&NewLine;'                   // tab, newline in char entities
    ].join('|'),
    ')*'
].join('');

// delay building the following as an RegExp() object until the first hit
var URI_BLACKLIST, URI_BLACKLIST_REGEXPSTR = [

    // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet#Spaces_and_meta_chars_before_the_JavaScript_in_images_for_XSS
    '^(?:',
    [
        // encodeURI/encodeURIComponent has percentage encoded ASCII chars of decimal 0-32
        // '\u0001', '\u0002', '\u0003', '\u0004', 
        // '\u0005', '\u0006', '\u0007', '\u0008', 
        // '\u0009', '\u000A', '\u000B', '\u000C', 
        // '\u000D', '\u000E', '\u000F', '\u0010', 
        // '\u0011', '\u0012', '\u0013', '\u0014', 
        // '\u0015', '\u0016', '\u0017', '\u0018', 
        // '\u0019', '\u001A', '\u001B', '\u001C', 
        // '\u001D', '\u001E', '\u001F', '\u0020', 
        '&#[xX]0*(?:1?[1-9a-fA-F]|10|20);?',     // &#x1-20 in hex
        '&#0*(?:[1-9]|[1-2][0-9]|30|31|32);?',   // &#1-32  in dec
        '&Tab;', '&NewLine;'                    // space, newline in char entities
        
    ].join('|'),
    ')*',


    // &#x6A;&#x61;&#x76;&#x61;             &#106&#97&#118&#97              java
    // &#x4A;&#x41;&#x56;&#x41;             &#74&#65&#86&#65                JAVA
    // &#x76;&#x62;                         &#118&#98                       vb
    // &#x56;&#x42;                         &#86&#66                        VB
    // &#x73;&#x63;&#x72;&#x69;&#x70;&#x74; &#115&#99&#114&#105&#112&#116   script
    // &#x53;&#x43;&#x52;&#x49;&#x50;&#x54; &#83&#67&#82&#73&#80&#84        SCRIPT
    // &#x3A;                               &#58                            :

    // java|vb
    '(?:',
    [
        // java
        [
            '(?:j|J|&#[xX]0*(?:6|4)[aA];?|&#0*(?:106|74);?)',
            '(?:a|A|&#[xX]0*(?:6|4)1;?|&#0*(?:97|65);?)',
            '(?:v|V|&#[xX]0*(?:7|5)6;?|&#0*(?:118|86);?)',
            '(?:a|A|&#[xX]0*(?:6|4)1;?|&#0*(?:97|65);?)',

        ].join(URI_BLACKLIST_INTERIM_WHITESPACE),
        // vb
        [
            '(?:v|V|&#[xX]0*(?:7|5)6;?|&#0*(?:118|86);?)',
            '(?:b|B|&#[xX]0*(?:6|4)2;?|&#0*(?:98|66);?)'

        ].join(URI_BLACKLIST_INTERIM_WHITESPACE)

    ].join('|'),
    ')',

    URI_BLACKLIST_INTERIM_WHITESPACE,

    // script:
    [
        '(?:s|S|&#[xX]0*(?:7|5)3;?|&#0*(?:115|83);?)',
        '(?:c|C|&#[xX]0*(?:6|4)3;?|&#0*(?:99|67);?)',
        '(?:r|R|&#[xX]0*(?:7|5)2;?|&#0*(?:114|82);?)',
        '(?:i|I|&#[xX]0*(?:6|4)9;?|&#0*(?:105|73);?)',
        '(?:p|P|&#[xX]0*(?:7|5)0;?|&#0*(?:112|80);?)',
        '(?:t|T|&#[xX]0*(?:7|5)4;?|&#0*(?:116|84);?)',
        '(?:\:|&#[xX]0*3[aA];?|&#0*58;?)'

    ].join(URI_BLACKLIST_INTERIM_WHITESPACE)
].join('');
*/

// delay building URI_BLACKLIST as an RegExp() object until the first hit
var URI_BLACKLIST = null, 
// the following str is generated by the above commented logic
    URI_BLACKLIST_REGEXPSTR = "^(?:&#[xX]0*(?:1?[1-9a-fA-F]|10|20);?|&#0*(?:[1-9]|[1-2][0-9]|30|31|32);?|&Tab;|&NewLine;)*(?:(?:j|J|&#[xX]0*(?:6|4)[aA];?|&#0*(?:106|74);?)(?:&#[xX]0*[9aAdD];?|&#0*(?:9|10|13);?|&Tab;|&NewLine;)*(?:a|A|&#[xX]0*(?:6|4)1;?|&#0*(?:97|65);?)(?:&#[xX]0*[9aAdD];?|&#0*(?:9|10|13);?|&Tab;|&NewLine;)*(?:v|V|&#[xX]0*(?:7|5)6;?|&#0*(?:118|86);?)(?:&#[xX]0*[9aAdD];?|&#0*(?:9|10|13);?|&Tab;|&NewLine;)*(?:a|A|&#[xX]0*(?:6|4)1;?|&#0*(?:97|65);?)|(?:v|V|&#[xX]0*(?:7|5)6;?|&#0*(?:118|86);?)(?:&#[xX]0*[9aAdD];?|&#0*(?:9|10|13);?|&Tab;|&NewLine;)*(?:b|B|&#[xX]0*(?:6|4)2;?|&#0*(?:98|66);?))(?:&#[xX]0*[9aAdD];?|&#0*(?:9|10|13);?|&Tab;|&NewLine;)*(?:s|S|&#[xX]0*(?:7|5)3;?|&#0*(?:115|83);?)(?:&#[xX]0*[9aAdD];?|&#0*(?:9|10|13);?|&Tab;|&NewLine;)*(?:c|C|&#[xX]0*(?:6|4)3;?|&#0*(?:99|67);?)(?:&#[xX]0*[9aAdD];?|&#0*(?:9|10|13);?|&Tab;|&NewLine;)*(?:r|R|&#[xX]0*(?:7|5)2;?|&#0*(?:114|82);?)(?:&#[xX]0*[9aAdD];?|&#0*(?:9|10|13);?|&Tab;|&NewLine;)*(?:i|I|&#[xX]0*(?:6|4)9;?|&#0*(?:105|73);?)(?:&#[xX]0*[9aAdD];?|&#0*(?:9|10|13);?|&Tab;|&NewLine;)*(?:p|P|&#[xX]0*(?:7|5)0;?|&#0*(?:112|80);?)(?:&#[xX]0*[9aAdD];?|&#0*(?:9|10|13);?|&Tab;|&NewLine;)*(?:t|T|&#[xX]0*(?:7|5)4;?|&#0*(?:116|84);?)(?:&#[xX]0*[9aAdD];?|&#0*(?:9|10|13);?|&Tab;|&NewLine;)*(?::|&#[xX]0*3[aA];?|&#0*58;?)";

/* 
 * =============================
 * Rationale on data: protocol
 * =============================
 * Given there're two execution possibilities:
 *  1. data:text/html,<script>alert(1)</script> in <(i)frame>'s src
 *     expected script execution but it's of a different origin than the included page. hence not CROSS-SITE scripting
 *  2. data:application/javascript,alert(1) or data:,alert(1) in <script>'s src,
 *     data:text/css in <style>'s src
 *     data:image/svg+xml in <svg>'s src
 *     We already made it clear in the DISCLAIMER that anything involving <script>, <style>, and <svg> tags won't be taken care of
 *  Finally, we don't care the use of data: protocol
 */
// Notice that yubl MUST BE APPLIED LAST, and will not be used independently (expected output from encodeURI/encodeURIComponent and yav)
// This is used to disable JS execution capabilities by prefixing x- to ^javascript: or ^vbscript: that possibly could trigger script execution in URI attribute context
exports.yubl = function (s) {
    
    // FASTLANE for well-known protocols or relative URLs
    // let go if the first char is not &, j, J, v nor V
    if (URI_FASTLANE.indexOf(s[0]) === -1) {
        return s;
    }
    
    // build URI_BLACKLIST as a RegExp() object
    if (URI_BLACKLIST === null) {
        URI_BLACKLIST = new RegExp(URI_BLACKLIST_REGEXPSTR);
    }

    return URI_BLACKLIST.test(s) ? 'x-' + s : s;
};

// Given a full URI, need to support "[" ( IPv6address ) "]" in URI as per RFC3986
// Reference: https://tools.ietf.org/html/rfc3986
var URL_IPV6 = /\/\/%5B([A-Fa-f0-9:]+)%5D/i;
exports.yufull = function (s) {
    return exports.yu(s).replace(URL_IPV6, function(m, p){ return ['//[', p, ']'].join(''); });
};


})();

},{}],2:[function(require,module,exports){
/*
Copyright (c) 2015, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.

Authors: Nera Liu <neraliu@yahoo-inc.com>
         Adonis Fung <adon@yahoo-inc.com>
         Albert Yu <albertyu@yahoo-inc.com>
*/
(function () {
"use strict";

var privFilters = require('./private-xss-filters');

/* chaining filters */

// uriInAttr
privFilters.uriInAttr = function (s, mode) {
    return privFilters.yubl(privFilters.yav(privFilters.yufull(s), mode));
};
// uriPathInAttr
// yubl is used 
// Rationale: given pattern like this: <a href="{{uriPathInDoubleQuotedAttr(s)}}">
//            developer may expect s is always prefixed with ? or /, but an attacker can abuse it with 'javascript:alert(1)'
privFilters.uriPathInAttr = function (s, mode) {
    return privFilters.yubl(privFilters.yav(privFilters.yu(s), mode));
};
// uriComponentInAttr
privFilters.uriComponentInAttr = function (s, mode) {
    return privFilters.yav(privFilters.yuc(s), mode);
};
// uriFragmentInAttr
// added yubl on top of uriComponentInAttr 
// Rationale: given pattern like this: <a href="{{uriFragmentInDoubleQuotedAttr(s)}}">
//            developer may expect s is always prefixed with #, but an attacker can abuse it with 'javascript:alert(1)'
privFilters.uriFragmentInAttr = function (s, mode) {
    return privFilters.yubl(privFilters.uriComponentInAttr(s, mode));
};
// yucomment
// Notice that "-" can bypass both encodeURI()/encodeURIComponent()
// So, be aware that the comment state filter won't blindly html encode "-", otherwise will break legit URL like http://www.yahoo-inc.com/
privFilters.yucomment = function (s, isComponent, isFullURI) {
    return privFilters.yc(isComponent ? privFilters.yuc(s) : isFullURI ? privFilters.yufull(s) : privFilters.yu(s));
};


/** 
* Yahoo Secure XSS Filters - just sufficient output filtering to prevent XSS!
* @module xss-filters 
*/

/**
* @function module:xss-filters#inHTMLData
*
* @param {string} s - An untrusted user input
* @returns {string} The string s with '<' encoded as '&amp;lt;'
*
* @description
* This filter is to be placed in HTML Data context to encode all '<' characters into '&amp;lt;'
* <ul>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#data-state">HTML5 Data State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <textarea>{{inHTMLData(html_data)}}</textarea>
*
*/
exports.inHTMLData = privFilters.yd;


/**
* @function module:xss-filters#inHTMLComment
*
* @param {string} s - An untrusted user input
* @returns {string} The string s with '-->', '--!>', ']>' respectively replaced with '-- >', '--! >', '] >'. In addition, a space is appened to those string s that ends with '-', '--', '--!', and ']'. 
*
* @description
* This filter is to be placed in HTML Comment context to disable any attempts in closing the html comment state
* <p>Notice: --> and --!> are the syntaxes to close html comment state, while string that ends with -, --, or --! will also enable state closing if the variable is extenally suffixed with -> or >.
*            ']>' and string that ends with ']' are changed to '] >' and '] ' to disable Internet Explorer conditional comments, which are actually not part of the HTML 5 standard.</p>
*
* <ul>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#comment-state">HTML5 Comment State</a></li>
* <li><a href="http://msdn.microsoft.com/en-us/library/ms537512%28v=vs.85%29.aspx">Conditional Comments in Internet Explorer</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <!-- {{inHTMLComment(html_comment)}} -->
*
*/
exports.inHTMLComment = privFilters.yc;

/**
* @function module:xss-filters#inSingleQuotedAttr
*
* @param {string} s - An untrusted user input
* @returns {string} The string s with any single-quote characters encoded into '&amp;&#39;'.
*
* @description
* <p class="warning">Warning: This is NOT designed for any onX (e.g., onclick) attribtues!</p>
* <p class="warning">Warning: If you're working on URI/components, use the more specific uri___InSingleQuotedAttr filter </p>
* This filter is to be placed in HTML Attribute Value (single-quoted) state to encode all single-quote characters into '&amp;&#39;'
*
* <ul>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(single-quoted)-state">HTML5 Attribute Value (Single-Quoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <input name='firstname' value='{{inSingleQuotedAttr(firstname)}}' />
*
*/
exports.inSingleQuotedAttr = privFilters.yavs;

/**
* @function module:xss-filters#inDoubleQuotedAttr
*
* @param {string} s - An untrusted user input
* @returns {string} The string s with any single-quote characters encoded into '&amp;&quot;'.
*
* @description
* <p class="warning">Warning: This is NOT designed for any onX (e.g., onclick) attribtues!</p>
* <p class="warning">Warning: If you're working on URI/components, use the more specific uri___InDoubleQuotedAttr filter </p>
* This filter is to be placed in HTML Attribute Value (double-quoted) state to encode all single-quote characters into '&amp;&quot;'
*
* <ul>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(double-quoted)-state">HTML5 Attribute Value (Double-Quoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <input name="firstname" value="{{inDoubleQuotedAttr(firstname)}}" />
*
*/
exports.inDoubleQuotedAttr = privFilters.yavd;

/**
* @function module:xss-filters#inUnQuotedAttr
*
* @param {string} s - An untrusted user input
* @returns {string} The string s with any tab, LF, FF, space, and '>' encoded.
*
* @description
* <p class="warning">Warning: This is NOT designed for any onX (e.g., onclick) attribtues!</p>
* <p class="warning">Warning: If you're working on URI/components, use the more specific uri___InUnQuotedAttr filter </p>
* This filter is to be placed in HTML Attribute Value (unquoted) state to encode tab, LF, FF, space, and '>' into their equivalent HTML entity representations.
*
* <ul>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(unquoted)-state">HTML5 Attribute Value (Unquoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <input name="firstname" value={{inUnQuotedAttr(firstname)}} />
*
*/
exports.inUnQuotedAttr = privFilters.yavu;


/**
* @function module:xss-filters#uriInSingleQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly an <strong>absolute</strong> URI
* @returns {string} The string s encoded first by window.encodeURI(), then inSingleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* @description
* This filter is to be placed in HTML Attribute Value (single-quoted) state for an <strong>absolute</strong> URI.<br/>
* The correct order of encoders is thus: first window.encodeURI(), then inSingleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* <p>Notice: This filter is IPv6 friendly by not encoding '[' and ']'.</p>
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI">encodeURI | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(single-quoted)-state">HTML5 Attribute Value (Single-Quoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href='{{uriInSingleQuotedAttr(full_uri)}}'>link</a>
* 
*/
exports.uriInSingleQuotedAttr = function (s) {
    return privFilters.uriInAttr(s, privFilters.VALUE_SINGLE_QUOTED);
};

/**
* @function module:xss-filters#uriInDoubleQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly an <strong>absolute</strong> URI
* @returns {string} The string s encoded first by window.encodeURI(), then inDoubleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* @description
* This filter is to be placed in HTML Attribute Value (double-quoted) state for an <strong>absolute</strong> URI.<br/>
* The correct order of encoders is thus: first window.encodeURI(), then inDoubleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* <p>Notice: This filter is IPv6 friendly by not encoding '[' and ']'.</p>
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI">encodeURI | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(double-quoted)-state">HTML5 Attribute Value (Double-Quoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href="{{uriInDoubleQuotedAttr(full_uri)}}">link</a>
* 
*/
exports.uriInDoubleQuotedAttr = function (s) {
    return privFilters.uriInAttr(s, privFilters.VALUE_DOUBLE_QUOTED);
};


/**
* @function module:xss-filters#uriInUnQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly an <strong>absolute</strong> URI
* @returns {string} The string s encoded first by window.encodeURI(), then inUnQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* @description
* This filter is to be placed in HTML Attribute Value (unquoted) state for an <strong>absolute</strong> URI.<br/>
* The correct order of encoders is thus: first the built-in encodeURI(), then inUnQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* <p>Notice: This filter is IPv6 friendly by not encoding '[' and ']'.</p>
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI">encodeURI | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(unquoted)-state">HTML5 Attribute Value (Unquoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href={{uriInUnQuotedAttr(full_uri)}}>link</a>
* 
*/
exports.uriInUnQuotedAttr = function (s) {
    return privFilters.uriInAttr(s, privFilters.VALUE_UNQUOTED);
};

/**
* @function module:xss-filters#uriInHTMLData
*
* @param {string} s - An untrusted user input, supposedly an <strong>absolute</strong> URI
* @returns {string} The string s encoded by window.encodeURI() and then inHTMLData()
*
* @description
* This filter is to be placed in HTML Data state for an <strong>absolute</strong> URI.
*
* <p>Notice: The actual implmentation skips inHTMLData(), since '<' is already encoded as '%3C' by encodeURI().</p>
* <p>Notice: This filter is IPv6 friendly by not encoding '[' and ']'.</p>
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI">encodeURI | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#data-state">HTML5 Data State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href="/somewhere">{{uriInHTMLData(full_uri)}}</a>
* 
*/
exports.uriInHTMLData = privFilters.yufull;


/**
* @function module:xss-filters#uriInHTMLComment
*
* @param {string} s - An untrusted user input, supposedly an <strong>absolute</strong> URI
* @returns {string} The string s encoded by window.encodeURI(), and finally inHTMLComment()
*
* @description
* This filter is to be placed in HTML Comment state for an <strong>absolute</strong> URI.
*
* <p>Notice: This filter is IPv6 friendly by not encoding '[' and ']'.</p>
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI">encodeURI | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#data-state">HTML5 Data State</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#comment-state">HTML5 Comment State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <!-- {{uriInHTMLComment(full_uri)}} -->
* 
*/
exports.uriInHTMLComment = function (s) {
    return privFilters.yucomment(s, false, true);
};




/**
* @function module:xss-filters#uriPathInSingleQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly a URI Path/Query or relative URI
* @returns {string} The string s encoded first by window.encodeURI(), then inSingleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* @description
* This filter is to be placed in HTML Attribute Value (single-quoted) state for a URI Path/Query or relative URI.<br/>
* The correct order of encoders is thus: first window.encodeURI(), then inSingleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI">encodeURI | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(single-quoted)-state">HTML5 Attribute Value (Single-Quoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href='http://example.com/{{uriPathInSingleQuotedAttr(uri_path)}}'>link</a>
* <a href='http://example.com/?{{uriQueryInSingleQuotedAttr(uri_query)}}'>link</a>
* 
*/
exports.uriPathInSingleQuotedAttr = function (s) {
    return privFilters.uriPathInAttr(s, privFilters.VALUE_SINGLE_QUOTED);
};

/**
* @function module:xss-filters#uriPathInDoubleQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly a URI Path/Query or relative URI
* @returns {string} The string s encoded first by window.encodeURI(), then inDoubleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* @description
* This filter is to be placed in HTML Attribute Value (double-quoted) state for a URI Path/Query or relative URI.<br/>
* The correct order of encoders is thus: first window.encodeURI(), then inDoubleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI">encodeURI | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(double-quoted)-state">HTML5 Attribute Value (Double-Quoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href="http://example.com/{{uriPathInDoubleQuotedAttr(uri_path)}}">link</a>
* <a href="http://example.com/?{{uriQueryInDoubleQuotedAttr(uri_query)}}">link</a>
* 
*/
exports.uriPathInDoubleQuotedAttr = function (s) {
    return privFilters.uriPathInAttr(s, privFilters.VALUE_DOUBLE_QUOTED);
};


/**
* @function module:xss-filters#uriPathInUnQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly a URI Path/Query or relative URI
* @returns {string} The string s encoded first by window.encodeURI(), then inUnQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* @description
* This filter is to be placed in HTML Attribute Value (unquoted) state for a URI Path/Query or relative URI.<br/>
* The correct order of encoders is thus: first the built-in encodeURI(), then inUnQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI">encodeURI | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(unquoted)-state">HTML5 Attribute Value (Unquoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href=http://example.com/{{uriPathInUnQuotedAttr(uri_path)}}>link</a>
* <a href=http://example.com/?{{uriQueryInUnQuotedAttr(uri_query)}}>link</a>
* 
*/
exports.uriPathInUnQuotedAttr = function (s) {
    return privFilters.uriPathInAttr(s, privFilters.VALUE_UNQUOTED);
};

/**
* @function module:xss-filters#uriPathInHTMLData
*
* @param {string} s - An untrusted user input, supposedly a URI Path/Query or relative URI
* @returns {string} The string s encoded by window.encodeURI() and then inHTMLData()
*
* @description
* This filter is to be placed in HTML Data state for a URI Path/Query or relative URI.
*
* <p>Notice: The actual implmentation skips inHTMLData(), since '<' is already encoded as '%3C' by encodeURI().</p>
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI">encodeURI | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#data-state">HTML5 Data State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href="http://example.com/">http://example.com/{{uriPathInHTMLData(uri_path)}}</a>
* <a href="http://example.com/">http://example.com/?{{uriQueryInHTMLData(uri_query)}}</a>
* 
*/
exports.uriPathInHTMLData = privFilters.yu;


/**
* @function module:xss-filters#uriPathInHTMLComment
*
* @param {string} s - An untrusted user input, supposedly a URI Path/Query or relative URI
* @returns {string} The string s encoded by window.encodeURI(), and finally inHTMLComment()
*
* @description
* This filter is to be placed in HTML Comment state for a URI Path/Query or relative URI.
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI">encodeURI | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#data-state">HTML5 Data State</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#comment-state">HTML5 Comment State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <!-- http://example.com/{{uriPathInHTMLComment(uri_path)}} -->
* <!-- http://example.com/?{{uriQueryInHTMLComment(uri_query)}} -->
*/
exports.uriPathInHTMLComment = function (s) {
    return privFilters.yucomment(s, false, false);
};


/**
* @function module:xss-filters#uriQueryInSingleQuotedAttr
* @description This is an alias of {@link module:xss-filters#uriPathInSingleQuotedAttr}
* 
* @alias module:xss-filters#uriPathInSingleQuotedAttr
*/
exports.uriQueryInSingleQuotedAttr = exports.uriPathInSingleQuotedAttr;

/**
* @function module:xss-filters#uriQueryInDoubleQuotedAttr
* @description This is an alias of {@link module:xss-filters#uriPathInDoubleQuotedAttr}
* 
* @alias module:xss-filters#uriPathInDoubleQuotedAttr
*/
exports.uriQueryInDoubleQuotedAttr = exports.uriPathInDoubleQuotedAttr;

/**
* @function module:xss-filters#uriQueryInUnQuotedAttr
* @description This is an alias of {@link module:xss-filters#uriPathInUnQuotedAttr}
* 
* @alias module:xss-filters#uriPathInUnQuotedAttr
*/
exports.uriQueryInUnQuotedAttr = exports.uriPathInUnQuotedAttr;

/**
* @function module:xss-filters#uriQueryInHTMLData
* @description This is an alias of {@link module:xss-filters#uriPathInHTMLData}
* 
* @alias module:xss-filters#uriPathInHTMLData
*/
exports.uriQueryInHTMLData = exports.uriPathInHTMLData;

/**
* @function module:xss-filters#uriQueryInHTMLComment
* @description This is an alias of {@link module:xss-filters#uriPathInHTMLComment}
* 
* @alias module:xss-filters#uriPathInHTMLComment
*/
exports.uriQueryInHTMLComment = exports.uriPathInHTMLComment;



/**
* @function module:xss-filters#uriComponentInSingleQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly a URI Component
* @returns {string} The string s encoded first by window.encodeURIComponent(), then inSingleQuotedAttr()
*
* @description
* This filter is to be placed in HTML Attribute Value (single-quoted) state for a URI Component.<br/>
* The correct order of encoders is thus: first window.encodeURIComponent(), then inSingleQuotedAttr()
*
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent">encodeURIComponent | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(single-quoted)-state">HTML5 Attribute Value (Single-Quoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href='http://example.com/?q={{uriComponentInSingleQuotedAttr(uri_component)}}'>link</a>
* 
*/
exports.uriComponentInSingleQuotedAttr = function (s) {
    return privFilters.uriComponentInAttr(s, privFilters.VALUE_SINGLE_QUOTED);
};

/**
* @function module:xss-filters#uriComponentInDoubleQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly a URI Component
* @returns {string} The string s encoded first by window.encodeURIComponent(), then inDoubleQuotedAttr()
*
* @description
* This filter is to be placed in HTML Attribute Value (double-quoted) state for a URI Component.<br/>
* The correct order of encoders is thus: first window.encodeURIComponent(), then inDoubleQuotedAttr()
*
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent">encodeURIComponent | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(double-quoted)-state">HTML5 Attribute Value (Double-Quoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href="http://example.com/?q={{uriComponentInDoubleQuotedAttr(uri_component)}}">link</a>
* 
*/
exports.uriComponentInDoubleQuotedAttr = function (s) {
    return privFilters.uriComponentInAttr(s, privFilters.VALUE_DOUBLE_QUOTED);
};


/**
* @function module:xss-filters#uriComponentInUnQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly a URI Component
* @returns {string} The string s encoded first by window.encodeURIComponent(), then inUnQuotedAttr()
*
* @description
* This filter is to be placed in HTML Attribute Value (unquoted) state for a URI Component.<br/>
* The correct order of encoders is thus: first the built-in encodeURIComponent(), then inUnQuotedAttr()
*
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent">encodeURIComponent | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(unquoted)-state">HTML5 Attribute Value (Unquoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href=http://example.com/?q={{uriComponentInUnQuotedAttr(uri_component)}}>link</a>
* 
*/
exports.uriComponentInUnQuotedAttr = function (s) {
    return privFilters.uriComponentInAttr(s, privFilters.VALUE_UNQUOTED);
};

/**
* @function module:xss-filters#uriComponentInHTMLData
*
* @param {string} s - An untrusted user input, supposedly a URI Component
* @returns {string} The string s encoded by window.encodeURIComponent() and then inHTMLData()
*
* @description
* This filter is to be placed in HTML Data state for a URI Component.
*
* <p>Notice: The actual implmentation skips inHTMLData(), since '<' is already encoded as '%3C' by encodeURIComponent().</p>
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent">encodeURIComponent | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#data-state">HTML5 Data State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href="http://example.com/">http://example.com/?q={{uriComponentInHTMLData(uri_component)}}</a>
* <a href="http://example.com/">http://example.com/#{{uriComponentInHTMLData(uri_fragment)}}</a>
* 
*/
exports.uriComponentInHTMLData = privFilters.yuc;


/**
* @function module:xss-filters#uriComponentInHTMLComment
*
* @param {string} s - An untrusted user input, supposedly a URI Component
* @returns {string} The string s encoded by window.encodeURIComponent(), and finally inHTMLComment()
*
* @description
* This filter is to be placed in HTML Comment state for a URI Component.
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent">encodeURIComponent | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#data-state">HTML5 Data State</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#comment-state">HTML5 Comment State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <!-- http://example.com/?q={{uriComponentInHTMLComment(uri_component)}} -->
* <!-- http://example.com/#{{uriComponentInHTMLComment(uri_fragment)}} -->
*/
exports.uriComponentInHTMLComment = function (s) {
    return privFilters.yucomment(s, true);
};



/**
* @function module:xss-filters#uriFragmentInSingleQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly a URI Fragment
* @returns {string} The string s encoded first by window.encodeURIComponent(), then inSingleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* @description
* This filter is to be placed in HTML Attribute Value (single-quoted) state for a URI Fragment.<br/>
* The correct order of encoders is thus: first window.encodeURIComponent(), then inSingleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent">encodeURIComponent | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(single-quoted)-state">HTML5 Attribute Value (Single-Quoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href='http://example.com/#{{uriFragmentInSingleQuotedAttr(uri_fragment)}}'>link</a>
* 
*/
exports.uriFragmentInSingleQuotedAttr = function (s) {
    return privFilters.uriFragmentInAttr(s, privFilters.VALUE_SINGLE_QUOTED);
};

/**
* @function module:xss-filters#uriFragmentInDoubleQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly a URI Fragment
* @returns {string} The string s encoded first by window.encodeURIComponent(), then inDoubleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* @description
* This filter is to be placed in HTML Attribute Value (double-quoted) state for a URI Fragment.<br/>
* The correct order of encoders is thus: first window.encodeURIComponent(), then inDoubleQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent">encodeURIComponent | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(double-quoted)-state">HTML5 Attribute Value (Double-Quoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href="http://example.com/#{{uriFragmentInDoubleQuotedAttr(uri_fragment)}}">link</a>
* 
*/
exports.uriFragmentInDoubleQuotedAttr = function (s) {
    return privFilters.uriFragmentInAttr(s, privFilters.VALUE_DOUBLE_QUOTED);
};


/**
* @function module:xss-filters#uriFragmentInUnQuotedAttr
*
* @param {string} s - An untrusted user input, supposedly a URI Fragment
* @returns {string} The string s encoded first by window.encodeURIComponent(), then inUnQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* @description
* This filter is to be placed in HTML Attribute Value (unquoted) state for a URI Fragment.<br/>
* The correct order of encoders is thus: first the built-in encodeURIComponent(), then inUnQuotedAttr(), and finally prefix the resulted string with 'x-' if it begins with 'javascript:' or 'vbscript:' that could possibly lead to script execution
*
* <ul>
* <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent">encodeURIComponent | MDN</a></li>
* <li><a href="http://tools.ietf.org/html/rfc3986">RFC 3986</a></li>
* <li><a href="https://html.spec.whatwg.org/multipage/syntax.html#attribute-value-(unquoted)-state">HTML5 Attribute Value (Unquoted) State</a></li>
* </ul>
*
* @example
* // output context to be applied by this filter.
* <a href=http://example.com/#{{uriFragmentInUnQuotedAttr(uri_fragment)}}>link</a>
* 
*/
exports.uriFragmentInUnQuotedAttr = function (s) {
    return privFilters.uriFragmentInAttr(s, privFilters.VALUE_UNQUOTED);
};


/**
* @function module:xss-filters#uriFragmentInHTMLData
* @description This is an alias of {@link module:xss-filters#uriComponentInHTMLData}
* 
* @alias module:xss-filters#uriComponentInHTMLData
*/
exports.uriFragmentInHTMLData = exports.uriComponentInHTMLData;

/**
* @function module:xss-filters#uriFragmentInHTMLComment
* @description This is an alias of {@link module:xss-filters#uriComponentInHTMLComment}
* 
* @alias module:xss-filters#uriComponentInHTMLComment
*/
exports.uriFragmentInHTMLComment = exports.uriComponentInHTMLComment;

})();

},{"./private-xss-filters":1}]},{},[2])(2)
});