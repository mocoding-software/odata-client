import {
  Entity,
  ODataOperations,
  ODataConfig,
  Predicate,
  CountPredicate,
  Annotated,
  ODataError,
} from "odata";
import { ODataQueryWrapper } from "odata-query";
import { getAnnotations } from "odata-annotations";

export class ODataClient<T extends Entity> implements ODataOperations<T> {
  private url: string;

  constructor(private config: ODataConfig, private resource: string) {
    this.url = `${this.config.baseUrl}/${this.resource}`;
  }

  public add(entity: T): Promise<Annotated<T>> {
    const options: RequestInit = this.prepareEntityRequest("POST", entity);
    return this.fetchAnnotated(this.url, options);
  }

  public update(entity: T): Promise<Annotated<T>> {
    const options: RequestInit = this.prepareEntityRequest("PUT", entity);
    return this.fetchAnnotated(this.url, options);
  }

  public async patch(entityId: string, entity: Partial<T>): Promise<void> {
    const url = `${this.url}/${entityId}`;
    const options: RequestInit = this.prepareEntityRequest("PATCH", entity);
    const response = await this.config.http.fetch(url, options);
    this.processResponse(response);
  }

  public async delete(entityId: string): Promise<void> {
    const url = `${this.url}/${entityId}`;

    const options: RequestInit = {
      method: "DELETE",
    };

    await this.config.http.fetch(url, options);
  }

  public get(entityId: string): Promise<Annotated<T>> {
    const url = `${this.url}/${entityId}`;
    const options: RequestInit = this.prepareEntityRequest("GET");
    return this.fetchAnnotated(url, options);
  }

  query(predicate?: Predicate<T> | void): Promise<Annotated<T[]>> {
    let url = this.url;
    if (predicate) {
      const query = new ODataQueryWrapper();
      predicate(query);
      url += query.get();
    }
    const options = this.prepareEntityRequest("GET");
    return this.fetchAnnotated(url, options, "value");
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

  private async processResponse(response: Response): Promise<string> {
    if (response.ok) {
      return response.status !== 204 ? await response.text() : "";
    }

    const content = await response.text();

    if (content) {
      const error = JSON.parse(content);
      throw new ODataError(error);
    }

    throw new Error(response.statusText);
  }

  private prepareEntityRequest<TEntity>(
    method: string,
    entity: TEntity | undefined = undefined,
  ): RequestInit {
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

  private async fetchAnnotated<K>(
    url: string,
    options: RequestInit,
    fragment: string | undefined = undefined,
  ): Promise<Annotated<K>> {
    const response = await this.config.http.fetch(url, options);
    const text = await this.processResponse(response);
    const parsed = JSON.parse(text, this.config.jsonParseReviver);

    const result: Annotated<K> = fragment ? parsed[fragment] : parsed;
    result.$odata = getAnnotations(parsed);
    return result;
  }
}
