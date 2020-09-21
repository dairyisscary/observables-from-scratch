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
};

const NOOP = () => {};

export function create<T>(registerFn: RegistrationFunction<T>): Observable<T> {
  return {
    subscribe: (callbacks) => {
      const registeredDestructor = registerFn({
        next: callbacks.next || NOOP,
        error: callbacks.error || NOOP,
        complete: callbacks.complete || NOOP,
      });
      const unsubscribe = () => {
        if (typeof registeredDestructor === "function") {
          registeredDestructor();
        }
      };
      return { unsubscribe };
    },
  };
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
