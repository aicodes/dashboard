// The Model object to represent an ICE.
export default class {
  constructor() {
    this.id = -1;
    this.intention = '';
    this.context = new Set();
    this.extension = new Set();
  }

  update(id, intention, context, extension) {
    if (this.id === id) {
      if (!this.context.has(context)) {
        this.context.add(context);
        this.extension.add(extension);
      }
    } else {    // construct a new ice Model
      this.id = id;
      this.intention = intention;
      this.context.clear();
      this.context.add(context);
      this.extension.clear();
      this.extension.add(extension);
    }
  }
}
