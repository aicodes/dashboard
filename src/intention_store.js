// Owned by main thread to record the current intention context.
class IntentionStore {
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

export const intentionStore = new IntentionStore();
