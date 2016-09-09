// The Model object to represent an ICE (intention/context/extension) object.

// ICE is updated in two ways:
//  1. when user moves carets around, they move into different places in code,
//      as such, the intention part changes.

//  2. when user requests auto-complete, the context and the extension part changes.
class IceModel {
    constructor() {
        this.intention = {};

        this.context_id = -1;
        this.context = new Set();
        this.extension = [];
    }

    updateIntention(intention) {
        if (JSON.stringify(this.intention) === JSON.stringify(intention)) {
            return false;
        }
        this.intention = intention;
        this.context.clear();
        this.extension.length = 0;
        return true;
    }

    updateContext(context_id, contextString, extension) {
        if (this.context_id != context_id) {
            this.context.clear();
            this.extension.length = 0;
            this.context_id = context_id;
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
