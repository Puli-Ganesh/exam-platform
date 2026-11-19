"use client";

import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { bracketMatching, HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { useEffect, useRef } from "react";

const theme = EditorView.theme({
  "&": { height: "100%", color: "#edf0ff", backgroundColor: "#181b2b" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    lineHeight: "1.75",
    fontSize: "0.875rem",
  },
  ".cm-content": { padding: "16px 0 22px", caretColor: "#c5b4ff" },
  ".cm-line": { padding: "0 17px 0 12px" },
  ".cm-gutters": {
    backgroundColor: "#181b2b",
    color: "#9aa3c0",
    border: "none",
    padding: "0 5px 0 9px",
  },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 3px 0 5px" },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#22263b" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#c5b4ff" },
  ".cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
    backgroundColor: "#453c74",
  },
  ".cm-content ::selection": { backgroundColor: "#453c74" },
  ".cm-matchingBracket": { backgroundColor: "#3c466a", outline: "1px solid #7a8cba" },
}, { dark: true });

const pythonColors = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword, tags.bool, tags.null], color: "#c9a5ff" },
  { tag: [tags.function(tags.variableName), tags.function(tags.definition(tags.variableName))], color: "#8ddcf7" },
  { tag: [tags.string, tags.special(tags.string)], color: "#b7e4a0" },
  { tag: tags.number, color: "#ffce9b" },
  { tag: tags.comment, color: "#a0acc9", fontStyle: "italic" },
  { tag: tags.operator, color: "#b9bde8" },
]);

function editMode(readOnly: boolean) {
  return [EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)];
}

type Props = {
  initialValue: string;
  label: string;
  readOnly: boolean;
  visible: boolean;
  onChange: (value: string) => void;
};

export default function CodeEditor({ initialValue, label, readOnly, visible, onChange }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const settings = useRef({ initialValue, label, readOnly });
  const changeHandler = useRef(onChange);
  const mode = useRef(new Compartment());

  useEffect(() => {
    changeHandler.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!host.current) return;
    const initial = settings.current;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.initialValue,
        extensions: [
          python(),
          syntaxHighlighting(pythonColors),
          theme,
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          history(),
          indentUnit.of("    "),
          EditorState.tabSize.of(4),
          closeBrackets(),
          bracketMatching(),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            "aria-label": initial.label,
            "aria-describedby": "editor-instructions",
            "aria-multiline": "true",
            spellcheck: "false",
            autocapitalize: "off",
            autocorrect: "off",
            tabindex: "0",
          }),
          mode.current.of(editMode(initial.readOnly)),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) changeHandler.current(update.state.doc.toString());
          }),
        ],
      }),
    });

    editor.current = view;
    return () => {
      view.destroy();
      editor.current = null;
    };
  }, []);

  useEffect(() => {
    editor.current?.dispatch({ effects: mode.current.reconfigure(editMode(readOnly)) });
  }, [readOnly]);

  useEffect(() => {
    if (visible) editor.current?.requestMeasure();
  }, [visible]);

  return <div ref={host} className="code-editor" />;
}
