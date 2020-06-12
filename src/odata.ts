export interface Entity {
  id: string;
}

export interface ODataAnnotations {
  context?: string;
  metadataEtag?: string;
  type?: string;
  count?: string;
  nextLink?: string;
  deltaLink?: string;
  id?: string;
  editLink?: string;
  readLink?: string;
  etag?: string;
  navigationLink?: string;
  associationLink?: string;
  mediaEditLink?: string;
  mediaReadLink?: string;
  mediaContentType?: string;
  [key: string]: string | undefined | ODataAnnotations;
}

export interface ODataErrorResponse {
  error: ODataErrorInfo;
}

export interface ODataErrorInfo extends ODataErrorDetails {
  code: string;
  message: string;
  target: string;
  details: [ODataErrorDetails];
  innererror: { [key: string]: unknown };
}

export interface ODataErrorDetails {
  code: string;
  target: string;
  message: string;
}

interface Annotations {
  $odata: ODataAnnotations;
}

export type Annotated<T> = T & Annotations;

export interface ODataConfig {
  baseUrl: string;
  http: { fetch(url: RequestInfo, init?: RequestInit): Promise<Response> };
  jsonParseReviver: (<T, K>(key: string, value: T) => K) | undefined;
  defaultContentType: string;
}

export interface DataContext {
  <T extends Entity>(resource: string): ODataOperations<T>;
}

export interface ODataOperations<T extends Entity> {
  add: (entity: T) => Promise<Annotated<T>>;
  update: (entity: T) => Promise<Annotated<T>>;
  patch(entityId: string, entity: Partial<T>): Promise<void>;
  delete: (entityId: string) => Promise<void>;
  get: (entityId: string) => Promise<Annotated<T>>;
  query: (predicate?: Predicate<T>) => Promise<Annotated<T[]>>;
  count: (predicate?: CountPredicate<T>) => Promise<number>;
}

export interface ODataCountQuery<T> {
  filter(filter: string): ODataCountQuery<T>;
  // search(search: string): ODataCountQuery<T>; // not supported
}

export interface ODataQuery<T> {
  // single entity
  select(...properties: string[]): ODataQuery<T>;
  expand(...properties: string[]): ODataQuery<T>;
  // compute(compute: string): ODataQuery<T>; // not supported

  // collection
  top(quantity: number): ODataQuery<T>;
  skip(quantity: number): ODataQuery<T>;
  orderBy(orderBy: string): ODataQuery<T>;
  filter(filter: string): ODataQuery<T>;
  // search(search: string): ODataQuery<T>; // not supported
  count(include?: boolean): ODataQuery<T>;

  // format(format: string): ODataQuery<T>; // not supported

  custom(key: string, value: string): ODataQuery<T>;
}

export interface ODataQueryParams {
  $filter?: string;
  $orderby?: string;
  $expand?: string;
  $select?: string;

  $skip?: number;
  $top?: number;
  $count?: boolean;
  // $search?: string; // not supported
  $format?: string;
  // $compute?: string; // not supported
  // $index?: number; // not supported
  [key: string]: string | number | boolean | undefined;
}

export type Predicate<T> = (parameters: ODataQuery<T>) => ODataQuery<T>;
export type CountPredicate<T> = (parameters: ODataCountQuery<T>) => ODataCountQuery<T>;

export class ODataError extends Error {
  /**
   *
   */
  constructor(public error: ODataErrorInfo) {
    super(error.message);
  }
}
