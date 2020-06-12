import {
  Entity,
  ODataOperations,
  ODataConfig,
  Predicate,
  CountPredicate,
  ODataAnnotations,
  Annotated,
  ODataError,
} from "odata";
import { ODataQueryWrapper } from "odata-query";

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

  private async fetchAnnotated<K>(
    url: string,
    options: RequestInit,
    fragment: string | undefined = undefined,
  ): Promise<Annotated<K>> {
    const response = await this.config.http.fetch(url, options);
    const text = await this.processResponse(response);
    const parsed = JSON.parse(text, this.config.jsonParseReviver);

    const result: Annotated<K> = fragment ? parsed[fragment] : parsed;
    result.$odata = this.getAnnotations(parsed);
    return result;
  }

  /*
   * http://docs.oasis-open.org/odata/odata-json-format/v4.0/os/odata-json-format-v4.0-os.html#_Instance_Annotations
   * Annotations are name/value pairs that have a dot (.) as part of the name.
   * @odata.context - system annotations (supported)
   * @com.contoso - custom annotation
   * com.contoso - also valid custom annotation
   * Orders@odata.context - scoped system annotations
   * Orders@com.contoso - scoped custom annotations
   */
  private getAnnotations<K extends { [key: string]: string }>(obj: K): ODataAnnotations {
    const annotations: ODataAnnotations = {};
    const receivedKeys = Object.getOwnPropertyNames(obj);
    const defaultNamespace = "odata";
    const namespaceDelimiter = ".";
    const propertyDelimiter = "@";
    const getSubContainer = (subKey: string) => {
      if (!annotations[subKey]) annotations[subKey] = {};
      return annotations[subKey] as ODataAnnotations;
    };
    for (const key of receivedKeys) {
      const parts = key.split(namespaceDelimiter);
      if (parts.length <= 1)
        // not an annotation. Should contain '.' (dot)
        continue;

      // at this point it is defintely annotation so delete it from original object
      delete obj[key];

      const prefix = parts[0]; // get left part and split it
      const prefixParts = prefix.split(propertyDelimiter).filter((_) => _);

      // Annotation in the form of @Orders@com.contoso is not supported
      // It will be added to root annotation object as is
      if (prefixParts.length > 2) {
        annotations[key] = obj[key];
        continue;
      }

      // at this point prefixParts.length is 1 or 2
      const namespace = prefixParts[prefixParts.length - 1];
      const container = prefixParts.length === 1 ? annotations : getSubContainer(prefixParts[0]);

      // multiple dots considered custom annotation and will be added as is preserving the namespace
      let annotationKey = parts.length == 2 ? parts[1] : parts.slice(1).join(".");
      if (namespace !== defaultNamespace) annotationKey = `${namespace}.${annotationKey}`;

      // set annotation
      container[annotationKey] = obj[key];
    }

    return annotations;
  }
}
