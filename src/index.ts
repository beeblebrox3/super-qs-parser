import { pick, omit, isPlainObject, isString, isArray } from 'lodash';
import qs from 'qs';
import { FilterError, PaginationError } from './errors';

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export enum FILTERS_OPERATORS {
  GREATER_THAN = 'GT',
  GREATER_THAN_EQUALS = 'GTE',
  LESS_THAN = 'LT',
  LESS_THAN_EQUALS = 'LTE',
  NOT = 'NOT',
}

export enum SORT_DIRECTION {
  ASC = 'ASC',
  DESC = 'DESC',
}

const isArrayOfStringsOrNumbers = function (value: any) {
  if (!isArray(value)) return false;
  return value.every(v => isString(v) || isNumeric(v));
};

const checkIfFilterValueIsAComplexQuery = function (value: Record<string, any>) {
  const allowedProps = Object.values(FILTERS_OPERATORS) as string[];
  const allOptionsAreValid = Object.keys(value).every((key) => {
    if (!allowedProps.includes(key)) return false;
    if (typeof value[key] === 'string') return true;
    if (typeof value[key] === 'number') return true;

    // only NOT filter accepts multiple values
    if (Array.isArray(value[key]) && key === FILTERS_OPERATORS.NOT.toString()) return true;

    return false;
  });

  if (allOptionsAreValid) {
    return true;
  }

  throw new FilterError();
};

const parseComplexFilters = (filters: Record<string, any>) => {

  return Object.keys(filters).reduce((res, key) => {
    const value = filters[key] || {};
    const isObject = isPlainObject(value);

    if (isObject && checkIfFilterValueIsAComplexQuery(value as Record<string, any>)) {
      res[key] = value;
    } else if (isString(value) || isNumeric(value) || isArrayOfStringsOrNumbers(value)) {
      res[key] = value;
    }

    return res;
  }, {} as Record<string, any>);
};

function isNumeric(value: any) {
  if (typeof value === 'number') return true;
  // @ts-ignore this comparison is intentional because '1aa' === 1 and '1aa' != 1
  return typeof value === 'string' && value == +value && value !== '';
}

function isInteger(value: any) {
  if (!isNumeric(value)) return false;
  return (value | 0) == value;
}

function getPositiveIntegerParameter(
  inputFieldName: string,
  outputFieldName: 'page' | 'pageSize',
  parsedQuery: Record<string, any>,
  options: SearchQueryExtractorOptions
): number | null {
  const sentValue = parsedQuery[inputFieldName];
  const defaultValue = options?.defaults?.[outputFieldName] || null;

  if ((sentValue === '' || sentValue === undefined) && isInteger(defaultValue)) {
    return defaultValue;
  }

  if (sentValue === '' || sentValue === undefined) {
    return null;
  }

  if (!isInteger(sentValue)) {
    throw new PaginationError(`${inputFieldName} must be an integer`);
  }

  const sentValueAsNumber = +sentValue;
  if (sentValueAsNumber < 1) {
    throw new PaginationError(`${inputFieldName} must be an integer greater than 0`);
  }

  return sentValueAsNumber;
}

function getStringParameter(
  inputFieldName: string,
  outputFieldName: 'attributes' | 'include',
  parsedQuery: Record<string, any>,
  options: SearchQueryExtractorOptions,
): string[] {
  const sentValue = parsedQuery[inputFieldName];
  const defaultValue = options?.defaults?.[outputFieldName] || [];

  if (sentValue === undefined || sentValue === null) {
    return defaultValue;
  }

  return asArray<string>(sentValue as string).filter(v => !!v);
}

function getPaginationDetails(
  parsedQuerystring: Record<string, any>,
  options: SearchQueryExtractorOptions
): { page: number | null, pageSize: number | null } {
  const pageSize = getPositiveIntegerParameter('pageSize', 'pageSize', parsedQuerystring, options);
  let page = getPositiveIntegerParameter('page', 'page', parsedQuerystring, options);

  if (page === null && pageSize !== null) {
    page = 1;
  }

  return { page, pageSize };
}

function getSortDetails(parsedQueryString: Record<string, any>, options: SearchQueryExtractorOptions): SortConfig[] {
  const sentValue = parsedQueryString.sort;
  const defaultValue = options?.defaults?.sort || [];

  if (sentValue === undefined || sentValue === null) {
    return defaultValue;
  }

  return asArray<string>(sentValue as string)
    .filter(v => !!v)
    .map(sortString => ({
      field: sortString.replace(/^-+/, ''),
      direction: sortString.startsWith('-') ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC,
    }));
}

export function parse(queryString: string, options: SearchQueryExtractorOptions = {}) {
  const parsedQuerystring = qs.parse(queryString);

  const { page, pageSize } = getPaginationDetails(parsedQuerystring, options);

  let filters = omit(parsedQuerystring, ['page', 'pageSize', 'sort', 'q', 'include', 'attributes']) || {};
  if (options?.defaults?.filters) {
    filters = { ...options.defaults.filters, ...filters };
  }
  filters = parseComplexFilters(filters);

  const args = {
    page,
    pageSize,
    q: (<string>parsedQuerystring.q || (options?.defaults?.q || '')).trim(),
    filters,
    include: getStringParameter('include', 'include', parsedQuerystring, options),
    attributes: getStringParameter('attributes', 'attributes', parsedQuerystring, options),
    sort: getSortDetails(parsedQuerystring, options),
  };

  return {
    ...pick(args, ['q', 'filters', 'include', 'sort', 'attributes']),
    page: args.page,
    pageSize: args.pageSize,
  };
}


export interface SearchQueryExtractorOptions {
  defaults?: Partial<SearchQueryExtractorResponse>
}

interface SortConfig {
  field: string;
  direction: string;
}

export interface SearchQueryExtractorResponse {
  page: number | null;
  pageSize: number;
  q: string;
  filters: object;
  include: string[];
  attributes: string[];
  sort: SortConfig[];
}
