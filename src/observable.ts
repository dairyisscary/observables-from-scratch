import type { OperatorFunction } from "./operators";

type EventEmitter<E> = {
  addEventListener: (eventName: string, callback: (event: E) => void) => void;
  removeEventListener: (eventName: string, callback: (event: E) => void) => void;
};

type RegistrationFunction<T> = (observer: Observer<T>) => void | (() => void);

type Observer<T> = {
  next: (value: T) => void;
  error: (error: unknown) => void;
  complete: () => void;
};

type Subscription = {
  unsubscribe: () => void;
};

export type Observable<T> = {
  subscribe: (callbacks: Partial<Observer<T>>) => Subscription;
  pipe: <B>(...operations: OperatorFunction<any, any>[]) => Observable<B>;
};

export function create<T>(registerFn: RegistrationFunction<T>): Observable<T> {
  const observable: Observable<T> = {
    pipe: <B>(...operations: OperatorFunction<any, any>[]) => {
      const result = operations.reduce((accum, operation) => operation(accum), observable);
      return (result as any) as Observable<B>;
    },
    subscribe: (callbacks) => {
      let registeredDestructor: ReturnType<typeof registerFn>;
      let open = true;

      const unsubscribe = () => {
        open = false;
        if (typeof registeredDestructor === "function") {
          registeredDestructor();
          registeredDestructor = undefined;
        }
      };

      registeredDestructor = registerFn({
        next: (value) => {
          if (open && callbacks.next) {
            callbacks.next(value);
          }
        },
        error: (error) => {
          if (open && callbacks.error) {
            callbacks.error(error);
            unsubscribe();
          }
        },
        complete: () => {
          if (open && callbacks.complete) {
            callbacks.complete();
            unsubscribe();
          }
        },
      });

      if (!open) {
        // If error/complete were called during registration, we must try again for the destructor
        unsubscribe();
      }

      return { unsubscribe };
    },
  };
  return observable;
}

export function of<T>(...values: T[]): Observable<T> {
  return create((observer) => {
    for (const value of values) {
      observer.next(value);
    }
    observer.complete();
  });
}

export function fromEvent<E>(eventSource: EventEmitter<E>, eventName: string): Observable<E> {
  return create((observer) => {
    const callback = (event: E) => observer.next(event);
    eventSource.addEventListener(eventName, callback);
    return () => eventSource.removeEventListener(eventName, callback);
  });
}

export function fromPromise<T>(source: Promise<T>): Observable<T> {
  return create((observer) => {
    source
      .then((value) => {
        observer.next(value);
        observer.complete();
      })
      .catch((e) => observer.error(e));
  });
}
