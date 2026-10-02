// Keep expensive Boolean work off the UI thread and cancel obsolete designs.
export class GeometryClient {
  constructor(onModel, onError, { createWorker = () => new Worker('/builder/geometry-worker.js', { type: 'module' }), delay = 200 } = {}) {
    this.onModel = onModel;
    this.onError = onError;
    this.createWorker = createWorker;
    this.delay = delay;
    this.id = 0;
    this.busy = false;
    this.disposed = false;
    this.installWorker();
  }
  installWorker() {
    this.worker?.terminate();
    const worker = this.createWorker();
    this.worker = worker;
    worker.onmessage = ({ data }) => {
      if (this.disposed || worker !== this.worker || data.id !== this.id) return;
      this.busy = false;
      if (data.error) this.fail(data.error);
      else this.onModel(data.packed);
    };
    worker.onerror = event => {
      if (this.disposed || worker !== this.worker) return;
      this.busy = false;
      this.fail(event.message || 'Geometry worker failed');
    };
  }
  request(config) {
    if (this.disposed) return;
    clearTimeout(this.timer);
    this.config = config;
    this.id++;
    this.retries = 0;
    if (this.busy) this.installWorker();
    this.busy = false;
    this.timer = setTimeout(() => this.send(), this.delay);
  }
  send() {
    if (this.disposed) return;
    this.busy = true;
    this.worker.postMessage({ id: this.id, config: this.config });
  }
  fail(error) {
    // WASM errors can poison later jobs. Retry once in a fresh runtime, but
    // report persistent failures rather than hiding an invalid design.
    if (this.retries++ === 0) {
      try {
        this.installWorker();
        this.send();
        return;
      } catch (failure) { error = failure.message; }
    }
    this.busy = false;
    this.onError(error);
  }
  dispose() {
    this.disposed = true;
    clearTimeout(this.timer);
    this.worker?.terminate();
  }
}
