// The Model object to represent an ICE (intention/context/extension) object.

// It is owned by render (not main thread). Including it in main thread won't work.

// ICE is updated in two ways:
//  1. when user moves carets around, they move into different places in code,
//      as such, the intention part changes.

//  2. when user requests auto-complete, the context and the extension part changes.
class IceModel {
  constructor() {
    this.intention = {};

    this.contextId = -1;
    this.context = new Set();
    this.extension = [];
  }

  update(intention) {
    if (JSON.stringify(this.intention) === JSON.stringify(intention)) {
      return false;
    }
    this.intention = intention;
    this.context.clear();
    this.extension.length = 0;
    return true;
  }

  updateContext(contextId, contextString, extension) {
    if (this.contextId !== contextId) {
      this.context.clear();
      this.extension.length = 0;
      this.contextId = contextId;
    }

    if (!this.context.has(contextString)) {
      this.context.add(contextString);
      const newExtension = {};
      newExtension[contextString] = extension;
      this.extension.push(newExtension);
    }
  }
}

export const iceModel = new IceModel();
