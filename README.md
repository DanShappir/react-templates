# react-templates

Light weight templates for [React](http://facebook.github.io/react/index.html). Reasons that we love it:

* No runtime libraries. No magic. Just simple pre-compilation to a clear React code
* Super easy to write panels. By panels we mean components that have a lot of HTML code and non-reusable logic
* Very good separation of presentation and logic. Almost no HTML within the component file
* Declerative coding for presentation. HTML that you write and inspect look similar
* Easy syntax. Similar to HTML. All IDEs recognize this format

## How does it work
React templates compiles a *.rt file (react template file - extended HTML format) into a JavaScript file. This file - which currently utilizes RequireJS format - returns a function. This function, when invoked, returns a virtual React DOM (based on React.DOM elements and custom user components). A common use case would be that a regular React component would require a JavaScript file generated from a template, and then perform `func.apply(this)`, causing the template to have that component as its context.

###### Basic concepts for react templates
* Any valid HTML is a template (and comments)
* {} to identify JS expression
* rt-if
* rt-repeat
* rt-scope
* rt-class
* style
* event handlers
* doctype rt, require dependencies, and calling other components

###### Why not use JSX?
Some love JSX, some don't. We don't. More specifically, it seems to us that JSX is a good fit only for components with very little HTML inside, which can be accomplished by creating elements in code. Also, we like to separate code and HTML. It just feels right.

## Usage
**src/cli.js < filename.rt >**
*(you might need to provide execution permission to the file)*

Note that in most cases, this package will be wrapped in a Grunt task, so that cli will not be used explicitly.
TODO: pointer to the Grunt repository

# Template directives and syntax

## Any valid HTML is a template
Any HTML that you write is a valid template, except for inline event handler ("on" attributes). See the section about event handlers for more information

## {} to identify JavaScript expressions
You can easily embed JavaScript expressions in both attribute values and content by encapsulating them in {}. If this is done inside an attribute value, the value still needs to be wrapped by quotes. In tag content, you can just use it.

###### Sample:
```html
<a href="{this.state.linkRef}">{this.state.linkText}</a>
```
###### Compiled:
```javascript
define([
    'react',
    'lodash'
], function (React, _) {
    'use strict';
    return function () {
        return React.DOM.a({ 'href': this.state.linkRef }, this.state.linkText);
    };
});
```
*Note*: within the special **"rt-"** directives (see below), simple strings don't make sense, as all these directives are used for specifying execution instructions. Therefore, in these directives, you should not use {}

## rt-if
This gives you the ability to add conditions to a sub-tree of html. If the condition is evaluated to true, the subree will be returned, otherwise, it will not be calculated. It is implemented by a trinary expression


###### Sample:
```html
<div rt-if="this.state.resultCode === 200">Success!</div>
```
###### Compiled:
```javascript
define([
    'react',
    'lodash'
], function (React, _) {
    'use strict';
    return function () {
        return this.state.resultCode === 200 ? React.DOM.div({}, 'Success!') : null;
    };
});
```

## rt-repeat
Repeats a node with its subtree for each item in an array. This is implemented by creating a method that is passed to a map call as a callback. It creates a real context for the iterated variable. The syntax is `rt-repeat="itemVar in arrayExpr"`. Within the scope of the element, `itemVar` will be available in javascript context, and also an `itemVarIndex` will be created to represent the index of the item. If the definition is `myNum in this.getMyNumbers()`, than there will be 2 variables in the scope: `myNum` and `myNumIndex`. This naming is used to allow nesting of repeat expression with access to all levels.

###### Sample:
```html
<div rt-repeat="myNum in this.getMyNumbers()">{myNumIndex}. myNum</div>
```
###### Compiled:
```javascript
define([
    'react',
    'lodash'
], function (React, _) {
    'use strict';
    function repeatMyNum1(myNum, myNumIndex) {
        return React.DOM.div({}, myNumIndex + '. myNum');
    }
    return function () {
        return _.map(this.getMyNumbers(), repeatMyNum1.bind(this));
    };
});
```

## rt-scope
This directive creates a new javascript scope. It actually creates a new method for this scope, and calls it with its current context. The syntax is `rt-scope="expr1 as var1; expr2 as var2`. This gives a convenience method to shorten stuff up in a scope and make the code more readable. It also helps to execute an expression only once in a scope instead of every chunk that needs it.

###### Sample:
```html
<div rt-repeat="rpt in array">
    <div rt-scope="')' as separator; rpt.val as val">{rptIndex}{separator} {val}</div>
    <div>'rpt' exists here, but not 'separator' and 'val'</div>
</div>
```
###### Compiled:
```javascript
define([
    'react',
    'lodash'
], function (React, _) {
    'use strict';
    function scopeSeparatorVal1(rpt, rptIndex, separator, val) {
        return React.DOM.div({}, rptIndex + separator + ' ' + val);
    }
    function repeatRpt2(rpt, rptIndex) {
        return React.DOM.div({}, scopeSeparatorVal1.apply(this, [
            rpt,
            rptIndex,
            ')',
            rpt.val
        ]), React.DOM.div({}, '\'rpt\' exists here, but not \'separator\' and \'val\''));
    }
    return function () {
        return _.map(array, repeatRpt2.bind(this));
    };
});
```

## rt-class
In order to reduce the boiler-plate code when programatically setting class names, you can use the rt-class directive. It expectes to get a JSON object with keys as class names, and a value of true or false as the value. If the value is true, the class name will be included. Please note the following:
1. In react templates, you can use the "class" attribute the same as you'd do in html. If you like, you can even have execution context within
2. You cannot use class and rt-class on the same html element

###### Sample:
```html
<div rt-scope="{blue: true, selected: this.isSelected()} as classes">
    These are logically equivalent
    <div rt-class="classes">Reference</div>
    <div rt-class="{blue: true, selected: this.isSelected()}">Inline</div>
    <div class="blue{this.isSelected() ? ' selected' : ''}">Using the class attribute</div>
</div>
```
###### Compiled:
```javascript
define([
    'react',
    'lodash'
], function (React, _) {
    'use strict';
    function scopeClasses1(classes) {
        return React.DOM.div({}, 'These are logically equivalent', React.DOM.div({ 'className': React.addons.classSet(classes) }, 'Reference'), React.DOM.div({
            'className': React.addons.classSet({
                blue: true,
                selected: this.isSelected()
            })
        }, 'Inline'), React.DOM.div({ 'className': 'blue' + this.isSelected() ? ' selected' : '' }, 'Using the class attribute'));
    }
    return function () {
        return scopeClasses1.apply(this, [{
                blue: true,
                selected: this.isSelected()
            }]);
    };
});
```

## style
In order to make it closer to html, we allow the settings of inline styles. In addition, this will take care of changing the styles from hyphen-style to camelCase style. If you'd like, you can still return an object from evaluation context. Please note that if you do it inline, you'll need to open single curly braces for the js context, and another for the object. Also, you'll need to use camelCase if using it that way

###### Sample:
```html
<div>
    These are really equivalent
    <div style="color:white; line-height:{this.state.lineHeight}px">Inline</div>
    <div style="{{'color': 'white', 'lineHeight': this.state.lineHeight + 'px'}}">Inline</div>
</div>
```
###### Compiled:
```javascript
define([
    'react',
    'lodash'
], function (React, _) {
    'use strict';
    return function () {
        return React.DOM.div({}, 'These are really equivalent', React.DOM.div({
            'style': {
                color: 'white',
                lineHeight: this.state.lineHeight + 'px'
            }
        }, 'Inline'), React.DOM.div({
            'style': {
                'color': 'white',
                'lineHeight': this.state.lineHeight + 'px'
            }
        }, 'Inline'));
    };
});
```

## event handlers
React event handlers accept function pointers. Therefore, when using event, you can just open an execution context and provide a pointer to a method. This would look like `onClick="{this.myClickHandler}"`. However, sometimes there's very little to do on click, or we just want to call a method with bound parameters. In that case, you can use a lambda notation, which will result in creating a react template creating a method for the handler. It does not have a performance impact, as the method is created once, and just bound to the context instead of created again. The lambda notation will look like this `onClick="(evt) => console.log(evt)"`. In this example, **evt** was the name you choose for the first argument that will be passed into your inline method. With browser events, this will most likely be the react synthetic event. However, if you expect a property that starts with **on**Something, then react-templates will treat it as an event handler. So if you have an event handler called **onBoxSelected** that will trigger an event with a row and column params, you can write `onBoxSelected="(row, col)=>this.doSomething(row,col)"`. You can use a no-param version as well `onClick="()=>console.log('just wanted to know it clicked')"`

###### Sample:
```html
<div rt-repeat="item in items">
    <div onClick="()=>this.itemSelected(item)" onMouseDown="{this.mouseDownHandler}">
</div>
```
###### Compiled:
```javascript
define([
    'react',
    'lodash'
], function (React, _) {
    'use strict';
    function onClick1(item, itemIndex) {
        this.itemSelected(item);
    }
    function repeatItem2(item, itemIndex) {
        return React.DOM.div({}, React.DOM.div({
            'onClick': onClick1.bind(this, item, itemIndex),
            'onMouseDown': this.mouseDownHandler
        }));
    }
    return function () {
        return _.map(items, repeatItem2.bind(this));
    };
});
```

## doctype rt, require dependencies, and calling other components
In many cases, you'd like to use either library code, or other components within your template. In order to do so, you can define a doctype and indicate dependencies. You do so by `<!doctype rt depVarName="depVarPath">`. After that, you will have **depVarName** in your scope. You can import react components and use them afterwords in the template as tag names. For example `<MySlider prop1="val1" onMyChange="{this.onSliderMoved}">`. This will also support nesting `<MyContainer><div>child</div><div>another</div></MyContainer>`. You will then be able to find the children in **this.props.children**.

###### Sample:
```html
<!doctype rt MyComp="comps/myComp" utils="utils/utils">
<MyComp rt-repeat="item in items">
    <div>{utils.toLower(item.name)}</div>
</MyComp>

```
###### Compiled:
```javascript
define([
    'react',
    'lodash',
    'comps/myComp',
    'utils/utils'
], function (React, _, MyComp, utils) {
    'use strict';
    function repeatItem1(item, itemIndex) {
        return MyComp({}, React.DOM.div({}, utils.toLower(item.name)));
    }
    return function () {
        return _.map(items, repeatItem1.bind(this));
    };
});
```
