import type { Observable } from "observable";

export function toAsyncArray<T>(observable: Observable<T>): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    observable.subscribe({
      next: (value) => {
        results.push(value);
      },
      error: (error) => reject({ results, error }),
      complete: () => resolve(results),
    });
  });
}
