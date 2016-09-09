// The Model object to represent an ICE.
class IceModel {
    constructor() {
        this.context_id = -1;
        this.intention = {};
        this.context = new Set();
        this.extension = [];
    }

    update(context_id, intention, context, extension) {
        this.intention = intention;
        if (this.context_id != context_id) {
            this.context.clear();
            this.extension.length = 0;
            this.context_id = context_id;
        }
        if (!this.context.has(context)) {
            this.context.add(context);
            const newExtension = {};
            newExtension[context] = extension;
            this.extension.push(newExtension);
        }
    }
}

export const iceModel = new IceModel();
