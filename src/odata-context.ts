import { DataContext, Entity, ODataConfig } from "../src/odata";
import { ODataClient } from "../src/odata-client";

export function oData(config: Partial<ODataConfig>): DataContext {
  const odataConfig: ODataConfig = {
    baseUrl: config.baseUrl ?? "",
    http: config.http ? config.http : <never>window,
    jsonParseReviver: config.jsonParseReviver,
    defaultContentType:
      config.defaultContentType ?? "application/json; odata.metadata=minimal",
  };

  return <T extends Entity>(resource: string) =>
    new ODataClient<T>(odataConfig, resource);
}
