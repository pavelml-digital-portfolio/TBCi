import { useState } from "react";
import { useDemo } from "./DemoContext";
import { Modal } from "./Primitives";
import UiIcon from "./UiIcon";
import { money } from "../data/demo";
import {
  levelLimits,
  levelNames,
  purchaseUsed,
  type ReviewOutcome,
} from "../data/kyc";
export function VerificationAllowance() {
  const { state } = useDemo();
  const used = purchaseUsed(state),
    limit = levelLimits[state.kyc.level];
  return (
    <div className="verification-allowance">
      <div>
        <strong>
          Level {state.kyc.level} · {levelNames[state.kyc.level]}
        </strong>
        <span>
          {money(used)} used ·{" "}
          {Number.isFinite(limit)
            ? money(Math.max(0, limit - used)) + " remaining"
            : "No KYC purchase cap"}
        </span>
      </div>
      <a className="button small" href="/app/settings/#verification">
        Verification & limits
        <UiIcon name="chevron-right" />
      </a>
    </div>
  );
}
function Evidence({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [error, setError] = useState("");
  return (
    <div className="kyc-evidence">
      <strong>{label}</strong>
      <p>{value || "JPG, PNG or PDF · up to 10 MB · supported files"}</p>
      <div className="settings-actions">
        <label className="button small">
          Choose file
          <input
            aria-label={label}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (
                !["image/jpeg", "image/png", "application/pdf"].includes(
                  f.type,
                ) ||
                f.size > 10 * 1024 * 1024
              ) {
                setError("Choose a JPG, PNG or PDF under 10 MB.");
                return;
              }
              setError("");
              onChange(f.name + " · " + Math.ceil(f.size / 1024) + " KB");
            }}
          />
        </label>
        <button
          className="button small"
          onClick={() => {
            setError("");
            onChange(label + " · selected document");
          }}
        >
          Use saved document
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export default function Verification() {
  const { state, submitKyc, cancelKyc, setDemoLevel } = useDemo();
  const k = state.kyc;
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("Sergey Petrov");
  const [birth, setBirth] = useState("1990-05-15");
  const [country, setCountry] = useState("United Kingdom");
  const [street, setStreet] = useState("10 Example Street");
  const [city, setCity] = useState("London");
  const [postal, setPostal] = useState("SW1A 1AA");
  const [docType, setDocType] = useState("Passport");
  const [docNum, setDocNum] = useState("AB123456");
  const [document, setDocument] = useState("");
  const [selfie, setSelfie] = useState(false);
  const [addressProof, setAddressProof] = useState("");
  const [source, setSource] = useState("Employment income");
  const [occupation, setOccupation] = useState("Software developer");
  const [consent, setConsent] = useState(false);
  const [outcome, setOutcome] = useState<ReviewOutcome>("approved");
  const [error, setError] = useState("");
  const target = k.level === 1 ? 2 : 3;
  const steps =
    target === 3
      ? ["Personal data", "Identity", "Address & funds", "Review"]
      : ["Personal data", "Identity", "Review"];
  const used = purchaseUsed(state),
    limit = levelLimits[k.level];
  const a = k.application;
  const open = () => {
    setStep(0);
    setError("");
    setConsent(false);
    setWizard(true);
  };
  const next = () => {
    setError("");
    if (step === 0) {
      const dob = new Date(birth),
        adult = new Date();
      adult.setFullYear(adult.getFullYear() - 18);
      if (
        fullName.trim().split(/\s+/).length < 2 ||
        !birth ||
        !Number.isFinite(dob.getTime()) ||
        dob > adult ||
        dob < new Date("1900-01-01") ||
        !country
      ) {
        setError("Enter a full name, country and date of birth (18 or older).");
        return;
      }
    }
    if (step === 1 && (!document || !selfie || docNum.trim().length < 5)) {
      setError(
        "Add an identity document, document number and complete the selfie check.",
      );
      return;
    }
    if (
      target === 3 &&
      step === 2 &&
      (!street.trim() ||
        !city.trim() ||
        !postal.trim() ||
        !addressProof ||
        !occupation.trim())
    ) {
      setError(
        "Complete the address, proof of address and source-of-funds details.",
      );
      return;
    }
    setStep(step + 1);
  };
  const submit = () => {
    const failure = submitKyc({
      target,
      outcome,
      reason:
        outcome === "action_required"
          ? "The address document is unreadable. Replace it and resubmit."
          : outcome === "rejected"
            ? "The identity check did not match. Start a new application."
            : "Checks completed successfully.",
      country,
      documentType: docType,
      documentLast4: docNum.slice(-4),
      checks:
        target === 3
          ? [
              "Identity document",
              "Selfie / liveness",
              "Proof of address",
              "Source of funds",
            ]
          : ["Personal details", "Identity document", "Selfie / liveness"],
    });
    if (failure) {
      setError(failure);
      return;
    }
    setWizard(false);
  };
  return (
    <>
      <section className="settings-card">
        <div className="section-row">
          <div>
            <h2>Verification & purchase limits</h2>
            <p>
              Your account starts at Level 2. Upgrade to Level 3 with a
              full KYC review.
            </p>
          </div>
          <span className="settings-badge enabled">
            Level {k.level} · {levelNames[k.level]}
          </span>
        </div>
        <div className="kyc-level-grid">
          {([1, 2, 3] as const).map((l) => (
            <article
              key={l}
              className={"kyc-level " + (k.level === l ? "current" : "")}
            >
              <span>
                LEVEL {l}
                {k.level === l ? " · CURRENT" : ""}
              </span>
              <h3>{levelNames[l]}</h3>
              <strong>
                {Number.isFinite(levelLimits[l])
                  ? money(levelLimits[l], 0)
                  : "Unlimited"}
              </strong>
              <small>Cumulative purchases, including fee</small>
              <p>
                {l === 1
                  ? "No verification. Buy only; complete Basic KYC to unlock other operations."
                  : l === 2
                    ? "Personal details, identity document and a selfie check. Buy, Sell, Compile and wallet withdrawals are available."
                    : "Full KYC adds proof of address, occupation and source of funds. No KYC purchase cap; wallet balances and security limits still apply."}
              </p>
            </article>
          ))}
        </div>
        <div className="kyc-usage">
          <div>
            <strong>{money(used)} purchased</strong>
            <span>
              {Number.isFinite(limit)
                ? money(Math.max(0, limit - used)) +
                  " remaining of " +
                  money(limit, 0)
                : "No purchase cap at Level 3"}
            </span>
          </div>
          {Number.isFinite(limit) && (
            <progress
              aria-label="Purchase allowance used"
              value={Math.min(used, limit)}
              max={limit}
            />
          )}
          <p>
            Allowance includes Buy and Compile across all indices and payment
            currencies. Selling does not restore it. Archive balances are
            excluded.
          </p>
        </div>
        {k.level < 3 && a?.status !== "in_review" && (
          <button className="button primary" onClick={open}>
            {a?.status === "action_required"
              ? "Correct and resubmit"
              : a?.status === "rejected"
                ? "Start a new application"
                : "Upgrade to Level " + target}
            <UiIcon name="chevron-right" />
          </button>
        )}
      </section>
      {a && (
        <section
          className="settings-card kyc-application"
          data-status={a.status}
        >
          <div className="section-row">
            <h2>Level {a.target} application</h2>
            <span
              className={
                "transfer-status " +
                (a.status === "approved"
                  ? "completed"
                  : a.status === "in_review"
                    ? "confirming"
                    : "failed")
              }
            >
              {a.status.replaceAll("_", " ")}
            </span>
          </div>
          <p>
            {a.status === "in_review"
              ? "Your documents are under review. You can leave this page and return to check the status."
              : a.reason}
          </p>
          <dl className="wallet-review">
            <dt>Application ID</dt>
            <dd className="wallet-address">{a.id}</dd>
            <dt>Submitted / UTC</dt>
            <dd>
              {new Date(a.submittedAt).toLocaleString("en-GB", {
                timeZone: "UTC",
              })}
            </dd>
            <dt>Checks</dt>
            <dd>{a.checks.join(" · ")}</dd>
            <dt>Document</dt>
            <dd>
              {a.documentType} · ending {a.documentLast4}
            </dd>
          </dl>
          {a.status === "in_review" && (
            <button className="button" onClick={cancelKyc}>
              Cancel review
            </button>
          )}
        </section>
      )}
      <section className="settings-card">
        <h2>Verification options</h2>
        <p>
          Review your verification level and purchase allowance before starting an application.
        </p>
        <details>
          <summary>Change client level</summary>
          <p>Purchase usage is preserved when changing levels.</p>
          <div className="settings-actions">
            <button className="button" onClick={() => setDemoLevel(1)}>
              Switch to Level 1
            </button>
            <button className="button" onClick={() => setDemoLevel(2)}>
              Restore default Level 2
            </button>
          </div>
        </details>
      </section>
      {wizard && (
        <Modal
          title={"Upgrade to Level " + target + " · " + steps[step]}
          onClose={() => setWizard(false)}
        >
          <p className="wallet-demo-banner">
            KYC review · complete all required steps
          </p>
          <ol className="wallet-steps">
            {steps.map((s, i) => (
              <li
                key={s}
                className={i === step ? "active" : i < step ? "done" : ""}
              >
                <span>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="kyc-wizard">
            {step === 0 ? (
              <div className="settings-field-grid">
                <label>
                  Full legal name
                  <input
                    aria-label="Full legal name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>
                <label>
                  Date of birth
                  <input
                    aria-label="Date of birth"
                    type="date"
                    value={birth}
                    onChange={(e) => setBirth(e.target.value)}
                  />
                </label>
                <label>
                  Country of residence
                  <select
                    aria-label="Country of residence"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {[
                      "United Kingdom",
                      "Germany",
                      "France",
                      "Canada",
                      "Singapore",
                      "United Arab Emirates",
                      "Other country",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : step === 1 ? (
              <>
                <div className="settings-field-grid">
                  <label>
                    Document type
                    <select
                      aria-label="Identity document type"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                    >
                      {["Passport", "National ID card", "Residence permit"].map(
                        (v) => (
                          <option key={v}>{v}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    Document number
                    <input
                      aria-label="Document number"
                      value={docNum}
                      onChange={(e) => setDocNum(e.target.value)}
                    />
                  </label>
                </div>
                <Evidence
                  label="Identity document"
                  value={document}
                  onChange={setDocument}
                />
                <div className="kyc-evidence">
                  <strong>Selfie & liveness</strong>
                  <p>
                    {selfie
                      ? "Selfie check completed."
                      : "Complete the selfie check to continue your application."}
                  </p>
                  <button className="button" onClick={() => setSelfie(true)}>
                    {selfie ? (
                      <>
                        <UiIcon name="check" />
                        Selfie check complete
                      </>
                    ) : (
                      "Complete selfie check"
                    )}
                  </button>
                </div>
              </>
            ) : target === 3 && step === 2 ? (
              <>
                <div className="settings-field-grid">
                  <label>
                    Street address
                    <input
                      aria-label="Street address"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    />
                  </label>
                  <label>
                    City
                    <input
                      aria-label="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </label>
                  <label>
                    Postal code
                    <input
                      aria-label="Postal code"
                      value={postal}
                      onChange={(e) => setPostal(e.target.value)}
                    />
                  </label>
                  <label>
                    Occupation
                    <input
                      aria-label="Occupation"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                    />
                  </label>
                  <label>
                    Source of funds
                    <select
                      aria-label="Source of funds"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    >
                      {[
                        "Employment income",
                        "Business income",
                        "Savings",
                        "Investments",
                        "Inheritance",
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <Evidence
                  label="Proof of address"
                  value={addressProof}
                  onChange={setAddressProof}
                />
                <p className="settings-help">
                  Example: a utility bill or bank statement issued within the
                  last 3 months. Ensure all details are readable.
                </p>
              </>
            ) : (
              <>
                <dl className="wallet-review">
                  <dt>Applicant</dt>
                  <dd>
                    {fullName} · {country}
                  </dd>
                  <dt>Identity</dt>
                  <dd>
                    {docType} ending {docNum.slice(-4)} · selfie complete
                  </dd>
                  {target === 3 && (
                    <>
                      <dt>Address</dt>
                      <dd>
                        {street}, {city}, {postal}
                      </dd>
                      <dt>Funds</dt>
                      <dd>
                        {source} · {occupation}
                      </dd>
                    </>
                  )}
                  <dt>New purchase cap</dt>
                  <dd>{target === 3 ? "Unlimited" : money(10000, 0)}</dd>
                </dl>
                <details className="kyc-outcome">
                  <summary>Review outcome</summary>
                  <label>
                    Review result
                    <select
                      aria-label="Review outcome"
                      value={outcome}
                      onChange={(e) =>
                        setOutcome(e.target.value as ReviewOutcome)
                      }
                    >
                      <option value="approved">Approve application</option>
                      <option value="action_required">
                        Request document correction
                      </option>
                      <option value="rejected">Reject application</option>
                    </select>
                  </label>
                </details>
                <label className="wallet-acknowledgement">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  I confirm the details above and agree to the review.
                </label>
              </>
            )}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button"
              onClick={() => (step ? setStep(step - 1) : setWizard(false))}
            >
              {step ? "Back" : "Cancel"}
            </button>
            <button
              className="button primary"
              disabled={step === steps.length - 1 && !consent}
              onClick={step === steps.length - 1 ? submit : next}
            >
              {step === steps.length - 1
                ? "Submit verification"
                : "Continue"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
