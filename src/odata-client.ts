import { Entity, ODataOperations, ODataConfig, ODataResponse, Predicate, CountPredicate } from "odata";
import { ODataQueryWrapper } from "./odata-query";

export class ODataClient<T extends Entity> implements ODataOperations<T> {
  private url: string;

  constructor(private config: ODataConfig, private resource: string) {
    this.url = `${this.config.baseUrl}/${this.resource}`;
  }

  public add(entity: T): Promise<ODataResponse<T>> {
    const options: RequestInit = this.prepareEntityRequest("POST", entity);
    return this.fetch(this.url, options);
  }

  public update(entity: T): Promise<ODataResponse<T>> {
    const options: RequestInit = this.prepareEntityRequest("PUT", entity);
    return this.fetch(this.url, options);
  }

  public async patch(entityId: string, entity: Partial<T>): Promise<void> {
    const url = `${this.url}/${entityId}`;
    const options: RequestInit = this.prepareEntityRequest("PATCH", entity);
    await this.config.http.fetch(url, options);
  }

  public async delete(entityId: string): Promise<void> {
    const url = `${this.url}/${entityId}`;

    const options: RequestInit = {
      method: "DELETE",
    };

    await this.config.http.fetch(url, options);
  }

  public get(entityId: string): Promise<ODataResponse<T>> {
    const url = `${this.url}/${entityId}`;
    const options: RequestInit = this.prepareEntityRequest("GET");
    return this.fetch(url, options);
  }

  query(predicate?: Predicate<T> | void): Promise<ODataResponse<T[]>> {
    let url = this.url;
    if (predicate) {
      const query = new ODataQueryWrapper();
      predicate(query);
      url += query.get();
    }
    const options = this.prepareEntityRequest("GET");
    return this.fetch(url, options);
  }
  public async count(predicate?: CountPredicate<T> | void): Promise<number> {
    let url = `${this.url}/$count`;
    if (predicate) {
      const query = new ODataQueryWrapper();
      predicate(query);
      url += query.get();
    }
    const options = this.prepareEntityRequest("GET");
    const response = await this.config.http.fetch(url, options);
    return parseInt(await response.text());
  }

  private async parse<K>(response: Response): Promise<ODataResponse<K>> {
    const text = await response.text();
    const parsed = JSON.parse(text, this.config.jsonParseReviver);

    return {
      value: parsed.value,
      annotations: {},
    };
  }

  private prepareEntityRequest<TEntity>(method: string, entity: TEntity | undefined = undefined): RequestInit {
    const body = entity ? JSON.stringify(entity) : undefined;
    const options: RequestInit = {
      body,
      method,
      headers: new Headers({
        "Content-Type": this.config.defaultContentType,
      }),
    };
    return options;
  }

  private async fetch<K>(url: string, options: RequestInit): Promise<ODataResponse<K>> {
    const response = await this.config.http.fetch(url, options);
    return await this.parse(response);
  }
}
