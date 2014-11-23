'use strict';

var reactTemplates = require('../src/reactTemplates');
var React = require('react/addons');
var _ = require('lodash');
var $ = require('jquery-browserify');

$(function () {
    var sync = (function () {
        var map = {};
        return function (name) {
            if (!map.hasOwnProperty(name)) {
                map[name] = $.Deferred();
            }
            return map[name];
        };
    }());
    sync('react').resolve(React);
    sync('lodash').resolve(_);
    sync('jquery').resolve($);

    function generateTemplateSource(html) {
        return reactTemplates.convertTemplateToReact(html.trim().replace(/\r/g, ''));
    }

    function generateTemplateFunction(code, callback) {
        function define(dep, impl) {
            $.when.apply(null, _.map(dep, sync)).then(impl).done(callback);
        }
        /*eslint no-eval:0*/
        eval(code);
    }

    function generateReactClass(spec, render) {
        /*eslint no-eval:0*/
        spec = eval(spec);
        spec.render = render;
        return React.createClass(spec);
    }

    function generateProps(props) {
        if (props) {
            props = props.trim();
            if (props) {
                /*eslint no-eval:0*/
                props = eval(props[0] === '{' ? ('(' + props + ')') : ('({' + props + '})'));
            }
        }
        return props;
    }

    function process(rt, spec, $container, name, props, base) {
        try {
            var source = generateTemplateSource(rt);
            generateTemplateFunction(source, function (func) {
                var cls = generateReactClass(spec, func);
                props = generateProps(props);
                if ($container) {
                    React.render(React.createElement(cls, props), $container[0]);
                }
                if (name) {
                    sync(name).resolve(React.createFactory(cls));
                }
            });
        }
        catch (e) {
            console.error('Failed processing React Template', name || '', base);
        }
    }

    $('link[type="text/rt"]').each(function () {
        var $this = $(this);
        var base = $this.attr('href');
        var name = $this.attr('name');
        var props = $this.attr('props');
        var $container;
        if (name) {
            $this.remove();
        } else {
            $container = $('<span>').replaceAll($this);
        }

        $.when(
            $.ajax({
                url: base + '.rt',
                dataType: 'html'
            }),
            $.ajax({
                url: base + '.js',
                dataType: 'text'
            }).then(null, function () {
                return $.Deferred().resolve(['new Object']);
            })
        ).done(function (rt, script) {
            process(rt[0], script[0], $container, name, props, base);
        });
    });
});
