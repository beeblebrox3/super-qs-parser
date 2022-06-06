import { FILTERS_OPERATORS, parse, SORT_DIRECTION } from './index';
import { stringify } from 'qs';

it('should return empty values when querystring is empty', () => {
  const qs = '';
  const res = parse(qs);

  expect(res).toMatchObject({
    page: null,
    pageSize: null,
    q: '',
    filters: {},
    include: [],
    attributes: [],
    sort: [],
  });
});

describe('search query', () => {
  it('should parse search query (q)', () => {
    const qs = 'q=ratimbum';
    expect(parse(qs).q).toBe('ratimbum');
  });

  it('should use default search query if parameter is not present in url', function () {
    const qs = '';
    const res = parse(qs, { defaults: { q: 'castelo' } });
    expect(res.q).toBe('castelo');
  });

  it('should override default query when query is present in url', function () {
    const qs = 'q=ratimbum';
    const res = parse(qs, { defaults: { q: 'castelo' } });
    expect(res.q).toBe('ratimbum');
  });
});

describe('pagination', () => {
  it('should use default value for page when none is sent', () => {
    const qs = '';
    const res = parse(qs, { defaults: { page: 10 } });
    expect(res.page).toBe(10);
  });

  it('should override default page when it is sent', () => {
    const qs = 'page=2';
    const res = parse(qs, { defaults: { page: 1 } });
    expect(res.page).toBe(2);
  });

  it('should parse when page number is greater than 0', function () {
    const qs = 'page=1';
    const res = parse(qs);
    expect(res.page).toBe(1);
  });

  it('should throw error with page number equal to 0', function () {
    const qs = 'page=0';
    expect(() => parse(qs)).toThrow();
  });

  it('should throw error with negative page number ', function () {
    const qs = 'page=-1';
    expect(() => parse(qs)).toThrow();
  });

  it('should throw error with page as array', function () {
    expect(() => parse('page=0&page=1')).toThrow();
  });

  it('shoud throw error with page as a non numeric string', () => {
    expect(() => parse('page=abc')).toThrow();
  });

  it('should set page to 1 when pageSize is sent and page dont', function () {
    expect(parse('pageSize=10').page).toBe(1);
  });

  it('should parse page size when number is greater than 0', function () {
    const qs = 'pageSize=10';
    expect(parse(qs).pageSize).toBe(10);
  });

  it('should throw error with negative page size', function () {
    const qs = 'pageSize=-1';
    expect(() => parse(qs)).toThrow();
  });

  it('should throw error with page size equal to 0', function () {
    const qs = 'pageSize=0';
    expect(() => parse(qs)).toThrow();
  });

  it('should throw error with array pagesize', function () {
    const qs = 'pageSize=0&pageSize=10';
    expect(() => parse(qs)).toThrow();
  });

  it('should throw error with string pagesize', function () {
    const qs = 'pageSize=aaa';
    expect(() => parse(qs)).toThrow();
  });

  it('should be possible to set page and pageSize', function () {
    const qs = 'page=10&pageSize=100';
    const res = parse(qs);
    expect(res.page).toBe(10);
    expect(res.pageSize).toBe(100);
  });
});

describe('include', () => {
  it('should parse include with string', function () {
    const qs = 'include=a';
    expect(parse(qs).include).toStrictEqual(['a']);
  });

  it('should parse include with array of strings', function () {
    const qs = 'include=a&include=b';
    expect(parse(qs).include).toStrictEqual(['a', 'b']);
  });

  it('should ignore empty strings', () => {
    let qs = 'include=';
    expect(parse(qs).include).toStrictEqual([]);

    qs = 'include=a&include=&include=b';
    expect(parse(qs).include).toStrictEqual(['a', 'b']);
  });

  it('should use default include when is not present in url', () => {
    const qs = '';
    expect(parse(qs, { defaults: { include: ['a'] } }).include).toStrictEqual(['a']);
  });

  it('should override default include when is present in url', function () {
    const qs = 'include=b';
    expect(parse(qs, { defaults: { include: ['a'] } }).include).toStrictEqual(['b']);
  });
});

describe('attributes', function () {
  it('should parse attributes with string', function () {
    const qs = 'attributes=a';
    expect(parse(qs).attributes).toStrictEqual(['a']);
  });

  it('should parse attributes with array of strings', function () {
    const qs = 'attributes=a&attributes=b';
    expect(parse(qs).attributes).toStrictEqual(['a', 'b']);
  });

  it('should ignore empty strings', () => {
    let qs = 'attributes=';
    expect(parse(qs).attributes).toStrictEqual([]);

    qs = 'attributes=a&attributes=&attributes=b';
    expect(parse(qs).attributes).toStrictEqual(['a', 'b']);
  });

  it('should use default attributes when is not present in url', () => {
    const qs = '';
    expect(parse(qs, { defaults: { attributes: ['a'] } }).attributes).toStrictEqual(['a']);
  });

  it('should override default attributes when is present in url', function () {
    const qs = 'attributes=b';
    expect(parse(qs, { defaults: { attributes: ['a'] } }).attributes).toStrictEqual(['b']);
  });
});

