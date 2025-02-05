import { Plugin } from 'ckeditor5/src/core.js';

export default class IndentParagraph extends Plugin {

  static get defaultIndentSize() {
    return 36;
  }

  init() {
    const editor = this.editor;

    const keystrokes = [
      { key: 'Tab', action: 'increase' },
      { key: 'Shift+Tab', action: 'decrease' },
      { key: 'Backspace', action: 'decrease' }
    ];

    keystrokes.forEach(({ key, action }) => {
      editor.keystrokes.set(key, (_, cancel) => {
        const indentChanged = this.adjustParagraphIndent(editor, action);
        if (key !== 'Backspace' || indentChanged) {
          cancel(); // Always cancel for Tab and Shift+Tab, or if Backspace changed the indent
        }
      }, { priority: 'high' });
    });

    editor.conversion.for('downcast').attributeToAttribute({
      model: 'textIndent',
      view: (_, _2, { attributeNewValue }) => ({ key: 'style', value: { 'text-indent': `${attributeNewValue}px` } })
    });
  }

  adjustParagraphIndent(editor, action) {
    const selection = editor.model.document.selection;
    const position = selection.getFirstPosition();
    const paragraph = position.findAncestor('paragraph');
    if (position.isAtStart && paragraph) {
      const viewElement = editor.editing.mapper.toViewElement(paragraph);
      const currentIndent = parseInt(viewElement.getStyle('text-indent') || paragraph.getAttribute('textIndent') || '0');
      const change = action === 'increase' ? IndentParagraph.defaultIndentSize : -IndentParagraph.defaultIndentSize;
      const newIndentValue = Math.max(currentIndent + change, 0);

      if (newIndentValue !== currentIndent) {
        editor.model.change(writer => {
          writer.setAttribute('textIndent', newIndentValue, paragraph);
        });
        return true; // Indent was adjusted
      }
    }
    return false; // No indent adjustment was made
  }
}
