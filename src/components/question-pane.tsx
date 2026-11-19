import { FileText } from "lucide-react";
import { type ReactNode } from "react";
import { type Question } from "../lib/questions";

const identifiers = /\b(initial_stock(?:\[sku - 1\]|\[i\])?|stock_changes|reservations|first_shortage_minute|shortage_unit_minutes|peak_shortage|minutes_short|ready_time|eligible = 1)\b/g;

function InlineCode({ text }: { text: string }) {
  return text.split(identifiers).map((piece, index) =>
    index % 2 === 1 ? <code key={index}>{piece}</code> : piece,
  );
}

function CodeBlock({ children }: { children: ReactNode }) {
  return <pre className="question-code" tabIndex={0}><code>{children}</code></pre>;
}

export function QuestionPane({ question }: { question: Question }) {
  return (
    <section className="statement-pane pane" aria-labelledby="question-title">
      <div className="pane-heading">
        <FileText size={17} aria-hidden="true" />
        <span>Problem statement</span>
      </div>
      <div className="question-scroll">
        <h1 id="question-title" tabIndex={-1}>{question.title}</h1>
        <p className="question-description">{question.description}</p>

        <section className="question-section">
          <h2>Function signature</h2>
          <CodeBlock>{question.signature}</CodeBlock>
        </section>

        {question.sections.map(({ heading, blocks }) => (
          <section className="question-section" key={heading}>
            <h2>{heading}</h2>
            {blocks.map((block, index) => {
              if (block.kind === "list") {
                return (
                  <ul key={index}>
                    {block.items.map((item) => <li key={item}><InlineCode text={item} /></li>)}
                  </ul>
                );
              }
              if (block.kind === "code") return <CodeBlock key={index}>{block.text}</CodeBlock>;
              return <p key={index}><InlineCode text={block.text} /></p>;
            })}
          </section>
        ))}

        {question.examples.map((example, index) => (
          <section className="question-section" key={example.code}>
            <h2>Example {index + 1}</h2>
            <CodeBlock>{example.code}</CodeBlock>
            <p>{example.explanation}</p>
          </section>
        ))}
      </div>
    </section>
  );
}
