import { FetchMock } from "./fetch-mock";
import { oData, Entity } from "../src";

describe("OData Query Test", () => {
  const mock = new FetchMock();
  const o = oData({ baseUrl: "/odata", http: mock });
  const testEntity = o<Entity>("entity");
  const expectedPayload = {
    value: [
      {
        id: "0",
      },
    ],
  };
  test("Select Test", async () => {
    mock.mock200("/odata/entity?$select=id", expectedPayload);
    const actualPayload = await testEntity.query((_) => _.select("id"));
    expect(actualPayload.length).toBe(1);
  });
  test("Expand Test", async () => {
    mock.mock200("/odata/entity?$expand=id", expectedPayload);
    const actualPayload = await testEntity.query((_) => _.expand("id"));
    expect(actualPayload.length).toBe(1);
  });
  test("Top Test", async () => {
    mock.mock200("/odata/entity?$top=1", expectedPayload);
    const actualPayload = await testEntity.query((_) => _.top(1));
    expect(actualPayload.length).toBe(1);
  });
  test("Skip Test", async () => {
    mock.mock200("/odata/entity?$skip=1", expectedPayload);
    const actualPayload = await testEntity.query((_) => _.skip(1));
    expect(actualPayload.length).toBe(1);
  });
  test("OrderBy Test", async () => {
    mock.mock200("/odata/entity?$orderBy=test%20asc", expectedPayload);
    const actualPayload = await testEntity.query((_) => _.orderBy("test asc"));
    expect(actualPayload.length).toBe(1);
  });
  test("Filter Test", async () => {
    mock.mock200("/odata/entity?$filter=test", expectedPayload);
    const actualPayload = await testEntity.query((_) => _.filter("test"));
    expect(actualPayload.length).toBe(1);
  });
  test("Count Test", async () => {
    mock.mock200("/odata/entity?$count=true", expectedPayload);
    const actualPayload = await testEntity.query((_) => _.count());
    expect(actualPayload.length).toBe(1);
  });

  test("Custom Test", async () => {
    mock.mock200("/odata/entity?custom=test", expectedPayload);
    const actualPayload = await testEntity.query((_) => _.custom("custom", "test"));
    expect(actualPayload.length).toBe(1);
  });

  test("Duplicate Param Test", async () => {
    mock.mock200("/odata/entity?$count=false", expectedPayload);
    const actualPayload = await testEntity.query((_) =>
      _.count().custom("$count", "false"),
    );
    expect(actualPayload.length).toBe(1);
  });

  test("Null Param Test", async () => {
    mock.mock200("/odata/entity", expectedPayload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actualPayload = await testEntity.query((_) => _.custom("", <any>null));
    expect(actualPayload.length).toBe(1);
  });

  test("Count Query Test", async () => {
    mock.mock200("/odata/entity/$count?$filter=test", "100");
    const actualPayload = await testEntity.count((_) => _.filter("test"));
    expect(actualPayload).toBe(100);
  });
});