describe('sort', function () {
  it('should parse sort with string and ASC direction by default', function () {
    const qs = 'sort=a';
    expect(parse(qs).sort).toStrictEqual([{
      field: 'a',
      direction: SORT_DIRECTION.ASC,
    }]);
  });

  it('should use sort direction DESC when value is prefixed with -', function () {
    const qs = 'sort=-a';
    expect(parse(qs).sort).toStrictEqual([{
      field: 'a',
      direction: SORT_DIRECTION.DESC,
    }]);
  });

  it('should parse sort with array of strings', function () {
    const qs = 'sort=a&sort=-b';
    expect(parse(qs).sort).toStrictEqual([
      { field: 'a', direction: SORT_DIRECTION.ASC },
      { field: 'b', direction: SORT_DIRECTION.DESC },
    ]);
  });

  it('should ignore empty strings', () => {
    let qs = 'sort=';
    expect(parse(qs).sort).toStrictEqual([]);

    qs = 'sort=a&sort=&sort=-b';
    expect(parse(qs).sort).toStrictEqual([
      { field: 'a', direction: SORT_DIRECTION.ASC },
      { field: 'b', direction: SORT_DIRECTION.DESC },
    ]);
  });

  it('should use default sort when is not present in url', () => {
    const qs = '';
    expect(parse(qs, { defaults: { sort: [{ field: 'a', direction: SORT_DIRECTION.DESC }] } }).sort)
      .toStrictEqual([{ field: 'a', direction: SORT_DIRECTION.DESC }]);
  });

  it('should override default sort when is present in url', function () {
    const qs = 'sort=b';
    expect(parse(qs, { defaults: { sort: [{ field: 'a', direction: SORT_DIRECTION.DESC }] } }).sort)
      .toStrictEqual([{ field: 'b', direction: SORT_DIRECTION.ASC }]);
  });
});

describe('filters', () => {
  it('should ignore keywords as filters', function () {
    const qs = stringify({
      page: 1,
      pageSize: 10,
      q: 'borboleta',
      sort: 'name',
      attributes: 'name',
    });

    const res = parse(qs);
    expect(res.filters).toStrictEqual({});
  });

  it('should parse single filter with single value', function () {
    const qs = 'name=maria';
    const res = parse(qs);
    expect(res.filters).toStrictEqual({
      name: 'maria'
    });
  });

  it('should parse single filter with multiple values', function () {
    const qs = 'name=maria&name=jose';
    const res = parse(qs);
    expect(res.filters).toStrictEqual({
      name: ['maria', 'jose']
    });
  });

  it('should parse multiple filters', function () {
    const qs = 'name=maria&name=jose&age=5';
    const res = parse(qs);
    expect(res.filters).toStrictEqual({
      name: ['maria', 'jose'],
      age: '5',
    });
  });

  it('should parse greater than', function () {
    const qs = 'age[GT]=10';
    const res = parse(qs);
    expect(res.filters).toStrictEqual({
      age: {
        [FILTERS_OPERATORS.GREATER_THAN]: '10',
      }
    });
  });

  it('should parse greater than or equal', () => {
    const qs = 'age[GTE]=10';
    const res = parse(qs);
    expect(res.filters).toStrictEqual({
      age: {
        [FILTERS_OPERATORS.GREATER_THAN_EQUALS]: '10',
      }
    });
  });

  it('should parse less than', function () {
    const qs = 'age[LT]=10';
    const res = parse(qs);
    expect(res.filters).toStrictEqual({
      age: {
        [FILTERS_OPERATORS.LESS_THAN]: '10',
      }
    });
  });

  it('should parse less than or equal', () => {
    const qs = 'age[LTE]=10';
    const res = parse(qs);
    expect(res.filters).toStrictEqual({
      age: {
        [FILTERS_OPERATORS.LESS_THAN_EQUALS]: '10',
      }
    });
  });

  it('should parse range filter', function () {
    const qs = 'age[GTE]=10&age[LT]=20';
    const res = parse(qs);
    expect(res.filters).toStrictEqual({
      age: {
        [FILTERS_OPERATORS.GREATER_THAN_EQUALS]: '10',
        [FILTERS_OPERATORS.LESS_THAN]: '20',
      }
    });
  });

  it('should throw error if less than receives array', function () {
    const qs = 'age[LT]=10&age[LT]=20';
    expect(() => parse(qs)).toThrow();
  });

  it('should throw error if less than equal receives array', function () {
    const qs = 'age[LTE]=10&age[LTE]=20';
    expect(() => parse(qs)).toThrow();
  });

  it('should throw error if greater than receives array', function () {
    const qs = 'age[GT]=10&age[GT]=20';
    expect(() => parse(qs)).toThrow();
  });

  it('should throw error if greater than equal receives array', function () {
    const qs = 'age[GTE]=10&age[GTE]=20';
    expect(() => parse(qs)).toThrow();
  });

  it('should parse negative filter', function () {
    const qs = 'age[NOT]=10';
    const res = parse(qs);
    expect(res.filters).toStrictEqual({
      age: {
        [FILTERS_OPERATORS.NOT]: '10'
      }
    });
  });

  it('should parse multiple negative filter', function () {
    const qs = 'age[NOT]=10&age[NOT]=12';
    const res = parse(qs);
    expect(res.filters).toStrictEqual({
      age: {
        [FILTERS_OPERATORS.NOT]: ['10', '12']
      }
    });
  });
});
