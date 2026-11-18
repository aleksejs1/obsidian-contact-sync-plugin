import { htmlToText } from 'src/utils/htmlToText';

describe('htmlToText', () => {
  it('converts line breaks and paragraphs to newlines', () => {
    expect(htmlToText('<p>first</p><p>second<br/>third</p>')).toBe(
      'first\nsecond\nthird'
    );
  });

  it('converts list items to dashes', () => {
    expect(htmlToText('<ul><li>one</li><li>two</li></ul>')).toBe(
      '- one\n- two'
    );
  });

  it('strips other tags', () => {
    expect(htmlToText('<b>bold</b> and <a href="x">link</a>')).toBe(
      'bold and link'
    );
  });

  it('decodes named and numeric entities', () => {
    expect(
      htmlToText('a &lt;b&gt; &quot;c&quot; &#39;d&#39; &#x41;&nbsp;e')
    ).toBe('a <b> "c" \'d\' A e');
  });

  it('leaves unknown entities untouched', () => {
    expect(htmlToText('&unknown; &#xZZ; &#x110000;')).toBe(
      '&unknown; &#xZZ; &#x110000;'
    );
  });

  it('collapses excessive blank lines', () => {
    expect(htmlToText('a<br><br><br><br>b')).toBe('a\n\nb');
  });
});
