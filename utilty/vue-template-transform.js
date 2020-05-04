'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

var isNotEmpty = function (str) { return str !== ''; };
var isBoolean = function (boolean) { return typeof boolean === 'boolean'; };
var removeQuotes = function (str) {
    if (str === void 0) { str = ''; }
    return str.replace(/"/g, '');
};
var makeMap = function (string, expectLowerCase) {
    var map = Object.create(null);
    var list = string.split(',');
    list.map(function (item) { return (map[item] = true); });
    return expectLowerCase ? function (val) { return map[val.toLowerCase()]; } : function (val) { return map[val]; };
};
var isUnaryTag = makeMap('area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
    'link,meta,param,source,track,wbr');

var DIRECTIVES;
(function (DIRECTIVES) {
    DIRECTIVES["text"] = "v-text";
    DIRECTIVES["html"] = "v-html";
    DIRECTIVES["show"] = "v-show";
    DIRECTIVES["if"] = "v-if";
    DIRECTIVES["else"] = "v-else";
    DIRECTIVES["elseif"] = "v-else-if";
    DIRECTIVES["for"] = "v-for";
    DIRECTIVES["on"] = "v-on";
    DIRECTIVES["bind"] = "v-bind";
    DIRECTIVES["model"] = "v-model";
    DIRECTIVES["slot"] = "v-slot";
    DIRECTIVES["pre"] = "v-pre";
    DIRECTIVES["cloak"] = "v-cloak";
    DIRECTIVES["once"] = "v-once";
})(DIRECTIVES || (DIRECTIVES = {}));
var DIRECTIVES$1 = DIRECTIVES;

var TYPE;
(function (TYPE) {
    TYPE[TYPE["ELEMENT"] = 1] = "ELEMENT";
    TYPE[TYPE["TEXT"] = 2] = "TEXT";
    TYPE[TYPE["STATIC_TEXT"] = 3] = "STATIC_TEXT";
})(TYPE || (TYPE = {}));
var onReg = /^@|^v-on:/;
var preserveBindingReg = /(^:|^v-bind:)(style|class|type|key)/;
var customPropertyReg = /(^:|^v-bind:)([\s\S]+)/;
var emptyBaseNodeAttr = {
    name: '',
    value: ''
};
var TemplateGenertor = (function () {
    function TemplateGenertor(options) {
        if (options === void 0) { options = {}; }
        this.options = options;
    }
    TemplateGenertor.prototype.generate = function (ast) {
        var res = {
            code: ''
        };
        if (!ast) {
            return res;
        }
        this.ast = ast;
        res.code = this.genElement(this.ast);
        return res;
    };
    TemplateGenertor.prototype.genElement = function (node) {
        if (!node) {
            return '';
        }
        else if (node.ifConditions && !node.ifConditionsHasGenerated) {
            return this.genIfConditions(node);
        }
        else if (node.type === TYPE.ELEMENT) {
            return this.genNode(node);
        }
        else if (node.type === TYPE.TEXT || node.type === TYPE.STATIC_TEXT) {
            return this.genText(node);
        }
        else {
            return '';
        }
    };
    TemplateGenertor.prototype.genIfConditions = function (node) {
        var _this = this;
        node.ifConditionsHasGenerated = true;
        if (!node.ifConditions) {
            return '';
        }
        return node.ifConditions
            .map(function (item) {
            var block = item.block;
            return _this.genElement(block);
        })
            .filter(isNotEmpty)
            .join('');
    };
    TemplateGenertor.prototype.genNode = function (node) {
        var tag = this.genTag(node);
        var isUnary = isUnaryTag(tag);
        var childrenNodes = this.genChildren(node);
        var directives = [
            this.genVIf(node),
            this.genVFor(node),
            this.genEvents(node),
            this.genVShow(node),
            this.genVModel(node),
            this.genVOnce(node),
            this.genVBind(node),
            this.genVCloak(node),
            this.genVHtml(node),
            this.genVPre(node),
            this.genVText(node)
        ];
        var attrs = [
            this.genAttrs(node),
            this.genStyle(node),
            this.genClass(node),
            this.genKey(node),
            this.genIs(node),
            this.genRef(node),
            this.genSlot(node)
        ];
        var startTag = "<" + __spreadArrays([tag], directives, attrs).filter(isNotEmpty)
            .join(' ') + (isUnary ? '/>' : '>');
        var endTag = isUnary ? '' : "</" + tag + ">";
        return [startTag, childrenNodes, endTag].join('');
    };
    TemplateGenertor.prototype.genChildren = function (node) {
        var _this = this;
        if (!node || !node.children || !node.children.length) {
            return '';
        }
        return node.children
            .map(function (child) { return _this.genElement(child); })
            .filter(isNotEmpty)
            .join('');
    };
    TemplateGenertor.prototype.genTag = function (node) {
        return node.tag;
    };
    TemplateGenertor.prototype.genText = function (node) {
        var _a = node.text, text = _a === void 0 ? '' : _a;
        return text;
    };
    TemplateGenertor.prototype.genVIf = function (node) {
        if (node.if) {
            return DIRECTIVES$1.if + "=\"" + node.if + "\"";
        }
        else if (node.elseif) {
            return DIRECTIVES$1.elseif + "=\"" + node.elseif + "\"";
        }
        else if (node.else) {
            return "" + DIRECTIVES$1.else;
        }
        return '';
    };
    TemplateGenertor.prototype.genVFor = function (node) {
        return this.getDirectiveFromAttrsMap(node, 'for', true);
    };
    TemplateGenertor.prototype.genKey = function (node) {
        return this.getPropFromAttrsMap(node, 'key', true);
    };
    TemplateGenertor.prototype.genEvents = function (node) {
        var _a = node.attrsMap, attrsMap = _a === void 0 ? {} : _a;
        return Object.keys(attrsMap)
            .map(function (attr) {
            if (onReg.test(attr)) {
                return attr + "=\"" + attrsMap[attr] + "\"";
            }
            return '';
        })
            .filter(isNotEmpty)
            .join(' ');
    };
    TemplateGenertor.prototype.genVShow = function (node) {
        return this.getDirectiveFromAttrsMap(node, 'show', true);
    };
    TemplateGenertor.prototype.genVModel = function (node) {
        return this.getDirectiveFromAttrsMap(node, 'model', true);
    };
    TemplateGenertor.prototype.genVBind = function (node) {
        var _a = node.attrsMap, attrsMap = _a === void 0 ? {} : _a;
        return Object.keys(attrsMap)
            .map(function (attr) {
            var isPreservedProperty = preserveBindingReg.test(attr);
            if (isPreservedProperty) {
                return '';
            }
            var matched = attr.match(customPropertyReg);
            if (matched) {
                return matched[0] + "=\"" + attrsMap[attr] + "\"";
            }
            return '';
        })
            .filter(isNotEmpty)
            .join(' ');
    };
    TemplateGenertor.prototype.genAttrs = function (node) {
        var _a = node.attrs, attrs = _a === void 0 ? [] : _a, _b = node.attrsMap, attrsMap = _b === void 0 ? {} : _b;
        if (!attrs.length) {
            return '';
        }
        var attrsMapKeys = Object.keys(attrsMap);
        return attrs
            .map(function (attr) {
            var name = attr.name, value = attr.value;
            return attrsMapKeys.find(function (attr) { return ":" + name === attr || "v-bind:" + name === attr; })
                ? ''
                : value === '""'
                    ? "" + name
                    : name + "=\"" + removeQuotes(value) + "\"";
        })
            .filter(isNotEmpty)
            .join(' ');
    };
    TemplateGenertor.prototype.genIs = function (node) {
        return this.getPropFromAttrsMap(node, 'is', true);
    };
    TemplateGenertor.prototype.genStyle = function (node) {
        var bindStyle = this.getPropFromAttrsMap(node, 'style', true);
        var staticStyle = this.getDomAttrFromAttrsMap(node, 'style', true);
        return bindStyle + " " + staticStyle;
    };
    TemplateGenertor.prototype.genClass = function (node) {
        var bindClass = this.getPropFromAttrsMap(node, 'class', true);
        var staticClass = this.getDomAttrFromAttrsMap(node, 'class', true);
        return bindClass + " " + staticClass;
    };
    TemplateGenertor.prototype.genVOnce = function (node) {
        return this.getDirectiveFromAttrsMap(node, 'once', true);
    };
    TemplateGenertor.prototype.genVPre = function (node) {
        return this.getDirectiveFromAttrsMap(node, 'pre', true);
    };
    TemplateGenertor.prototype.genVCloak = function (node) {
        return this.getDirectiveFromAttrsMap(node, 'cloak', true);
    };
    TemplateGenertor.prototype.genVHtml = function (node) {
        return this.getDirectiveFromAttrsMap(node, 'html', true);
    };
    TemplateGenertor.prototype.genVText = function (node) {
        return this.getDirectiveFromAttrsMap(node, 'text', true);
    };
    TemplateGenertor.prototype.genRef = function (node) {
        return this.getDomAttrFromAttrsMap(node, 'ref', true);
    };
    TemplateGenertor.prototype.genSlot = function (node) {
        if (node.tag === 'slot') {
            return this.getDomAttrFromAttrsMap(node, 'name', true);
        }
        return '';
    };
    TemplateGenertor.prototype.getDirectiveFromAttrsMap = function (node, name, alias, needNormalize) {
        if (isBoolean(alias)) {
            needNormalize = alias;
        }
        var res;
        var directive = DIRECTIVES$1[name] || DIRECTIVES$1[alias];
        var emptyMap = Object.assign({}, emptyBaseNodeAttr);
        var _a = node.attrsMap, attrsMap = _a === void 0 ? {} : _a;
        if (!directive) {
            res = emptyMap;
        }
        else {
            var dirReg_1 = new RegExp(directive);
            var realDir = Object.keys(attrsMap).find(function (attr) { return dirReg_1.test(attr); });
            res = realDir
                ? attrsMap[realDir]
                    ? {
                        name: realDir,
                        value: "\"" + attrsMap[realDir] + "\""
                    }
                    : Object.assign(emptyMap, {
                        noMap: true
                    })
                : emptyMap;
        }
        return needNormalize ? this.normalizeMap(res) : res;
    };
    TemplateGenertor.prototype.getPropFromAttrsMap = function (node, name, needNormalize) {
        var _a = node.attrsMap, attrsMap = _a === void 0 ? {} : _a;
        var emptyMap = Object.assign({}, emptyBaseNodeAttr);
        var value = attrsMap[":" + name] || attrsMap[DIRECTIVES$1.bind + ":" + name];
        var res = !value
            ? emptyMap
            : { name: ":" + name, value: "\"" + value + "\"" };
        return needNormalize ? this.normalizeMap(res) : res;
    };
    TemplateGenertor.prototype.getDomAttrFromAttrsMap = function (node, name, needNormalize) {
        var _a = node.attrsMap, attrsMap = _a === void 0 ? {} : _a;
        var emptyMap = Object.assign({}, emptyBaseNodeAttr);
        var res;
        if (attrsMap.hasOwnProperty(name)) {
            res = attrsMap[name] ? { name: name, value: "\"" + attrsMap[name] + "\"" } : emptyMap;
        }
        else {
            res = emptyMap;
        }
        return needNormalize ? this.normalizeMap(res) : res;
    };
    TemplateGenertor.prototype.normalizeMap = function (res) {
        var name = res.name, value = res.value, noMap = res.noMap;
        if (noMap && name) {
            return name;
        }
        else if (name && value) {
            return name + "=" + value;
        }
        else {
            return '';
        }
    };
    return TemplateGenertor;
}());

module.exports = TemplateGenertor;
