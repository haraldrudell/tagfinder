// tagfinder.js
// finds opening tags and their attributes in html
// © Harald Rudell 2012

/*
Due to tags dictating how text is interpreted, the first step is to find opening tags

html syntax
http://dev.w3.org/html5/markup/syntax.html

tagfinder only supports utf-8

text: only unicode
space: \u0020, \u000c, \u000a, \u000r '\u0009'
no \u0000 - \u0008, \u000b, \u000d - \u001f, \u007f
http://dev.w3.org/html5/markup/syntax.html#text-syntax

normal: can have comments and directives
http://dev.w3.org/html5/markup/syntax.html#normal-character-data

replaceable: title, textarea: can have '<'
comments can not appear here, a comment is output like any other character
continues until </tag
http://dev.w3.org/html5/markup/syntax.html#replaceable-character-data

non-replaceable: script, style: can have '<', can not have character references
escaping text spans can appear here
ie. comments can not appear here, a comment is output like any other character
http://dev.w3.org/html5/markup/syntax.html#non-replaceable-character-data

Elements
tags starts with '<'
tag name 0-9a-zA-Z
attributes and spaces
optional '/'
'>'
http://dev.w3.org/html5/markup/syntax.html#syntax-elements

end tag: '</'
tag name
spaces
'>'

directive: '<!'
until '>'

escaping text span '<!--'
hyphens may be shared in opening and closing tags
'-->'

comments '<!--'
0 or more characters
until '-->'
http://dev.w3.org/html5/markup/syntax.html#comments

cdata: '<![CDATA['
until ']]>'

*/

