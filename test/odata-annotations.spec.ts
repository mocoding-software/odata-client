import { FetchMock } from "./fetch-mock";
import { oData, Entity, ODataAnnotations } from "../src";

describe("OData Annotations Test", () => {
  const mock = new FetchMock();
  const o = oData({ baseUrl: "/odata", http: mock });
  const testEntity = o<Entity>("entity");
  test("System Annotations Test", async () => {
    const expected = {
      "$odata.context": "test1",
      "$odata.metadataEtag": "test2",
      id: "test3",
    };
    mock.mock201("/odata/entity/0", expected);
    const actual = await testEntity.get("0");
    expect(actual.id).toBe(expected.id);
    expect(actual.$odata.context).toBe(expected["$odata.context"]);
    expect(actual.$odata.metadataEtag).toBe(expected["$odata.metadataEtag"]);
    // verify it was actually removed.
    const dict = (actual as unknown) as { [key: string]: string | undefined };
    expect(dict["$odata.context"]).toBeUndefined();
    expect(dict["$odata.metadataEtag"]).toBeUndefined();
  });

  test("Custom Annotations Test", async () => {
    const expected = {
      "com.contoso": "test1",
      id: "test3",
    };
    mock.mock201("/odata/entity/0", expected);
    const actual = await testEntity.get("0");
    expect(actual.id).toBe(expected.id);
    expect(actual.$odata["com.contoso"]).toBe(expected["com.contoso"]);
    // verify it was actually removed.
    const dict = (actual as unknown) as { [key: string]: string | undefined };
    expect(dict["com.contoso"]).toBeUndefined();
  });

  test("Scoped Annotations Test", async () => {
    const expected = {
      "Orders@odata.context": "test1",
      "Orders@com.contoso": "test2",
      id: "test3",
    };
    mock.mock201("/odata/entity/0", expected);
    const actual = await testEntity.get("0");
    expect(actual.id).toBe(expected.id);
    const annotations = actual.$odata["Orders"] as ODataAnnotations;
    expect(annotations.context).toBe(expected["Orders@odata.context"]);
    expect(annotations["com.contoso"]).toBe(expected["Orders@com.contoso"]);
    // verify it was actually removed.
    const dict = (actual as unknown) as { [key: string]: string | undefined };
    expect(dict["Orders@odata.context"]).toBeUndefined();
    expect(dict["Orders@com.contoso"]).toBeUndefined();
  });

  test("Not Supported Annotations Test", async () => {
    const expected = {
      "com.contoso.property": "test1",
      "@Orders@com.contoso": "test2",
      id: "test3",
    };
    mock.mock201("/odata/entity/0", expected);
    const actual = await testEntity.get("0");
    expect(actual.id).toBe(expected.id);
    expect(actual.$odata["com.contoso.property"]).toBe(expected["com.contoso.property"]);
    expect(actual.$odata["@Orders@com.contoso"]).toBe(expected["@Orders@com.contoso"]);
  });
});
