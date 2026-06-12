// The code editor — the same one as lucasgame-academy, ported here.
//
// CodeMirror 6 from a CDN when the network allows (syntax colors, brackets,
// auto-indent — the parts of "like VS Code" kids actually need), with a
// plain <textarea> fallback so a cold network never blocks playing.

const CDN = 'https://esm.sh';

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('cdn timeout')), ms)),
  ]);
}

export async function createEditor(host, doc, onChange) {
  try {
    const [cm, lang, langPkg, lezer, view, commands] = await withTimeout(Promise.all([
      import(`${CDN}/codemirror@6.0.1`),
      import(`${CDN}/@codemirror/lang-javascript@6.2.2`),
      import(`${CDN}/@codemirror/language`),
      import(`${CDN}/@lezer/highlight`),
      import(`${CDN}/@codemirror/view`),
      import(`${CDN}/@codemirror/commands`),
    ]), 5000);

    const theme = cm.EditorView.theme({
      '&': { backgroundColor: '#0d0a1a', color: '#efeaff', fontSize: '1rem' },
      '.cm-content': { caretColor: '#ffd34d', padding: '.6rem 0' },
      '.cm-gutters': { backgroundColor: '#0d0a1a', color: '#5b5380', border: 'none' },
      '&.cm-focused .cm-cursor': { borderLeftColor: '#ffd34d' },
      '.cm-activeLine': { backgroundColor: '#ffffff08' },
      '.cm-activeLineGutter': { backgroundColor: '#ffffff08' },
    }, { dark: true });

    // Dark syntax colors tuned for kids on our background — booleans and
    // numbers get the brand amber so the values that matter stand out.
    const t = lezer.tags;
    const highlight = langPkg.HighlightStyle.define([
      { tag: t.bool, color: '#ffd34d', fontWeight: '700' },
      { tag: [t.number, t.null, t.atom], color: '#ffd34d' },
      { tag: [t.keyword, t.operatorKeyword, t.controlKeyword, t.definitionKeyword], color: '#ff7b72' },
      { tag: [t.string, t.special(t.string)], color: '#a5d6ff' },
      { tag: [t.comment, t.lineComment, t.blockComment], color: '#8a82ad', fontStyle: 'italic' },
      { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#79c0ff' },
      { tag: t.propertyName, color: '#7ee787' },
      { tag: [t.variableName, t.definition(t.variableName)], color: '#efeaff' },
      { tag: [t.operator, t.punctuation, t.bracket], color: '#c9c2e8' },
    ]);

    const editorView = new cm.EditorView({
      doc,
      parent: host,
      extensions: [
        cm.basicSetup,
        lang.javascript(),
        view.keymap.of([commands.indentWithTab]),   // Tab indents, like before
        theme,
        langPkg.syntaxHighlighting(highlight),
        cm.EditorView.updateListener.of(u => { if (u.docChanged) onChange(); }),
      ],
    });
    return {
      kind: 'codemirror',
      get: () => editorView.state.doc.toString(),
      set: v => editorView.dispatch({ changes: { from: 0, to: editorView.state.doc.length, insert: v } }),
    };
  } catch (err) {
    console.warn('CodeMirror unavailable, using textarea fallback:', err.message);
    const ta = document.createElement('textarea');
    ta.value = doc;
    ta.spellcheck = false;
    ta.addEventListener('input', onChange);
    // Tab inserts two spaces, like a code editor
    ta.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const s = ta.selectionStart, t = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(t);
      ta.selectionStart = ta.selectionEnd = s + 2;
      onChange();
    });
    host.appendChild(ta);
    return { kind: 'textarea', get: () => ta.value, set: v => { ta.value = v; } };
  }
}
