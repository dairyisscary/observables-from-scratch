import { create, of, fromEvent, fromPromise } from "observable";
import { toAsyncArray } from "./helpers";

test("lazy construction", async () => {
  let constructionCount = 0;
  const observableWithEffect = create((observer) => {
    constructionCount++;
  });
  expect(constructionCount).toBe(0);

  const sub1 = observableWithEffect.subscribe({});
  expect(constructionCount).toBe(1);

  const sub2 = observableWithEffect.subscribe({});
  expect(constructionCount).toBe(2);

  sub1.unsubscribe();
  sub2.unsubscribe();
  expect(constructionCount).toBe(2); // still 2

  const sub3 = observableWithEffect.subscribe({});
  expect(constructionCount).toBe(3);
});

test("basic sync construction (of)", async () => {
  expect(await toAsyncArray(of())).toEqual([]);
  expect(await toAsyncArray(of(1, 2, 3))).toEqual([1, 2, 3]);
});

test("fromPromise", async () => {
  const resolvedPromise = fromPromise(Promise.resolve(1));
  expect(await toAsyncArray(resolvedPromise)).toEqual([1]);

  const expectedError = new Error("bad!");
  const rejectedPromise = fromPromise(Promise.reject(expectedError));
  return toAsyncArray(rejectedPromise)
    .then(() => {
      expect(true).toBe(false); // Should never happen!
    })
    .catch((error) => {
      expect(error).toEqual({ error: expectedError, results: [] });
    });
});

test("fromEvent", () => {
  type Event = number;
  const eventName = "click";
  let callback: ((evt: Event) => void) | undefined;
  const fakeDocument = {
    addEventListener(key: string, passedCallback: Exclude<typeof callback, undefined>) {
      expect(key).toBe(eventName);
      callback = passedCallback;
    },
    removeEventListener(key: string, passedCallback: Exclude<typeof callback, undefined>) {
      expect(key).toBe(eventName);
      callback = undefined;
    },
  };

  const results: Event[] = [];
  const clicks = fromEvent<Event>(fakeDocument, eventName);
  const sub = clicks.subscribe({
    next: (event) => results.push(event),
  });
  callback!(10);
  callback!(20);
  expect(results).toEqual([10, 20]);

  sub.unsubscribe();
  expect(results).toEqual([10, 20]);
  expect(callback).toBeUndefined();
});

test("aync works too.", async () => {
  const asyncObservable = create((observer) => {
    observer.next(1);
    setTimeout(() => {
      observer.next(2);
    }, 0);
    setTimeout(() => {
      observer.next(3);
    }, 0);
    setTimeout(() => {
      observer.complete();
    }, 0);
  });
  expect(await toAsyncArray(asyncObservable)).toEqual([1, 2, 3]);
});
