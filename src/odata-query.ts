import { ODataQueryParams, ODataQuery, ODataCountQuery } from "./odata";

export class ODataQueryWrapper<T> implements ODataQuery<T>, ODataCountQuery<T> {
  private query: ODataQueryParams = {};

  public select(...properties: string[]): ODataQuery<T> {
    this.query.$select = properties.join(",");
    return this;
  }

  public expand(...properties: string[]): ODataQuery<T> {
    this.query.$expand = properties.join(",");
    return this;
  }

  // public compute(compute: string): ODataQuery<T> {
  //   throw new Error("Method not implemented.");
  // }

  public top(quantity: number): ODataQuery<T> {
    this.query.$top = quantity;
    return this;
  }
  public skip(quantity: number): ODataQuery<T> {
    this.query.$skip = quantity;
    return this;
  }

  public orderBy(orderBy: string): ODataQuery<T> {
    this.query.$orderBy = orderBy;
    return this;
  }

  public filter(filter: string): ODataQuery<T> {
    this.query.$filter = filter;
    return this;
  }

  // public search(search: string): ODataQuery<T> {
  //   throw new Error("Method not implemented.");
  // }

  public count(include = true): ODataQuery<T> {
    this.query.$count = include;
    return this;
  }

  // public format(format: string): ODataQuery<T> {
  //   throw new Error("Method not implemented.");
  // }

  public custom(key: string, value: string): ODataQuery<T> {
    this.query[key] = value;
    return this;
  }

  public get(): string {
    const paramsDict: string[] = [];
    for (const key in this.query) {
      if (Object.prototype.hasOwnProperty.call(this.query, key)) {
        const value = encodeURIComponent(this.query[key]?.toString() ?? "");
        if (key) paramsDict.push(`${key}=${value}`);
      }
    }
    const str = paramsDict.join("&");
    return str ? "?" + str : "";
  }
}