var tagRegExp = /<([a-zA-Z\d]+)((?:[ \t\n\f\r]+[^ \t\n\f\r\u0000-\u001f\u007f'"=<>\u0000\/]+(?:|[ \t\n\f\r]*=[ \t\n\f\r]*(?:[^ \t\n\f\r'"=<>`]+|'[^']*'|"[^"]*")))*)[ \t\n\f\r]*(\/)?>/m
var attributeRegExp = /^[ \t\n\f\r]*([^ \t\n\f\r\u0000-\u001f\u007f'"=<>\u0000\/]+)(?:[ \t\n\f\r]*=[ \t\n\f\r]*([^ \t\n\f\r'"=<>`]+|'[^']*'|"[^"]*"))/m
var emptyAttributeRegExp = /^[ \t\n\f\r]*([^ \t\n\f\r\u0000-\u001f\u007f'"=<>\u0000\/]+)/
var classRegExp = /[^ \t\n\f\r]+/gm

/*
decompose html markup into its parts
html: html string data
return value: object
.contents: array of string: input split in pieces and comments removed
- [0]: markup prior to first tag, may be empty string
- then 3 elements per opening tag
- +0: the tag '<h1 id=a class=b>' starting and ending with angle bracket
- +1: the inital element content that is character text, may be empty string
- +2: any remaining markup that is not another opening tag
.tags: array of object describing each opening tag in order of appearance

tags:
.tag: tag name string 'h1'
.index: index in .content for the element containing the tag markup.contents index for tag, index+1 is first text, index+2 is remaining markup to next opening tag
.voidElement: boolean true if element is a void element
.attributes: key: attribute name, value: attribute values
- enclosing quotes removed
- leading and trailing space characters remain
.classes: array of string: each word found in class attribute
- words are separated by html space characters
note: character references (eg. &#x20) are not expanded. If you use these, results are unexpected
*/
exports.decomposeHtml = function decomposeHtml(html) {
	var contents = []
	var tags = []
	var htmlTag = ''
	var tagData
	var htmlContentEnd = 0
	html = String(html)

	for (;;) {

		// save initial element content for the preceding element
		if (contents.length != 0) switch (htmlTag) {
		case 'script':
		case 'style':
			// honor <!-- --> segments, data is until end tag
			for (;;) {
				var htmlEscaping = getIndex('<!--', htmlContentEnd)
				var htmlContentEnd = getIndex('</' + htmlTag, htmlContentEnd)
				if (htmlContentEnd < htmlEscaping) break
				htmlContentEnd = getIndex('-->', htmlEscaping + 1)
				if (htmlContentEnd == html.length) break
			}
			saveContent()
			break
		case 'title': // content is literal until </title
		case 'textarea': // textarea can not have comments
			// literal text until end tag
			var htmlContentEnd = getIndex('</' + htmlTag)
			saveContent()
			break				
		default: // regular html, honor CDATA and strip from comments
			saveRegularHtml(false)
		}

		/*
		find the next opening tag in the html markup
		null if not found
		match[0] the matched opening tag '<p class=a id=b>'
		match[1] the matched tag 'p'
		match[2] the attribute data 'class=a id=b', trimmed from html space characters
		match[3] if a void tag '/', otherwise undefined
		match.index: index of match in the input string
		match.input: the input string
		*/
		var match = html.match(tagRegExp)

		// save remaining content preceding this tag
		htmlContentEnd = match ? match.index : html.length
		saveRegularHtml(htmlContentEnd)

		if (!match) break // reached end of markup!

		// extract data for this opening tag
		tagData = {
			t: match[1],
			i: contents.length,
			a: {},
			c: [],
		}
		if (match[3]) tagData.v = 1
		htmlTag = !tagData.v ? tagData.t : ''

		// parse possible attributes
		if (match[2]) {
			parseAttributes(match[2])
			parseClassNames()
		}

		tags.push(tagData)

		// save the tag markup
		htmlContentEnd = match[0].length
		saveContent()
	}

	return {
		contents: contents,
		tags: tags,
	}

	// find markup in html
	// return value: number or html.length if markup not found
	function getIndex(markup, pos) {
		var result = html.indexOf(markup, pos)
		if (result == -1) result = html.length
		return result
	}

	/*
	save markup to contents array
	html: string html markup
	remove html comments
	htmlTag: possible tag name content belongs to, '' for none
	*/
	function saveContent() {
		contents.push(html.substring(0, htmlContentEnd))
		html = html.substring(htmlContentEnd)
	}

	/*
	save html to one contents element
	untilPos: continue until this position
	otherwise stop at first tag
	honor CDATA segments and skip comment text
	*/
	function saveRegularHtml(untilPos) {
		var str = []
		// start is the first character we might copy to str
		var start = 0
		for (;;) {

			// find the next tag (or comment or cdata)
			var htmlContentEnd = getIndex('<', start)

			// save text preceding the tag
			if (htmlContentEnd > start) {
				str.push(html.substring(start, htmlContentEnd))
				start = htmlContentEnd
			}

			if (htmlContentEnd == html.length) break

			// we know there is something, which one is it?
			if (html.substring(htmlContentEnd, htmlContentEnd + 9) == '<![CDATA[') {

				// copy cdata to output
				htmlContentEnd = getIndex(']]>', htmlContentEnd + 9)
				if (htmlContentEnd < html.length) htmlContentEnd += 3
				str.push(html.substring(start, htmlContentEnd))
			} else if (html.substring(htmlContentEnd, htmlContentEnd + 4) == '<!--') {

				// skip comment
				htmlContentEnd = getIndex('-->', htmlContentEnd + 4)
				if (htmlContentEnd < html.length) htmlContentEnd += 3
			} else { // some other tag or directive

				// if we are only running until the next tag, we are done
				if (!untilPos) break

				if (htmlContentEnd == untilPos) break

				// skip past the first character of this tag
				htmlContentEnd++
				str.push(html.substring(start, htmlContentEnd))
			}
			if (htmlContentEnd == untilPos) break
			start = htmlContentEnd
		}
		contents.push(str.join(''))
		html = html.substring(htmlContentEnd)
	}

	// attributes: string attribute markup from inside tag
	// updates tagData.attributes object
	function parseAttributes(attributes) {
		var attributes = match[2]
		for (;;) {

			// find an attribute name and value
			var attMatch = attributeRegExp.exec(attributes)
			if (!attMatch) attMatch = emptyAttributeRegExp.exec(attributes)
			if (!attMatch) break

			// extract attribute data
			var name = attMatch[1]
			var value = attMatch[2]
			if (value == null) value = ''
			else if (value[0] == '"' || value[0] == '\'') value = value.substring(1, value.length - 1)
			tagData.a[name] = value

			// get remaining attribute markup
			attributes = attributes.substring(attMatch.index + attMatch[0].length)
			if (!attributes) break
		}
	}

	// extracts class name words in tagData
	// updates tagData.classes
	function parseClassNames() {
		// add array of class names
		var match
		var classValue = tagData.a['class']
		delete tagData.a.class
		if (classValue) match = classValue.match(classRegExp)
		if (match) tagData.c = match
	}
}