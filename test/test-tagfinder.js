// test-tagfinder.js
// nodeunit test for tagextractor.js 
// © Harald Rudell 2012

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
			t: 'title',
			i: 1,
			a: {},
			c: [],
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
			t: 'tag1', i: 1, a: {},c: []
			}, {
			t: 'tag2', i: 4, a: {}, c: []
			}, {
			t: 'tag3', i: 7, v: true, a: {}, c: []
			}, {
			t: 'tag4', i: 10, v: true, a: {}, c: []
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
			t: 'tag', i: 1,
			a: {
				a1: '',
			},
			c: []
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
			t: 'tag', i: 1,
			a: {
				a1: 'a',
			},
			c: [ 'b']
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
			t: 'tag', i: 1,
			a: {
				a1: 'a',
			},
			c: [ 'b', 'c']
		} ]
	}

	tagData = tagfinder.decomposeHtml(html)
	test.deepEqual(tagData, expected)

	test.done()
}