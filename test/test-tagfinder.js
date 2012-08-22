// test-tagfinder.js
// nodeunit test for tagextractor.js 
// © Harald Rudell 2012

var tagfinder = require('../lib/tagfinder')
var assert = require('mochawrapper')

// test providing empty markup
exports['Empty Markup'] = {
	'Can compile undefined': function() {
		var html
		var expected = {
			contents: [ 'undefined' ],
			tags: []
		}
		var actual = tagfinder.decomposeHtml(html)
		assert.deepEqual(actual, expected)
	},
	'Can compile empty string': function () {
		var html = ''
		var expected = {
			contents: [ '' ],
			tags: []
		}
		var actual = tagfinder.decomposeHtml(html)
		assert.deepEqual(actual, expected)
	}
}

exports['Parsing'] = {
	'Can remove html comments': function() {
		var html = '<!doctype html> <!-- hey < > - --> <title> <!-- --> </title> z'
		var expected = {
			contents: [
				'<!doctype html>  ',
				'<title>',
				' <!-- --> ',
				'</title> z',
			],
			tags: [{
				t: 'title',
				i: 1,
				a: {},
				c: [],
			}],
		}

		var actual = tagfinder.decomposeHtml(html)
//console.log('actual:', actual)
		assert.deepEqual(actual, expected)
	},
	'Can find opening tags': function() {
		var html = ' <tag1></tag1> <tag2 ></tag2> <tag3/> <tag4 />'
		var expected = {
			contents: [
				' ',
				'<tag1>', '', '</tag1> ',
				'<tag2 >', '', '</tag2> ',
				'<tag3/>', ' ', '',
				'<tag4 />', '', ''
			],
			tags: [{
				t: 'tag1', i: 1, a: {},c: []
				}, {
				t: 'tag2', i: 4, a: {}, c: []
				}, {
				t: 'tag3', i: 7, v: true, a: {}, c: []
				}, {
				t: 'tag4', i: 10, v: true, a: {}, c: []
			} ]
		}

		var tagData = tagfinder.decomposeHtml(html)
		assert.deepEqual(tagData, expected)
	},
	'Empty attributes': function() {
		var html = ' <tag a1 class>'
		var expected = {
			contents: [
				' ',
				'<tag a1 class>', '', ''
			],
			tags: [ {
				t: 'tag', i: 1,
				a: {
					a1: '',
				},
				c: []
			} ]
		}

		var tagData = tagfinder.decomposeHtml(html)
		assert.deepEqual(tagData, expected)
	},
	'Unquoted attributes': function() {
		var html = ' <tag a1=a class = b>'
		var expected = {
			contents: [
				' ',
				'<tag a1=a class = b>', '', ''
			],
			tags: [ {
				t: 'tag', i: 1,
				a: {
					a1: 'a',
				},
				c: [ 'b']
			} ]
		}

		var tagData = tagfinder.decomposeHtml(html)
		assert.deepEqual(tagData, expected)
	},
	'Quoted attributes': function() {
		var html = ' <tag a1=\'a\' class = "b c ">'
		var expected = {
			contents: [
				' ',
				'<tag a1=\'a\' class = "b c ">', '', ''
			],
			tags: [ {
				t: 'tag', i: 1,
				a: {
					a1: 'a',
				},
				c: [ 'b', 'c']
			} ]
		}

		var tagData = tagfinder.decomposeHtml(html)
		assert.deepEqual(tagData, expected)
	},
	'Unescaped content: script and textarea': function () {
		var html = ' <script>a<!--b&<c-->d</script>'
		var expected = {
			contents: [' ', '<script>', 'a<!--b&<c-->d', '</script>'],
			tags: [{
				t: 'script', i: 1, a: {}, c: []
			}]
		}
		var tagData = tagfinder.decomposeHtml(html)
		assert.deepEqual(tagData, expected)
	},
	'Closing tag in unescaped content': function () {
		var html = ' <script>a<!--b</script>c-->d<!--e-->f</script>'
		var expected = {
			contents: [' ', '<script>', 'a<!--b</script>c-->d<!--e-->f', '</script>'],
			tags: [{
				t: 'script', i: 1, a: {}, c: []
			}]
		}
		var tagData = tagfinder.decomposeHtml(html)
		assert.deepEqual(tagData, expected)
	},
	'MathML': function () {
		var html = '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
			'<mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow>' +
			'</math>'
		var expected = {
			contents: [ '', '<math xmlns="http://www.w3.org/1998/Math/MathML">',
					'', '', '<mrow>', '', '', '<mi>', 'a', '</mi>', '<mo>', '+', '</mo>', '<mi>',
					'b', '</mi></mrow></math>' ],
		tags: [{
			t: 'math', i: 1, a: {xmlns: "http://www.w3.org/1998/Math/MathML"}, c: []},
			{ t: 'mrow', i: 4, a: {}, c: []},
			{ t: 'mi', i: 7, a: {}, c: []},
			{ t: 'mo', i: 10, a: {}, c: []},
			{ t: 'mi', i: 13, a: {}, c: []}
		]}
		var tagData = tagfinder.decomposeHtml(html)
		assert.deepEqual(tagData, expected)
	},
	'cdata section': function () {
		var html = ' <div><![CDATA[ & </div><br/> ]]></div>'
		var expected = {
			contents: [' ', '<div>', '<![CDATA[ & </div><br/> ]]>', '</div>'],
			tags: [
				{t: 'div', i: 1, a: {}, c: []},
			]
		}
		var tagData = tagfinder.decomposeHtml(html)
		assert.deepEqual(tagData, expected)
	},
	'svg': function () {
		var html = '<div><svg xmlns="http://www.w3.org/2000/svg" ' +
		'version="1.1" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" ' +
		'style="width:100%; height:100%; position:absolute; top:0; left:0; z-index:-1;">' +
		'<linearGradient id="gradient">' +
		'<stop class="begin" offset="0%"/>' +
		'<stop class="end" offset="100%"/>' +
		'</linearGradient>' +
		'<rect x="0" y="0" width="100" height="100" style="fill:url(#gradient)" />' +
		'<circle cx="50" cy="50" r="30" style="fill:url(#gradient)" />' +
		'</svg></div>'
		var expected = {
			contents: ['', '<div>', '', '',
				'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style="width:100%; height:100%; position:absolute; top:0; left:0; z-index:-1;">',
				'', '', '<linearGradient id="gradient">', '', '',
				'<stop class="begin" offset="0%"/>', '', '',
				'<stop class="end" offset="100%"/>', '', '</linearGradient>',
				'<rect x="0" y="0" width="100" height="100" style="fill:url(#gradient)" />',
				'', '',
				'<circle cx="50" cy="50" r="30" style="fill:url(#gradient)" />',
				'', '</svg></div>' ],
			tags: [
				{t: 'div', i: 1, a: {}, c: []},
				{t: 'svg', i: 4, a: {
					xmlns: "http://www.w3.org/2000/svg",
					version: "1.1",
					viewBox: "0 0 100 100",
					preserveAspectRatio: "xMidYMid slice",
					style: "width:100%; height:100%; position:absolute; top:0; left:0; z-index:-1;"},
					c: []},
				{t: 'linearGradient', i: 7, a: {id: "gradient"}, c: []},
				{t: 'stop', i: 10, a: {offset: "0%"}, c: ['begin'], v: 1},
				{t: 'stop', i: 13, a: {offset: "100%"}, c: ['end'], v: 1},
				{t: 'rect', i: 16, a: {x: "0", y: "0", width: "100", height: "100", style: "fill:url(#gradient)"}, c: [], v: 1},
				{t: 'circle', i: 19, a: {cx: "50", cy: "50", r: "30", style: "fill:url(#gradient)"}, c: [], v: 1 }
			]
		}
		var tagData = tagfinder.decomposeHtml(html)
		assert.deepEqual(JSON.stringify(tagData), JSON.stringify(expected))
	},
}