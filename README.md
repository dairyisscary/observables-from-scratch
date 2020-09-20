# Learn Observables from Scratch
 
### Desired Properties of Observables

* Three kinds of push signals, `next`, `error`, and `complete`, those last two being _terminal_.
* Lazy -- nothing happens until subscription, and they're reusable (fresh subscription is fresh action)
* Both sync and async (or rather, as sync as they _can_ be)
* Registered teardown on terminal signal or cancellation
* Immutable and pipeable


### Our implementation:

Observables will be functions that describe how to publish to an "observer" (thing with `next`, `error`, and `complete`). They will safely allow observer functions to always be called (subscribers can pass as few of these callbacks as they like). Subscribers additionally can choose to unsubscribe. Moreover, they will allow the observable to optionally return a destructor function.


```ts
// We want to be able to write this:

const countEverySecond = create<number>((observer) => {
   let count = 0;
   const intervalId = setInterval(() => {
     observer.next(count);
     count += 1;
   }, 1000);
   return () => {
     clearInterval(intervalId);
   };
});

const subscription = countEverySecond
  .subscribe({ next: (num) => console.log(`The num is ${num}`) });

// Sometime later....
subscription.unsubscribe();
```
