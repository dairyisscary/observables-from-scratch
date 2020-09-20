import { create } from "observable";

test("can create observables!", () => {
  expect(create()).toEqual({});
});
