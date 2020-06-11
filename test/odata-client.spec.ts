import { FetchMock } from "./fetch-mock";
import { oData, Entity } from "../src";

describe("OData Client Test", () => {
  const mock = new FetchMock();
  const o = oData({ baseUrl: "/odata", http: mock });
  const testEntity = o<Entity>("entity");
  const expectedPayload = {
    id: "0",
  };
  test("Add Entity", async () => {
    mock.mock201("/odata/entity", expectedPayload);
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("POST");
    });
    const actualPayload = await testEntity.add(expectedPayload);
    expect(actualPayload.value.id).toBe(expectedPayload.id);
  });

  test("Get Entity", async () => {
    mock.mock200("/odata/entity/0", expectedPayload);
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("GET");
    });
    const actualPayload = await testEntity.get("0");
    expect(actualPayload.value.id).toBe(expectedPayload.id);
  });

  test("Update Entity", async () => {
    mock.mock200("/odata/entity", expectedPayload);
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("PUT");
    });
    const actualPayload = await testEntity.update(expectedPayload);
    expect(actualPayload.value.id).toBe(expectedPayload.id);
  });

  test("Patch Entity", async () => {
    mock.mock204("/odata/entity/0");
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("PATCH");
    });
    await testEntity.patch("0", {});
  });

  test("Delete Entity", async () => {
    mock.mock204("/odata/entity/0");
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("DELETE");
    });
    await testEntity.delete("0");
  });

  test("Get Entities", async () => {
    mock.mock200("/odata/entity", [expectedPayload]);
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("GET");
    });
    const actualPayload = await testEntity.query();
    expect(actualPayload.value.length).toBe(1);
    expect(actualPayload.value[0].id).toBe(expectedPayload.id);
  });

  test("Get Count", async () => {
    mock.mock200("/odata/entity/$count");
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("GET");
    });
    const count = await testEntity.count();
    expect(count).toBe(0);
  });
});
