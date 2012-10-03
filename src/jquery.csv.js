/**
 * jQuery-csv (jQuery Plugin)
 * version: 0.62 (2012-09-05)
 *
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * This plugin was originally designed to assist in parsing CSV files loaded
 * from client-side javascript. It's influenced by jQuery.json and the original
 * core RegEx comes directly from the following answer posted by a
 * StackOverflow.com user named Ridgerunner.
 * Source:
 * - http://stackoverflow.com/q/8493195/290340
 *
 * For legal purposes I'll include the "NO WARRANTY EXPRESSED OR IMPLIED.
 * USE AT YOUR OWN RISK.". Which, in 'layman's terms' means, by using this
 * library you are accepting responsibility if it breaks your code.
 *
 * Legal jargon aside, I will do my best to provide a useful and stable core
 * that can effectively be built on.
 *
 * Copyrighted 2012 by Evan Plaice.
 */

RegExp.escape= function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

(function( $ ) {
  'use strict'
  /**
   * jQuery.csv.defaults
   * Encapsulates the method paramater defaults for the CSV plugin module.
   */
   
  $.csv = {
    defaults: {
      separator:',',
      delimiter:'"',
      escaper:'"',
      skip:0,
      headerLine:1,
      dataLine:2
    },
    
    configure: function(options) {
      // clone the defaults to avoid global definition
      var defaults = $.extend({__copy: true}, $.csv.defaults);
      return $.extend(defaults, options);
    },

    splitLines: function(csv, delimiter) {
      var state = 0;
      var value = "";
      var line = "";
      var lines = [];
      function endOfRow() {
        lines.push(value);
        value = "";
        state = 0;
      };
      csv.replace(/(\"|\n|\r|[^\"\r\n]+)/gm, function (m0){
        switch (state) {
          // the start of an entry
          case 0:
            if (m0 === "\"") {
              state = 1;
            } else if (m0 === "\n") {
              endOfRow();
            } else if (/^\r$/.test(m0)) {
              // Ignored
            } else {
              if (value) {
                // We shouldn't get here
                throw new Error("Internal error: we have a value already.");
              }
              value = m0;
              state = 3;
            }
            break;
          // delimited input  
          case 1:
            if (m0 === "\"") {
              state = 2;
            } else if ((m0 === "\n") || (m0 === "\r")) {
              value += m0;
              state = 1;
            } else {
              value += m0;
              state = 1;
            }
            break;
          // delimiter found in delimited input
          case 2:
            // is the delimiter escaped?
            if (m0 === "\"" && value.substr(value.length - 1) === "\"") {
              value += m0;
              state = 1;
            } else if (m0 === ",") {
              value += m0;
              state = 0;
            } else if (m0 === "\n") {
              endOfRow();
            } else if (m0 === "\r") {
            } else {
              throw new Error("Illegal state");
            }
            break;
          // un-delimited input
          case 3:
            if (m1 === "\"") {
              throw new Error("Unquoted delimiter in string");
            } else if (m0 === "\n") {
              endOfRow();
            } else if (m0 === "\r") {
              // Ignore
            } else {
              throw new Error("Two values, no separator?");
            }
              break;
          default:
            throw new Error("Unknown state");
        }
        return "";
      });
      if (state != 0) {
        endOfRow();
      }
      return lines;
    },

    /**
     * $.csv.toArray(csv)
     * Converts a CSV entry string to a javascript array.
     *
     * @param {Array} csv The string containing the CSV data.
     * @param {Object} [options] An object containing user-defined options.
     * @param {Character} [separator] An override for the separator character. Defaults to a comma(,).
     * @param {Character} [delimiter] An override for the delimiter character. Defaults to a double-quote(").
     * @param {Character} [escaper] An override for the escaper character. Defaults to a a double-quote(").
     *
     * This method deals with simple CSV strings only. It's useful if you only
     * need to parse a single entry. If you need to parse more than one line,
     * use $.csv2Array instead.
     */
    toArray: function(csv, options) {
      var options = (options !== undefined ? options : {});
      var separator = 'separator' in options ? options.separator : $.csv.defaults.separator;
      var delimiter = 'delimiter' in options ? options.delimiter : $.csv.defaults.delimiter;
      var escaper = 'escaper' in options ? options.escaper : $.csv.defaults.escaper;

      separator = RegExp.escape(separator);
      delimiter = RegExp.escape(delimiter);
      escaper = RegExp.escape(escaper);

      // build the CSV validator regex
      //var reValid = /^\s*(?:Y[^YZ]*(?:ZY[^YZ]*)*Y|[^XYZ\s]*(?:\s+[^XYZ\s]+)*)\s*(?:X\s*(?:Y[^YZ]*(?:ZY[^YZ]*)*Y|[^XYZ\s]*(?:\s+[^XYZ\s]+)*)\s*)*$/;
      //var reValidSrc = reValid.source;    
      //reValidSrc = reValidSrc.replace(/X/g, separator);
      //reValidSrc = reValidSrc.replace(/Y/g, delimiter);
      //reValidSrc = reValidSrc.replace(/Z/g, escaper);
      //reValid = RegExp(reValidSrc);

      // build the CSV line parser regex
      var reValue = /(?!\s*$)\s*(?:Y([^YZ]*(?:ZY[^YZ]*)*)Y|([^XYZ\s]*(?:\s+[^XYZ\s]+)*))\s*(?:X|$)/;
      var reValueSrc = reValue.source;
      reValueSrc = reValueSrc.replace(/X/g, separator);
      reValueSrc = reValueSrc.replace(/Y/g, delimiter);
      reValueSrc = reValueSrc.replace(/Z/g, escaper);
      reValue = RegExp(reValueSrc, 'g');

      if (csv === "") {
          return [""];
      }
      // Return NULL if input string is not well formed CSV string.
      //if (!reValid.test(csv)) {
      //  return null;
      //}

      // "Walk" the string using replace with callback.
      var output = [];
      csv.replace(reValue, function(m0, m1, m2) {
        // Remove backslash from any delimiters in the value
      if(typeof m1 === 'string' && m1.length) {        // Fix: evaluates to false for both empty strings and undefined
          var reDelimiterUnescape = /ED/;
          var reDelimiterUnescapeSrc = reDelimiterUnescape.source;
          reDelimiterUnescapeSrc = reDelimiterUnescapeSrc.replace(/E/, escaper);
          reDelimiterUnescapeSrc = reDelimiterUnescapeSrc.replace(/D/, delimiter);
          reDelimiterUnescape = RegExp(reDelimiterUnescapeSrc, 'g');
          output.push(m1.replace(reDelimiterUnescape, delimiter));
        } else if(m2 !== undefined) {
          output.push(m2);
        }
        return '';
      });

      // Handle special case of empty last value.
      var reEmptyLast = /S\s*$/;
      reEmptyLast = RegExp(reEmptyLast.source.replace(/S/, separator));
      if (reEmptyLast.test(csv)) {
        output.push('');
      }

      return output;
    },

    /**
     * $.csv.toArrays(csv)
     * Converts a CSV string to a javascript array.
     *
     * @param {String} csv The string containing the raw CSV data.
     * @param {Object} [options] An object containing user-defined options.
     * @param {Character} [separator] An override for the separator character. Defaults to a comma(,).
     * @param {Character} [delimiter] An override for the delimiter character. Defaults to a double-quote(").
     * @param {Character} [escaper] An override for the escaper character. Defaults to a a double-quote(").
     * @param {Integer} [skip] The number of lines that need to be skipped before the parser starts. Defaults to 0.
     *
     * This method deals with multi-line CSV. The breakdown is simple. The first
     * dimension of the array represents the line (or entry/row) while the second
     * dimension contains the values (or values/columns).
     */
    toArrays: function(csv, options) {
      var options = (options !== undefined ? options : {});
      var separator = 'separator' in options ? options.separator : $.csv.defaults.separator;
      var delimiter = 'delimiter' in options ? options.delimiter : $.csv.defaults.delimiter;
      var escaper = 'escaper' in options ? options.escaper : $.csv.defaults.escaper;
      var skip = 'skip' in options ? options.skip : $.csv.defaults.skip;
      var experimental = 'experimental' in options ? options.experimental : false;

      var lines = [];
      var output = [];

      if(!experimental) {
        lines = csv.split(/\r\n|\r|\n/g);
      } else {
        lines = $.csv.splitLines(csv, delimiter);
      }

      for(var i in lines) {
        if(i < skip) {
          continue;
        }
        // process each value
        var entry = $.csvEntry2Array(lines[i], {
          delimiter: delimiter,
          separator: separator,
          escaper: escaper
        });
        output.push(entry);
      }

      return output;
    },

    /**
     * $.csv.toObjects(csv)
     * Converts a CSV string to a javascript object.
     * @param {String} csv The string containing the raw CSV data.
     * @param {Object} [options] An object containing user-defined options.
     * @param {Character} [separator] An override for the separator character. Defaults to a comma(,).
     * @param {Character} [delimiter] An override for the delimiter character. Defaults to a double-quote(").
     * @param {Character} [escaper] An override for the escaper character. Defaults to a a double-quote(").
     * @param {Integer} [headerLine] The line in the file that contains the header data. Defaults to 1 (1-based counting).
     * @param {Integer} [dataLine] The line where the data values start. Defaults to 2 (1-based counting).
     *
     * This method deals with multi-line CSV strings. Where the headers line is
     * used as the key for each value per entry.
     */
    toObjects: function(csv, options) {
      var options = (options !== undefined ? options : {});
      var separator = 'separator' in options ? options.separator : $.csv.defaults.separator;
      var delimiter = 'delimiter' in options ? options.delimiter : $.csv.defaults.delimiter;
      var escaper = 'escaper' in options ? options.escaper : $.csv.defaults.escaper;
      var headerLine = 'headerLine' in options ? options.headerLine : $.csv.defaults.headerLine;
      var dataLine = 'dataLine' in options ? options.dataLine : $.csv.defaults.dataLine;
      var experimental = 'experimental' in options ? options.experimental : false;

      var lines = [];
      var output = [];
      
      if(!experimental) {
        lines = csv.split(/\r\n|\r|\n/g);
      } else {
        lines = this.splitLines(csv, delimiter);
      }

      // fetch the headers
      var headers = $.csvEntry2Array(lines[(headerLine - 1)]);
      // process the data
      for(var i in lines) {
        if(i < (dataLine - 1)) {
          continue;
        }
        // process each value
        var entry = $.csvEntry2Array(lines[i], {
          delimiter: delimiter,
          separator: separator,
          escaper: escaper
        });
        var object = {};
        for(var j in headers) {
          object[headers[j]] = entry[j];
        }
        output.push(object);
      }

      return output;
    },

     /**
     * $.csv.fromArrays(arrays)
     * Converts a javascript array to a CSV String.
     *
     * @param {Array} array An array of arrays containing CSV entries.
     * @param {Object} [options] An object containing user-defined options.
     * @param {Character} [separator] An override for the separator character. Defaults to a comma(,).
     * @param {Character} [delimiter] An override for the delimiter character. Defaults to a double-quote(").
     * @param {Character} [escaper] An override for the escaper character. Defaults to a a double-quote(").
     *
     * This method deals with simple CSV arrays only. It's useful if you only
     * need to convert a single entry. If you need to convert more than one line,
     * use $.csv2Array instead.
     */
    fromArray: function(arrays, options) {
      var options = (options !== undefined ? options : {});
      var separator = 'separator' in options ? options.separator : $.csv.defaults.separator;
      var delimiter = 'delimiter' in options ? options.delimiter : $.csv.defaults.delimiter;
      var escaper = 'escaper' in options ? options.escaper : $.csv.defaults.escaper;

      var output = [];
      for(i in array) {
        output.push(array[i]);
      }

      return output;
    },

    /**
     * $.csv.fromObjects(objects)
     * Converts a javascript dictionary to a CSV string.
     * @param {Object} objects An array of objects containing the data.
     * @param {Object} [options] An object containing user-defined options.
     * @param {Character} [separator] An override for the separator character. Defaults to a comma(,).
     * @param {Character} [delimiter] An override for the delimiter character. Defaults to a double-quote(").
     * @param {Character} [escaper] An override for the escaper character. Defaults to a a double-quote(").
     * @param {Integer} [headerLine] The line in the file that contains the header data. Defaults to 1 (1-based counting).
     * @param {Integer} [dataLine] The line where the data values start. Defaults to 2 (1-based counting).
     *
     * This method generates a CSV file from a javascript dictionary structure.
     * It starts by detecting the headers and adding them as the first line of
     * the CSV file, followed by a structured dump of the data.
     */
    fromObjects2CSV: function(dictionary, options) {
      alert('Not implemented yet'); // TODO: implement this
    }
  };

  // Maintenance code to maintain backward-compatibility
  // Will be removed in release 1.0
  $.csvEntry2Array = $.csv.toArray;
  $.csv2Array = $.csv.toArrays;
  $.csv2Dictionary = $.csv.toObjects;

})( jQuery );
