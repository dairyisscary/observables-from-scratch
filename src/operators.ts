import { create, Observable } from "./observable";

export type OperatorFunction<A, B> = (observableA: Observable<A>) => Observable<B>;

export function map<A, B>(fn: (value: A) => B): OperatorFunction<A, B> {
  return (original) => {
    return create<B>((observer) => {
      const sub = original.subscribe({
        ...observer,
        next: (value) => {
          observer.next(fn(value));
        },
      });
      return () => sub.unsubscribe();
    });
  };
}

export function filter<A>(predicate: (value: A) => boolean): OperatorFunction<A, A> {
  return (original) => {
    return create((observer) => {
      const sub = original.subscribe({
        ...observer,
        next: (value) => {
          if (predicate(value)) {
            observer.next(value);
          }
        },
      });
      return () => sub.unsubscribe();
    });
  };
}

export function startWith<T, S>(startValue: S): OperatorFunction<T, T | S> {
  return (original) => {
    return create((observer) => {
      observer.next(startValue);
      const sub = original.subscribe(observer);
      return () => sub.unsubscribe();
    });
  };
}

export function take<T>(limit: number): OperatorFunction<T, T> {
  return (original) => {
    return create((observer) => {
      if (limit <= 0) {
        observer.complete();
        return;
      }
      const sub = original.subscribe({
        ...observer,
        next: (value) => {
          observer.next(value);
          limit--;
          if (limit === 0) {
            observer.complete();
          }
        },
      });
      return () => sub.unsubscribe();
    });
  };
}

export function delay<T>(time: number): OperatorFunction<T, T> {
  return (original) => {
    return create((observer) => {
      let timeoutIds: ReturnType<typeof setTimeout>[] = [];

      function registerTimeout(fn: () => void) {
        const timeoutId = setTimeout(() => {
          fn();
          timeoutIds = timeoutIds.filter((id) => id !== timeoutId);
        }, time);
        timeoutIds.push(timeoutId);
      }

      const sub = original.subscribe({
        ...observer,
        complete: () => {
          registerTimeout(() => {
            observer.complete();
          });
        },
        next: (value) => {
          registerTimeout(() => {
            observer.next(value);
          });
        },
      });

      return () => {
        timeoutIds.forEach((timeoutId) => {
          clearTimeout(timeoutId);
        });
        timeoutIds = null as any;
        sub.unsubscribe();
      };
    });
  };
}
