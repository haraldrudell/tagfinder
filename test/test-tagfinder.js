// test-tagfinder.js
// nodeunit test for tagextractor.js 
// (c) Harald Rudell 2012

var tagfinder = require('../lib/tagfinder')

module.exports = {
	testEmptyMarkup: testEmptyMarkup,
	testUncommenting: testUncommenting,
	testTags: testTags,
	testEmptyAttribute: testEmptyAttribute,
	testUnquotedAttribute: testUnquotedAttribute,
	testQuotedAttribute: testQuotedAttribute,
}

// test providing empty markup
function testEmptyMarkup(test) {
	console.log('##############################')
	var html
	var expected = {
		contents: [ 'undefined' ],
		tags: []
	}
	var actual = tagfinder.decomposeHtml(html)
	test.deepEqual(actual, expected)

	var html = ''
	var expected = {
		contents: [ '' ],
		tags: []
	}
	var actual = tagfinder.decomposeHtml(html)
	test.deepEqual(actual, expected)

	test.done()
}

// test providing empty markup
function testUncommenting(test) {
	var html = '<!doctype html> <!-- hey < > - --> <title> <!-- --> </title> z'
	var expected = {
		contents: [
			'<!doctype html>  ',
			'<title>',
			' <!-- --> ',
			'</title> z',
		],
		tags: [{
			tag: 'title',
			index: 1,
			voidElement: false,
			attributes: {},
			classes: [],
		}],
	}

	var actual = tagfinder.decomposeHtml(html)
	//console.log('actual:', actual)
	test.deepEqual(actual, expected)

	test.done()
}


// test that opening tags are found
function testTags(test) {
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
			tag: 'tag1', index: 1, voidElement: false, attributes: {},classes: []
			}, {
			tag: 'tag2', index: 4, voidElement: false, attributes: {}, classes: []
			}, {
			tag: 'tag3', index: 7, voidElement: true, attributes: {}, classes: []
			}, {
			tag: 'tag4', index: 10, voidElement: true, attributes: {}, classes: []
		} ]
	}

	tagData = tagfinder.decomposeHtml(html)
	test.deepEqual(tagData, expected)

	test.done()
}

// test empty attributes
function testEmptyAttribute(test) {
	var html = ' <tag a1 class>'
	var expected = {
		contents: [
			' ',
			'<tag a1 class>', '', ''
		],
		tags: [ {
			tag: 'tag', index: 1, voidElement: false,
			attributes: {
				a1: '',
				class: '',
			},
			classes: []
		} ]
	}

	tagData = tagfinder.decomposeHtml(html)
	test.deepEqual(tagData, expected)

	test.done()
}

// test unquoted attributes
function testUnquotedAttribute(test) {
	var html = ' <tag a1=a class = b>'
	var expected = {
		contents: [
			' ',
			'<tag a1=a class = b>', '', ''
		],
		tags: [ {
			tag: 'tag', index: 1, voidElement: false,
			attributes: {
				a1: 'a',
				class: 'b'
			},
			classes: [ 'b']
		} ]
	}

	tagData = tagfinder.decomposeHtml(html)
	test.deepEqual(tagData, expected)

	test.done()
}

// test quoted attributes
function testQuotedAttribute(test) {
	var html = ' <tag a1=\'a\' class = "b c ">'
	var expected = {
		contents: [
			' ',
			'<tag a1=\'a\' class = "b c ">', '', ''
		],
		tags: [ {
			tag: 'tag', index: 1, voidElement: false,
			attributes: {
				a1: 'a',
				class: 'b c '
			},
			classes: [ 'b', 'c']
		} ]
	}

	tagData = tagfinder.decomposeHtml(html)
	test.deepEqual(tagData, expected)

	test.done()
}