import { map, filter, startWith, take, delay } from "operators";
import { of } from "observable";
import { toAsyncArray } from "./helpers";

const basicObservable = of(5, 4, 3, 2, 1);

test("map", async () => {
  const addOneObservable = basicObservable.pipe(map((num) => num + 1));
  expect(await toAsyncArray(addOneObservable)).toEqual([6, 5, 4, 3, 2]);

  const subOneObservable = basicObservable.pipe(map((num) => num - 1));
  expect(await toAsyncArray(subOneObservable)).toEqual([4, 3, 2, 1, 0]);
});

test("filter", async () => {
  const evenObservable = basicObservable.pipe(filter((num) => num % 2 === 0));
  expect(await toAsyncArray(evenObservable)).toEqual([4, 2]);

  const emptyObservable = basicObservable.pipe(filter(() => false));
  expect(await toAsyncArray(emptyObservable)).toEqual([]);
});

test("startWith", async () => {
  const beginWithNegOne = basicObservable.pipe(startWith(-1));
  expect(await toAsyncArray(beginWithNegOne)).toEqual([-1, 5, 4, 3, 2, 1]);

  const twoNegOnes = beginWithNegOne.pipe(startWith(-1));
  expect(await toAsyncArray(twoNegOnes)).toEqual([-1, -1, 5, 4, 3, 2, 1]);
  expect(await toAsyncArray(beginWithNegOne)).toEqual([-1, 5, 4, 3, 2, 1]);
});

test("take", async () => {
  const onlyFirstTwo = basicObservable.pipe(take(2));
  expect(await toAsyncArray(onlyFirstTwo)).toEqual([5, 4]);

  const none = basicObservable.pipe(take(0));
  expect(await toAsyncArray(none)).toEqual([]);
});

test("delay", async () => {
  const results: number[] = [];
  const wait10ms = basicObservable.pipe<number>(delay(10));
  const sub = wait10ms.subscribe({
    next: (value) => {
      results.push(value);
    },
  });
  expect(results).toEqual([]);

  await new Promise((resolve) => {
    setTimeout(resolve, 10);
  });
  expect(results).toEqual([5, 4, 3, 2, 1]);
  sub.unsubscribe();
});

test("big composition", async () => {
  const manyLayerObservable = basicObservable.pipe(
    filter((value) => value >= 3),
    startWith("second"),
    startWith("first"),
    map((value) => `The value is ${value}.`),
  );
  expect(await toAsyncArray(manyLayerObservable)).toEqual([
    "The value is first.",
    "The value is second.",
    "The value is 5.",
    "The value is 4.",
    "The value is 3.",
  ]);
});
