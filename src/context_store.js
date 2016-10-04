// Owned by main thread to record the current intention context.
class ContextStore {
  constructor() {
    this.intention = {};
  }

  save(intention) {
    this.intention = intention;
  }

  get() {
    return this.intention;
  }
}

export const contextStore = new ContextStore();
