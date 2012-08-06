# Tagfinder

Tagfinder parses html5 markup for opening tags and their attributes.

It can be used to parse html5 when other parsers or jQuery might be too slow, for example in a Web server. Tagfinder is the inner workings of the Webfiller module that facilitates dual-side rendering with Express or any node.js environment.

* [Tagfinder](https://github.com/haraldrudell/tagfinder) is on github
* [Webfiller](https://github.com/haraldrudell/webfiller) is on github

# Usage Example

```js
console.log(require('./lib/tagfinder').decomposeHtml('<!doctype html><title class="c1 c2" id=p>x</title>'))
```

outputs:

```
{ contents: 
   [ '<!doctype html>',
     '<title class="c1 c2" id=p>',
     'x',
     '</title>' ],
  tags: 
   [ { tag: 'title',
       index: 1,
       voidElement: false,
       attributes: { class: 'c1 c2', id: 'p' },
       classes: [ 'c1', 'c2' ] }
```

* .tags: an array of each opening element in the html
* .contents: the document split into an array of

  * One initial piece, before any opening tag
  * For each opening tag, 3 elements:

     * The tag itself
     * Element contents up to the first opening or closing tag
     * The rest of the element contents

# Html5

   Tagfinder is designed for html5. Carefully crafted html5 renders in most browsers. Tagfinder is not designed for older markup or xml. This means your markup needs to be html5, and as such it can target most browsers.

   Tagfinder is designed for node.js, but could easily run in any JavaScript environment.