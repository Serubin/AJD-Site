/**
 * Run async work strictly one-at-a-time per key (FIFO). Used so concurrent
 * API requests for the same user/email cannot each create a link and send
 * duplicate notifications.
 */
export function runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = chainTail.get(key) ?? Promise.resolve();
  const ready = prev.then(
    () => undefined,
    () => undefined
  );
  const run = ready.then(() => fn());
  const done = run.then(
    () => undefined,
    () => undefined
  );
  chainTail.set(key, done);
  void done.finally(() => {
    if (chainTail.get(key) === done) chainTail.delete(key);
  });
  return run;
}

const chainTail = new Map<string, Promise<unknown>>();
