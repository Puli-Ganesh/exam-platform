"use client";

import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  CircleHelp,
  Clock3,
  CodeXml,
  ChevronLeft,
  Download,
  FileCode2,
  Info,
  Keyboard,
  LockKeyhole,
  Maximize2,
  RefreshCw,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  answerIssue,
  createAttempt,
  exportAnswers,
  formatClock,
  hasDraft,
  questionIndices,
  submissionCount,
  submitAnswer,
  updateAnswer,
  type Attempt,
  type QuestionIndex,
} from "../lib/attempt";
import {
  candidateStorageKey,
  restoreCandidateDetails,
  type CandidateDetails,
} from "../lib/candidate";
import { assessmentConfig } from "../lib/config";
import { questions } from "../lib/questions";
import { CandidateRegistration } from "./candidate-registration";
import { CameraPreview, DeviceIndicators, type Devices, useDevices } from "./devices";
import { QuestionPane } from "./question-pane";
import { useAttempt } from "./use-attempt";
import { useFullscreen } from "./use-fullscreen";

const CodeEditor = dynamic(() => import("./code-editor"), {
  ssr: false,
  loading: () => <div className="editor-loading">Loading Python editor…</div>,
});

type Dialog = "help" | "shortcuts" | "details" | "completed" | { submit: QuestionIndex };
type MobilePane = "question" | "editor";
const completionMessage = "Thank you for completing the assessment. Our team will evaluate your submission and get back to you soon.";

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        {assessmentConfig.logoPath ? (
          <img src={assessmentConfig.logoPath} width={36} height={36} alt="" />
        ) : <CodeXml size={22} strokeWidth={2.05} aria-hidden="true" />}
      </span>
      <span>{assessmentConfig.companyName}</span>
    </div>
  );
}

