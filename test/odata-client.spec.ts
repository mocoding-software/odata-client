import { FetchMock } from "./fetch-mock";
import { oData, Entity, ODataError } from "../src";

describe("OData Client Tests", () => {
  const mock = new FetchMock();
  const o = oData({ baseUrl: "/odata", http: mock });
  const testEntity = o<Entity>("entity");
  const expectedPayload = {
    id: "0",
  };
  test("Add Entity Test", async () => {
    mock.mock201("/odata/entity", expectedPayload);
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("POST");
    });
    const actualPayload = await testEntity.add(expectedPayload);
    expect(actualPayload.id).toBe(expectedPayload.id);
  });

  test("Get Entity Test", async () => {
    mock.mock200("/odata/entity/0", expectedPayload);
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("GET");
    });
    const actualPayload = await testEntity.get("0");
    expect(actualPayload.id).toBe(expectedPayload.id);
  });

  test("Update Entity Test", async () => {
    mock.mock200("/odata/entity", expectedPayload);
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("PUT");
    });
    const actualPayload = await testEntity.update(expectedPayload);
    expect(actualPayload.id).toBe(expectedPayload.id);
  });

  test("Patch Entity Test", async () => {
    mock.mock204("/odata/entity/0");
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("PATCH");
    });
    await testEntity.patch("0", {});
  });

  test("Delete Entity Test", async () => {
    mock.mock204("/odata/entity/0");
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("DELETE");
    });
    await testEntity.delete("0");
  });

  test("Get Entities Test", async () => {
    mock.mock200("/odata/entity", { value: [expectedPayload] });
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("GET");
    });
    const actualPayload = await testEntity.query();
    expect(actualPayload.length).toBe(1);
    expect(actualPayload[0].id).toBe(expectedPayload.id);
  });

  test("Get Count Test", async () => {
    mock.mock200("/odata/entity/$count", "100");
    mock.assertRequest((url, init) => {
      expect(init?.method).toBe("GET");
    });
    const count = await testEntity.count();
    expect(count).toBe(100);
  });

  test("OData Error Test", () => {
    const errorPayload = {
      error: {
        code: "400",
        message: "Malformed",
      },
    };
    mock.assertRequest(undefined);
    mock.mock400("/odata/entity", errorPayload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testMethod = async () => await testEntity.add({} as any);
    expect(testMethod).rejects.toThrow(ODataError);
  });

  test("OData Error Test", () => {
    mock.assertRequest(undefined);
    mock.mock500("/odata/entity");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testMethod = async () => await testEntity.add({} as any);
    expect(testMethod).rejects.toThrow(Error);
  });
});