function Header({ onHelp, remaining, submitted }: {
  onHelp: () => void;
  remaining?: number;
  submitted?: number;
}) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand />
        <div className="header-actions">
          {remaining !== undefined && (
            <>
              <span className="submission-progress">
                <span className="progress-steps" aria-hidden="true">
                  {questionIndices.map((step) => <span key={step} data-complete={step < (submitted ?? 0)} />)}
                </span>
                <span>{submitted} of 2 submitted</span>
              </span>
              <div className="countdown" data-urgent={remaining <= 300_000} aria-label="Time remaining">
                <Clock3 size={17} aria-hidden="true" />
                <time>{formatClock(remaining)}</time>
              </div>
            </>
          )}
          <button className="button help-button" onClick={onHelp} aria-label="Assessment help">
            <CircleHelp size={18} aria-hidden="true" />
            <span>Help</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Setup({
  devices, acknowledged, fullScreen, fullscreenError, starting,
  onAcknowledge, onCheckDevices, onEditDetails, onStart,
}: {
  devices: Devices;
  acknowledged: boolean;
  fullScreen: boolean;
  fullscreenError: string;
  starting: boolean;
  onAcknowledge: (value: boolean) => void;
  onCheckDevices: () => void;
  onEditDetails: () => void;
  onStart: () => void;
}) {
  const ready = devices.camera && devices.microphone;

  return (
    <main className="setup-content">
      <div className="intro">
        <button className="button edit-details-button" onClick={onEditDetails} disabled={starting}>
          <ChevronLeft size={16} aria-hidden="true" /> Edit candidate details
        </button>
        <h1 id="setup-title" tabIndex={-1}>Camera and microphone check</h1>
        <p>Allow both devices to start the assessment in full screen.</p>
      </div>

      <div className="setup-grid">
        <section className="setup-card rules-card" aria-labelledby="rules-heading">
          <div className="section-heading">
            <span className="section-icon"><FileCode2 size={21} aria-hidden="true" /></span>
            <h2 id="rules-heading">Assessment instructions</h2>
          </div>
          <ul className="assessment-rules">
            <li><Check size={16} aria-hidden="true" />Work independently without outside assistance or AI tools.</li>
            <li><Check size={16} aria-hidden="true" />Use the Python standard library and keep each function signature unchanged.</li>
            <li><Check size={16} aria-hidden="true" />Explain your approach, complexity, and edge cases in <code># comments</code> below your code.</li>
            <li><Check size={16} aria-hidden="true" />Download your answers after submitting and send them to your recruiter.</li>
          </ul>
          <div className="privacy-notice">
            <LockKeyhole size={17} aria-hidden="true" />
            <p>
              The camera and microphone are checked locally. Audio and video are never recorded or sent.
              {assessmentConfig.privacyNoticeUrl && (
                <> <a href={assessmentConfig.privacyNoticeUrl} target="_blank" rel="noreferrer">Privacy notice</a>.</>
              )}
            </p>
          </div>
          <label className="acknowledgement">
            <input type="checkbox" checked={acknowledged} onChange={(event) => onAcknowledge(event.target.checked)} />
            <span>I’ve read the instructions and device notice.</span>
          </label>
          <div className="start-row">
            <button className="button primary" disabled={!ready || !acknowledged || starting} onClick={onStart}>
              {fullScreen ? "Start assessment" : "Start assessment in full screen"}
              {fullScreen ? <ArrowRight size={17} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
            </button>
            <span>{fullScreen ? "Full screen is on. The timer starts when you begin." : "The timer starts when you begin."}</span>
          </div>
          {fullscreenError && <p className="device-error" role="alert">{fullscreenError}</p>}
        </section>

        <section className="setup-card device-card" aria-labelledby="devices-heading">
          <div className="section-heading">
            <span className="section-icon"><Camera size={21} aria-hidden="true" /></span>
            <h2 id="devices-heading">Device check</h2>
          </div>
          <CameraPreview stream={devices.stream} active={devices.camera} />
          <DeviceIndicators devices={devices} />
          <DeviceFeedback devices={devices} />
          {ready ? (
            <p className="device-hint"><Check size={17} aria-hidden="true" /> Speak briefly to check the microphone meter.</p>
          ) : (
            <button className="button secondary device-check-button" onClick={onCheckDevices} disabled={devices.checking}>
              <Camera size={17} aria-hidden="true" />
              {devices.checking ? "Waiting for permission…" : "Check camera and microphone"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

function DeviceFeedback({ devices }: { devices: Devices }) {
  return (
    <>
      {devices.error && <p className="device-error" role="alert">{devices.error}</p>}
      {devices.checking && (
        <div className="permission-feedback">
          <p role="status">{devices.slow ? "Check your browser for the permission request. If it’s missing, cancel and try again." : "Allow both devices in your browser’s permission prompt."}</p>
          <button className="text-button" onClick={devices.release}>Cancel check</button>
        </div>
      )}
    </>
  );
}

function QuestionNavigation({ attempt, onSelect }: {
  attempt: Attempt;
  onSelect: (index: QuestionIndex) => void;
}) {
  return (
    <nav className="question-navigation" aria-label="Assessment questions">
      {questionIndices.map((index) => {
        const submitted = attempt.submittedAt[index] !== null;
        const drafted = hasDraft(attempt.answers[index], index);
        return (
          <button
            key={index}
            className="question-tab"
            aria-pressed={attempt.selected === index}
            onClick={() => onSelect(index)}
          >
            <span className="question-number">{index + 1}</span>
            <span className="question-tab-body">
              <span className="question-tab-title">{questions[index].title}</span>
              <span className="question-status" data-submitted={submitted}>
                {submitted && <Check size={13} aria-hidden="true" />}
                {submitted ? "Submitted" : drafted ? "Draft" : "Not started"}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function Reconnect({ devices, onCheckDevices }: { devices: Devices; onCheckDevices: () => void }) {
  const missing = !devices.camera && !devices.microphone
    ? "Camera and microphone are disconnected."
    : !devices.camera ? "Camera is disconnected." : "Microphone is disconnected.";

  return (
    <div className="reconnect-panel">
      <div className="reconnect-row">
        <div className="reconnect-message" role="status">
          <AlertCircle size={20} aria-hidden="true" />
          <div>
            <strong>{missing}</strong>
            <span>Editing is paused. The timer is still running.</span>
          </div>
        </div>
        <button className="button secondary" onClick={onCheckDevices} disabled={devices.checking}>
          <RefreshCw size={16} aria-hidden="true" />
          {devices.checking ? "Waiting for permission…" : "Reconnect devices"}
        </button>
      </div>
      <DeviceFeedback devices={devices} />
    </div>
  );
}

function EditorPane({ attempt, mobilePane, paused, saveStatus, onChange, onSubmit, onShortcuts }: {
  attempt: Attempt;
  mobilePane: MobilePane;
  paused: boolean;
  saveStatus: ReturnType<typeof useAttempt>["saveStatus"];
  onChange: (index: QuestionIndex, text: string) => void;
  onSubmit: () => void;
  onShortcuts: () => void;
}) {
  const index = attempt.selected;
  const submitted = attempt.submittedAt[index] !== null;
  const issue = answerIssue(attempt.answers[index], index);
  const saveText = saveStatus === "unavailable"
    ? "Drafts in memory only"
    : saveStatus === "pending" ? "Saving in this tab…" : "Saved in this tab";
  const footerText = issue === "too-large"
    ? "This answer exceeds 64 KiB."
    : submitted ? "Answer locked" : issue === "empty" ? "Add code to submit" : saveText;

  return (
    <section className="editor-pane pane" aria-labelledby="editor-title">
      <div className="pane-heading editor-heading">
        <CodeXml size={18} aria-hidden="true" />
        <span id="editor-title">Code editor</span>
        <div className="editor-tools">
          <span className="language-tag">Python 3</span>
          <button className="icon-button" aria-label="Keyboard shortcuts" title="Keyboard shortcuts" onClick={onShortcuts}>
            <Keyboard size={19} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="editor-instructions" id="editor-instructions">
        <Info size={16} aria-hidden="true" />
        <span>Write Python code first. Below your code, add <code># comments</code> explaining your approach, complexity, and edge cases.</span>
      </p>

      <div className="editor-area">
        {questionIndices.map((questionIndex) => (
          <div className="editor-instance" hidden={index !== questionIndex} key={questionIndex}>
            <CodeEditor
              initialValue={attempt.answers[questionIndex]}
              label={`Python answer for question ${questionIndex + 1}`}
              readOnly={paused || attempt.submittedAt[questionIndex] !== null}
              visible={index === questionIndex && mobilePane === "editor"}
              onChange={(text) => onChange(questionIndex, text)}
            />
          </div>
        ))}
      </div>

      <div className="editor-footer">
        <span className="editor-status" data-warning={issue === "too-large" || saveStatus === "unavailable"} aria-live="polite">
          {submitted ? <LockKeyhole size={15} aria-hidden="true" /> : <span aria-hidden="true" />}
          {footerText}
        </span>
        {submitted ? (
          <span className="answer-locked"><Check size={17} aria-hidden="true" /> Answer submitted</span>
        ) : (
          <button className="button primary" disabled={issue !== null} onClick={onSubmit}>
            Submit answer {index + 1} <ArrowRight size={17} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}

function download(attempt: Attempt, candidate: CandidateDetails) {
  const text = exportAnswers(attempt, assessmentConfig.companyName, candidate);
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "python-assessment-answers.txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function Outcome({ attempt, candidate, completed }: {
  attempt: Attempt;
  candidate: CandidateDetails;
  completed: boolean;
}) {
  const count = submissionCount(attempt);
  const finishedAt = completed
    ? Math.max(attempt.submittedAt[0] ?? 0, attempt.submittedAt[1] ?? 0)
    : attempt.deadlineAt;
  const time = new Date(finishedAt);
  const formatted = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(time);
  const hasWork = count > 0 || questionIndices.some((index) => hasDraft(attempt.answers[index], index));

  return (
    <main className="outcome-content">
      <section className="outcome-card" aria-labelledby="outcome-title">
        <div className="outcome-icon" data-expired={!completed}>
          {completed ? <Check size={33} strokeWidth={2.4} aria-hidden="true" /> : <Clock3 size={31} aria-hidden="true" />}
        </div>
        <h1 id="outcome-title" tabIndex={-1}>{completed ? "Assessment submitted" : "Time is up"}</h1>
        <p className="outcome-message">
          {completed
            ? completionMessage
            : "The assessment has ended. You can no longer edit or submit answers."}
        </p>
        <div className="outcome-details">
          <span><FileCode2 size={17} aria-hidden="true" /> {count} of 2 answers submitted</span>
          <span><Clock3 size={17} aria-hidden="true" /> <time dateTime={time.toISOString()}>{formatted}</time></span>
        </div>
        {hasWork && (
          <div className="outcome-handoff">
            <button className="button primary" onClick={() => download(attempt, candidate)}>
              <Download size={18} aria-hidden="true" /> {completed ? "Download answers" : "Download your work"}
            </button>
            <p>Send the downloaded file to your recruiter so they can review your answers.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function Modal({ title, children, onClose, success = false }: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  success?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  function close() {
    dialog.current?.close();
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          {success && <span className="modal-success-icon"><Check size={21} aria-hidden="true" /></span>}
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" onClick={close} aria-label="Close dialog">
            <X size={21} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function Support() {
  return (
    <>
      <p>Submit your candidate details, allow camera and microphone access, then start in full screen. Use Return to full screen if your browser exits it during the assessment.</p>
      <p>Keep this tab open. Your details, drafts, and submissions stay here. If a device disconnects, reconnect it from this page while the timer continues.</p>
      <p>
        {assessmentConfig.supportEmail
          ? <>For technical help or accessibility accommodations, email <a href={`mailto:${assessmentConfig.supportEmail}`}>{assessmentConfig.supportEmail}</a>.</>
          : "Contact the recruiter who shared this assessment for technical help or an accessibility accommodation."}
      </p>
    </>
  );
}

export function AssessmentApp() {
  const { attempt, stage, now, current, commit, checkTime, saveStatus } = useAttempt();
  const devices = useDevices();
  const { release } = devices;
  const { active: fullScreen, error: fullscreenError, enter, leave } = useFullscreen();
  const [candidate, setCandidate] = useState<CandidateDetails | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [starting, setStarting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [mobilePane, setMobilePane] = useState<MobilePane>("question");
  const [interrupted, setInterrupted] = useState(false);
  const devicesReady = devices.camera && devices.microphone;
  const paused = stage === "exam" && !devicesReady && (!devices.stream || interrupted);
  const remaining = attempt ? attempt.deadlineAt - now : 0;
  const page = !candidate || editingDetails || dialog === "details" ? "registration" : stage;
  const complete = stage === "submitted";
  const finished = complete || stage === "expired";

  useEffect(() => {
    try {
      setCandidate(restoreCandidateDetails(sessionStorage.getItem(candidateStorageKey)));
    } catch {
      // Candidates can still register when the browser blocks session storage.
    }
  }, []);

  useEffect(() => {
    if (stage !== "exam" || devicesReady) {
      setInterrupted(false);
      return;
    }

    const gracePeriod = setTimeout(() => setInterrupted(true), 5_000);
    return () => clearTimeout(gracePeriod);
  }, [devicesReady, stage]);

  useEffect(() => {
    if (!finished) return;
    release();
    leave();
  }, [finished, leave, release]);

  useEffect(() => {
    if (finished && !dialog && candidate) document.getElementById("outcome-title")?.focus();
  }, [candidate, dialog, finished]);

  function saveDetails(details: CandidateDetails) {
    try {
      sessionStorage.setItem(candidateStorageKey, JSON.stringify(details));
    } catch {
      // The details remain in memory until this tab is closed or reloaded.
    }
    setCandidate(details);
    setEditingDetails(false);
    setDialog("details");
  }

  function continueToSetup() {
    setDialog(null);
    requestAnimationFrame(() => document.getElementById("setup-title")?.focus());
  }

  function editDetails() {
    release();
    leave();
    setAcknowledged(false);
    setEditingDetails(true);
    requestAnimationFrame(() => document.getElementById("registration-title")?.focus());
  }

  async function connectDevices() {
    await devices.check();
    if (devices.isReady() && (navigator.userActivation?.isActive ?? true)) {
      await enter(true);
    }
  }

  async function start() {
    if (!candidate || !acknowledged || !devices.isReady() || current.current) return;
    setStarting(true);
    try {
      if (!(await enter()) || !devices.isReady() || current.current) return;
      checkTime();
      commit(createAttempt(Date.now(), assessmentConfig.durationMinutes));
      requestAnimationFrame(() => document.getElementById("question-title")?.focus());
    } finally {
      setStarting(false);
    }
  }

  function chooseQuestion(index: QuestionIndex) {
    const active = current.current;
    if (active && active.selected !== index) commit({ ...active, selected: index });
  }

  function edit(index: QuestionIndex, text: string) {
    const active = current.current;
    if (!active || paused) return;
    const next = updateAnswer(active, index, text, Date.now());
    if (next !== active) commit(next, true);
  }

  function confirm(index: QuestionIndex) {
    const active = current.current;
    if (!active) return;
    const result = submitAnswer(active, index, Date.now());
    if (!result.ok) {
      setDialog(null);
      checkTime();
      return;
    }

    commit(result.attempt);
    setMobilePane("question");
    if (submissionCount(result.attempt) === questions.length) {
      setDialog("completed");
    } else {
      setDialog(null);
      requestAnimationFrame(() => document.getElementById("question-title")?.focus());
    }
  }

  const activeExam = page === "exam" && attempt;

  return (
    <div className="assessment-app" data-stage={page}>
      <Header
        onHelp={() => setDialog("help")}
        remaining={activeExam ? remaining : undefined}
        submitted={activeExam ? submissionCount(activeExam) : undefined}
      />

      {page === "registration" && (
        <CandidateRegistration initialDetails={candidate} onSubmit={saveDetails} />
      )}

      {page === "setup" && (
        <Setup
          devices={devices}
          acknowledged={acknowledged}
          fullScreen={fullScreen}
          fullscreenError={fullscreenError}
          starting={starting}
          onAcknowledge={setAcknowledged}
          onCheckDevices={() => void connectDevices()}
          onEditDetails={editDetails}
          onStart={() => void start()}
        />
      )}

      {activeExam && (
        <main className="shell workspace-shell">
          <div className="sr-only" role="status">
            {remaining <= 60_000 ? "One minute remaining." : remaining <= 300_000 ? "Five minutes remaining." : ""}
          </div>
          <div className="workspace-toolbar">
            <QuestionNavigation attempt={activeExam} onSelect={chooseQuestion} />
            <div className="exam-device-dock" aria-label="Local device status">
              <CameraPreview stream={devices.stream} active={devices.camera} />
              <DeviceIndicators devices={devices} compact />
            </div>
          </div>
          {paused && <Reconnect devices={devices} onCheckDevices={() => void connectDevices()} />}
          {devicesReady && !fullScreen && (
            <div className="reconnect-panel">
              <div className="reconnect-row">
                <div className="reconnect-message" role="status">
                  <Maximize2 size={18} aria-hidden="true" />
                  <div>
                    <strong>Full screen is off.</strong>
                    <span>The timer is still running.</span>
                  </div>
                </div>
                <button className="button secondary" onClick={() => void enter()}>
                  Return to full screen
                </button>
              </div>
              {fullscreenError && <p className="device-error" role="alert">{fullscreenError}</p>}
            </div>
          )}
          <div className="mobile-panes" aria-label="Workspace views">
            <button aria-pressed={mobilePane === "question"} onClick={() => setMobilePane("question")}>Question</button>
            <button aria-pressed={mobilePane === "editor"} onClick={() => setMobilePane("editor")}>Editor</button>
          </div>
          <div className="workspace-grid" data-mobile-pane={mobilePane}>
            <QuestionPane key={activeExam.selected} question={questions[activeExam.selected]} />
            <EditorPane
              attempt={activeExam}
              mobilePane={mobilePane}
              paused={paused}
              saveStatus={saveStatus}
              onChange={edit}
              onSubmit={() => setDialog({ submit: activeExam.selected })}
              onShortcuts={() => setDialog("shortcuts")}
            />
          </div>
        </main>
      )}

      {candidate && attempt && finished && page !== "registration" && (
        <Outcome attempt={attempt} candidate={candidate} completed={complete} />
      )}

      {dialog === "help" && (
        <Modal title="Assessment help" onClose={() => setDialog(null)}>
          <Support />
        </Modal>
      )}
      {dialog === "details" && (
        <Modal title="Successfully submitted" success onClose={continueToSetup}>
          <p>Your candidate details are saved in this tab. Continue to the camera and microphone check.</p>
          <div className="modal-actions">
            <button className="button primary" onClick={continueToSetup}>
              Continue to device check <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </Modal>
      )}
      {candidate && attempt && complete && dialog === "completed" && (
        <Modal title="Assessment submitted" success onClose={() => setDialog(null)}>
          <p>{completionMessage}</p>
          <p>Download your candidate details and answers together, then send the file to your recruiter.</p>
          <div className="modal-actions">
            <button className="button primary" onClick={() => download(attempt, candidate)}>
              <Download size={17} aria-hidden="true" /> Download answers
            </button>
          </div>
        </Modal>
      )}
      {dialog === "shortcuts" && activeExam && (
        <Modal title="Keyboard shortcuts" onClose={() => setDialog(null)}>
          <dl className="shortcuts">
            <div><dt>Indent</dt><dd><kbd>Tab</kbd></dd></div>
            <div><dt>Outdent</dt><dd><kbd>Shift</kbd> + <kbd>Tab</kbd></dd></div>
            <div><dt>Move focus out of the editor</dt><dd><kbd>Esc</kbd> then <kbd>Tab</kbd></dd></div>
            <div><dt>Undo</dt><dd><kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>Z</kbd></dd></div>
          </dl>
        </Modal>
      )}
      {dialog && typeof dialog === "object" && activeExam && (
        <Modal title={`Submit answer ${dialog.submit + 1}?`} onClose={() => setDialog(null)}>
          <p>
            {submissionCount(activeExam) === 1
              ? "This is your second answer. Submitting it will finish the assessment."
              : "Your answer will be locked. You’ll then move to the remaining question."}
          </p>
          <div className="modal-actions">
            <button className="button secondary" autoFocus onClick={() => setDialog(null)}>Keep editing</button>
            <button className="button primary" onClick={() => confirm(dialog.submit)}>
              {submissionCount(activeExam) === 1 ? "Submit and finish" : "Submit answer"}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
