import React, { useMemo, useRef, useState } from 'react';

const DEMO_MEDICINES = [
  {
    id: 'med-1',
    drug: 'Amoxicillin',
    strength: '500 mg',
    dose: '1 capsule',
    frequency: 'Every 8 hours',
    duration: '5 days',
    confidence: { drug: 97, strength: 98, dose: 94, frequency: 89, duration: 93 },
    reviewed: false,
    hasLasaWarning: false,
    safetyAcknowledged: false,
  },
  {
    id: 'med-2',
    drug: 'Hydroxyzine',
    strength: '25 mg',
    dose: '1 tablet',
    frequency: 'Twice daily',
    duration: '7 days',
    confidence: { drug: 72, strength: 88, dose: 83, frequency: 67, duration: 74 },
    reviewed: false,
    hasLasaWarning: true,
    safetyAcknowledged: false,
  },
];

const NAV_ITEMS = [
  { id: 'workspace', label: 'Review workspace', icon: 'scan' },
  { id: 'queue', label: 'Review queue', icon: 'inbox', count: '03' },
  { id: 'safety', label: 'Drug safety', icon: 'shield' },
  { id: 'audit', label: 'Audit trail', icon: 'clock' },
];

const FIELD_DEFS = [
  { key: 'drug', label: 'Medicine name', short: 'Medicine' },
  { key: 'strength', label: 'Strength', short: 'Strength' },
  { key: 'dose', label: 'Dose', short: 'Dose' },
  { key: 'frequency', label: 'Frequency', short: 'Frequency' },
  { key: 'duration', label: 'Duration', short: 'Duration' },
];

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const paths = {
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
    scan: <><path d="M7 3H5a2 2 0 0 0-2 2v2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M17 21h2a2 2 0 0 0 2-2v-2" /><path d="M7 12h10" /><path d="M12 7v10" /></>,
    inbox: <><path d="M4 4h16l1 11h-6l-2 3h-2l-2-3H3L4 4Z" /><path d="M3 15h6l2 3h2l2-3h6" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    warning: <><path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    x: <><path d="m18 6-12 12" /><path d="m6 6 12 12" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.file}</svg>;
}

function Confidence({ value }) {
  const tone = value >= 90 ? 'high' : value >= 80 ? 'medium' : 'low';
  return (
    <div className={`confidence confidence-${tone}`} title={`${value}% original extraction confidence`}>
      <span className="confidence-track"><span style={{ width: `${value}%` }} /></span>
      <span className="confidence-value">{value}%</span>
    </div>
  );
}

function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;
  return (
    <div className={`toast toast-${type}`} role="status">
      <span className="toast-symbol"><Icon name={type === 'error' ? 'warning' : 'checkCircle'} size={18} /></span>
      <span>{message}</span>
      <button className="icon-button toast-close" onClick={onClose} aria-label="Dismiss notification"><Icon name="x" size={16} /></button>
    </div>
  );
}

function Sidebar({ activeNav, setActiveNav, confirmed }) {
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <div className="brand-mark"><span>+</span></div>
        <div className="brand-copy"><strong>MedMatch <em>Rx</em></strong><small>PRESCRIPTION ASSISTANT</small></div>
      </div>
      <div className="sidebar-caption">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={`nav-item ${activeNav === item.id ? 'nav-item-active' : ''}`} onClick={() => setActiveNav(item.id)}>
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
            {item.count && <span className="nav-count">{item.count}</span>}
            {item.id === 'audit' && confirmed && <span className="nav-dot" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="privacy-card">
          <div className="privacy-icon"><Icon name="shield" size={18} /></div>
          <strong>Safety comes first</strong>
          <p>AI assists the review. A pharmacist makes the final decision.</p>
        </div>
        <div className="sidebar-user">
          <div className="avatar">PD</div>
          <div className="sidebar-user-copy"><strong>Pharmacist Demo</strong><span>Review workspace</span></div>
          <span className="online-dot" />
        </div>
        <div className="sidebar-version">MEDMATCH RX <span>Â·</span> PROTOTYPE 0.1</div>
      </div>
    </aside>
  );
}

function Topbar({ title, subtitle }) {
  return (
    <header className="topbar">
      <div className="topbar-title"><div className="mobile-brand"><span className="brand-mark mini">+</span><strong>MedMatch <em>Rx</em></strong></div><span className="crumb">Workspace</span><Icon name="chevron" size={14} /><span className="crumb-current">{title}</span></div>
      <div className="topbar-actions">
        <span className="environment-tag"><span className="environment-dot" /> DEMO ENVIRONMENT</span>
        <button className="icon-button notification-button" aria-label="Notifications"><Icon name="bell" size={19} /><i /></button>
        <div className="topbar-profile"><div className="avatar small-avatar">PD</div><div><strong>Pharmacist Demo</strong><span>Clinical reviewer</span></div></div>
      </div>
    </header>
  );
}

function StatCard({ label, value, note, icon, kind }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${kind}`}><Icon name={icon} size={19} /></div>
      <div className="stat-details"><span>{label}</span><div className="stat-number-row"><strong>{value}</strong><small>{note}</small></div></div>
    </div>
  );
}

function PrescriptionViewer({ imageSrc, fileName, onUpload, isUploaded }) {
  return (
    <section className="panel prescription-panel">
      <div className="panel-heading">
        <div><div className="eyebrow">SOURCE DOCUMENT</div><h2>Prescription image</h2></div>
        <button className="subtle-icon-button" onClick={onUpload} title="Upload another image"><Icon name="refresh" size={16} /></button>
      </div>
      <div className="document-meta"><div className="document-file-icon"><Icon name="file" size={17} /></div><div className="document-file-copy"><strong>{fileName || 'sample-prescription.svg'}</strong><span>{isUploaded ? 'Uploaded image Â· not yet processed' : 'Sample document Â· fictional data'}</span></div><span className="file-type">IMAGE</span></div>
      <div className="document-canvas">
        {imageSrc ? <img src={imageSrc} alt="Prescription document preview" /> : <div className="empty-document"><Icon name="image" size={32} /><strong>No image selected</strong><span>Upload a prescription photo to begin.</span></div>}
        <span className="document-corner document-corner-tl" /><span className="document-corner document-corner-tr" /><span className="document-corner document-corner-bl" /><span className="document-corner document-corner-br" />
      </div>
      <button className="upload-outline-button" onClick={onUpload}><Icon name="upload" size={17} /> Upload prescription photo</button>
      <div className="document-footnote"><Icon name="shield" size={14} /><span>Demo only. Do not upload real patient data to this prototype.</span></div>
    </section>
  );
}

function MedicineLine({ medicine, index, onFieldChange, onReviewedChange, onSafetyAck, onRemove, confirmed }) {
  const isComplete = FIELD_DEFS.every(field => String(medicine[field.key] || '').trim());
  return (
    <article className={`medicine-card ${medicine.hasLasaWarning ? 'medicine-card-warning' : ''} ${medicine.reviewed ? 'medicine-card-reviewed' : ''}`}>
      <div className="medicine-card-top">
        <div className="medicine-index">{String(index + 1).padStart(2, '0')}</div>
        <div className="medicine-title-block"><strong>Medicine line {index + 1}</strong><span>{medicine.reviewed ? 'Review marked complete' : 'Awaiting pharmacist review'}</span></div>
        {medicine.hasLasaWarning && <span className="lasa-pill"><Icon name="warning" size={13} /> NAME CHECK</span>}
        {!medicine.hasLasaWarning && <span className="line-status"><span /> {medicine.reviewed ? 'Reviewed' : 'Pending'}</span>}
        {medicine.custom && <button className="remove-line" onClick={() => onRemove(medicine.id)} aria-label="Remove medicine line" disabled={confirmed}><Icon name="x" size={15} /></button>}
      </div>
      <div className="fields-grid">
        {FIELD_DEFS.map(field => {
          const score = medicine.confidence?.[field.key] ?? 0;
          return (
            <label className={`field-control field-${field.key}`} key={field.key}>
              <span className="field-label">{field.label}</span>
              <input value={medicine[field.key] || ''} onChange={e => onFieldChange(medicine.id, field.key, e.target.value)} placeholder={`Enter ${field.short.toLowerCase()}`} disabled={confirmed} aria-label={`${field.label} for medicine line ${index + 1}`} />
              <Confidence value={score} />
            </label>
          );
        })}
      </div>
      {medicine.hasLasaWarning && (
        <div className="lasa-alert">
          <div className="alert-icon"><Icon name="warning" size={18} /></div>
          <div className="lasa-alert-copy">
            <strong>Potential look-alike / sound-alike (LASA) name</strong>
            <p><b>Hydroxyzine</b> may be confused with <b>hydralazine</b>. Check the original prescription and your trusted drug reference. This demo warning is illustrative, not a clinical database match.</p>
            <label className="safety-ack"><input type="checkbox" checked={!!medicine.safetyAcknowledged} onChange={e => onSafetyAck(medicine.id, e.target.checked)} disabled={confirmed} /><span>I checked the medicine name against the source document.</span></label>
          </div>
        </div>
      )}
      <div className="medicine-card-footer">
        <span className={`review-hint ${!isComplete ? 'review-hint-error' : ''}`}>
          {!isComplete ? <><Icon name="warning" size={14} /> Complete all fields before confirming.</> : medicine.reviewed ? <><Icon name="checkCircle" size={14} /> Line reviewed by pharmacist</> : <><Icon name="file" size={14} /> Verify every field against the prescription.</>}
        </span>
        <label className={`review-checkbox ${!isComplete ? 'review-checkbox-disabled' : ''}`}>
          <input type="checkbox" checked={!!medicine.reviewed} onChange={e => onReviewedChange(medicine.id, e.target.checked)} disabled={confirmed || !isComplete} />
          <span>Mark line reviewed</span>
        </label>
      </div>
    </article>
  );
}

function Workspace({
  medicines, setMedicines, imageSrc, fileName, isUploaded, onUploadClick, inputRef,
  isAnalyzed, onAnalyze, isAnalyzing, confirmed, setConfirmOpen, showToast,
  resetReview, isDemoOutput,rawOCRText,
}) {
  const allLinesReviewed = medicines.length > 0 && medicines.every(m => m.reviewed);
  const allFieldsComplete = medicines.length > 0 && medicines.every(m => FIELD_DEFS.every(f => String(m[f.key] || '').trim()));
  const allWarningsAcknowledged = medicines.every(m => !m.hasLasaWarning || m.safetyAcknowledged);
  const canConfirm = isAnalyzed && !confirmed && allLinesReviewed && allFieldsComplete && allWarningsAcknowledged;

  const updateMedicine = (id, key, value) => {
    setMedicines(current => current.map(m => m.id === id ? { ...m, [key]: value, reviewed: false } : m));
  };
  const updateReviewed = (id, checked) => setMedicines(current => current.map(m => m.id === id ? { ...m, reviewed: checked } : m));
  const updateSafety = (id, checked) => setMedicines(current => current.map(m => m.id === id ? { ...m, safetyAcknowledged: checked, reviewed: checked ? m.reviewed : false } : m));
  const addLine = () => {
    const id = `new-${Date.now()}`;
    setMedicines(current => [...current, { id, drug: '', strength: '', dose: '', frequency: '', duration: '', confidence: { drug: 0, strength: 0, dose: 0, frequency: 0, duration: 0 }, reviewed: false, hasLasaWarning: false, safetyAcknowledged: false, custom: true }]);
    showToast('Blank medicine line added. Enter and verify all fields.', 'success');
  };
  const removeLine = (id) => setMedicines(current => current.filter(m => m.id !== id));

  return (
    <>
      <div className="page-intro">
        <div><div className="page-kicker">PHARMACIST WORKSPACE</div><h1>Prescription review</h1><p>Turn a prescription photo into a structured list, then verify every detail.</p></div>
        <div className="intro-actions"><span className="mode-chip"><span /> SIMULATED OCR</span><button className="primary-button" onClick={onUploadClick}><Icon name="upload" size={17} /> Upload prescription</button></div>
      </div>
      <div className="stats-grid">
        <StatCard label="Scans today" value="12" note="+3 this week" icon="scan" kind="blue" />
        <StatCard label="Awaiting review" value={confirmed ? '02' : '03'} note="Needs attention" icon="clock" kind="orange" />
        <StatCard label="Name-similarity flags" value={medicines.filter(m => m.hasLasaWarning).length.toString().padStart(2, '0')} note="Verify carefully" icon="warning" kind="red" />
        <StatCard label="Confirmed today" value={confirmed ? '09' : '08'} note="Pharmacist approved" icon="checkCircle" kind="green" />
      </div>

      <div className="safety-banner">
        <div className="safety-banner-icon"><Icon name="shield" size={20} /></div>
        <div><strong>Human confirmation required</strong><p>Confidence scores are signals, not proof. Check the source for every medicine before confirming.</p></div>
        <span className="safety-banner-tag">SAFETY GATE ON</span>
      </div>

      <div className="workbench-heading">
        <div><h2>Active prescription <span className="prescription-id">RX-2408</span></h2><p>Uploaded just now Â· Sample patient Â· No patient data stored</p></div>
        <div className={`case-status ${confirmed ? 'case-status-confirmed' : ''}`}><span />{confirmed ? 'Pharmacist confirmed' : 'Needs review'}</div>
      </div>

      {!isAnalyzed && (
        <div className="upload-state-banner"><div><Icon name="image" size={19} /><div><strong>Photo ready for processing</strong><span>This demo cannot read the image yet. Run the simulation to preview the review workflow.</span></div></div><button className="primary-button" onClick={onAnalyze} disabled={isAnalyzing}>{isAnalyzing ? <><span className="button-spinner" /> Simulatingâ€¦</> : <><Icon name="scan" size={16} /> Simulate extraction</>}</button></div>
      )}

      {isDemoOutput && isAnalyzed && <div className="demo-data-note"><Icon name="info" size={16} /><span><strong>Demo extraction:</strong> these sample values are not read from the uploaded image. Connect an OCR service to process real prescriptions.</span></div>}

{isUploaded && isAnalyzed && !isDemoOutput && (
  <section
    className="panel"
    style={{ marginBottom: 24, padding: 20 }}
  >
    <div className="panel-heading">
      <div>
        <div className="eyebrow">GOOGLE CLOUD VISION</div>
        <h2>Recognized prescription text</h2>
      </div>
    </div>

    <pre
      style={{
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        fontFamily: 'inherit',
        fontSize: 14,
        lineHeight: 1.7,
        margin: 0,
      }}
    >
      {rawOCRText.trim()
        ? rawOCRText
        : 'No readable text was detected. Try a clearer image.'}
    </pre>

    <p style={{ fontSize: 12, marginTop: 16 }}>
      OCR output only. A pharmacist must verify all medicine details.
    </p>
  </section>
)}
      <div className="workspace-grid">
        <PrescriptionViewer imageSrc={imageSrc} fileName={fileName} onUpload={onUploadClick} isUploaded={isUploaded} />
        <section className="panel results-panel">
          <div className="panel-heading results-panel-heading">
            <div><div className="eyebrow">EXTRACTED DETAILS</div><h2>Medicine list <span className="count-badge">{medicines.length.toString().padStart(2, '0')}</span></h2></div>
            <button className="text-button" onClick={addLine} disabled={!isAnalyzed || confirmed}><Icon name="plus" size={15} /> Add medicine</button>
          </div>
          <div className="confidence-legend"><span><i className="legend-dot legend-high" /> 90â€“100% high</span><span><i className="legend-dot legend-medium" /> 80â€“89% review</span><span><i className="legend-dot legend-low" /> Below 80% low</span></div>
          {!isAnalyzed ? (
            <div className="empty-results"><div className="empty-results-icon"><Icon name="scan" size={25} /></div><strong>Waiting for extraction</strong><p>Choose â€œSimulate extractionâ€ to preview structured fields. This action uses mock data only.</p></div>
          ) : medicines.length === 0 ? (
            <div className="empty-results"><div className="empty-results-icon"><Icon name="file" size={25} /></div><strong>No medicine lines</strong><p>Add a medicine line to start a manual review.</p><button className="secondary-button" onClick={addLine}><Icon name="plus" size={15} /> Add medicine line</button></div>
          ) : (
            <div className="medicine-list">
              {medicines.map((medicine, index) => <MedicineLine key={medicine.id} medicine={medicine} index={index} onFieldChange={updateMedicine} onReviewedChange={updateReviewed} onSafetyAck={updateSafety} onRemove={removeLine} confirmed={confirmed} />)}
            </div>
          )}
          <div className="review-summary">
            <div className="review-summary-count"><div className="summary-check-icon"><Icon name="check" size={16} /></div><div><strong>{medicines.filter(m => m.reviewed).length} of {medicines.length} lines reviewed</strong><span>{allWarningsAcknowledged ? 'Safety checks acknowledged where flagged' : 'Acknowledge the highlighted name warning to continue'}</span></div></div>
            <div className="summary-progress"><span style={{ width: `${medicines.length ? (medicines.filter(m => m.reviewed).length / medicines.length) * 100 : 0}%` }} /></div>
          </div>
          <div className="confirmation-area">
            {confirmed ? (
              <div className="confirmed-state"><Icon name="checkCircle" size={20} /><div><strong>Review confirmed</strong><span>Demo confirmation recorded. This does not authorize dispensing.</span></div><button className="secondary-button" onClick={resetReview}><Icon name="refresh" size={15} /> Start again</button></div>
            ) : (
              <><button className="confirm-button" onClick={() => canConfirm ? setConfirmOpen(true) : showToast('Complete every field, review every line, and acknowledge all name warnings first.', 'error')} disabled={!isAnalyzed || !medicines.length}><Icon name="checkCircle" size={18} /> Confirm reviewed prescription <Icon name="arrow" size={17} /></button><div className="confirm-footnote"><Icon name="shield" size={13} /> Only a pharmacist can confirm. No automatic dispensing or prescribing.</div></>
            )}
          </div>
        </section>
      </div>
      <div className="bottom-disclaimer"><Icon name="info" size={15} /><span>Prototype disclaimer: extraction results and confidence values are simulated. Do not use this interface for clinical decisions or real dispensing.</span></div>
    </>
  );
}

function QueuePage({ onOpenWorkspace, confirmed }) {
  return (
    <div className="subpage-content">
      <div className="page-intro"><div><div className="page-kicker">WORK QUEUE</div><h1>Review queue</h1><p>Keep track of prescriptions awaiting a pharmacist's check.</p></div><button className="primary-button" onClick={onOpenWorkspace}><Icon name="scan" size={17} /> Open workspace</button></div>
      <div className="queue-toolbar"><div className="search-box"><Icon name="search" size={17} /><input placeholder="Search by prescription ID" aria-label="Search queue" /></div><span className="queue-filter">All prescriptions <Icon name="chevron" size={14} /></span></div>
      <section className="panel queue-panel">
        <div className="table-header queue-grid"><span>Prescription</span><span>Uploaded</span><span>Review status</span><span>Risk flags</span><span /></div>
        <div className="queue-row queue-grid"><div className="queue-id-cell"><div className="queue-file-icon"><Icon name="file" size={18} /></div><div><strong>RX-2408</strong><span>Sample patient Â· 2 lines</span></div></div><span className="muted-cell">Just now</span><span className={`queue-status ${confirmed ? 'queue-status-done' : 'queue-status-pending'}`}><i />{confirmed ? 'Confirmed (demo)' : 'Pending review'}</span><span className="flag-count"><Icon name="warning" size={14} /> 1 name flag</span><button className="row-open-button" onClick={onOpenWorkspace}>Open <Icon name="chevron" size={14} /></button></div>
        <div className="queue-row queue-grid"><div className="queue-id-cell"><div className="queue-file-icon pale"><Icon name="file" size={18} /></div><div><strong>RX-2407</strong><span>Sample patient Â· 1 line</span></div></div><span className="muted-cell">18 min ago</span><span className="queue-status queue-status-pending"><i />Pending review</span><span className="muted-cell">No flags</span><button className="row-open-button" onClick={() => onOpenWorkspace()}>Open <Icon name="chevron" size={14} /></button></div>
        <div className="queue-row queue-grid"><div className="queue-id-cell"><div className="queue-file-icon pale"><Icon name="file" size={18} /></div><div><strong>RX-2406</strong><span>Sample patient Â· 3 lines</span></div></div><span className="muted-cell">42 min ago</span><span className="queue-status queue-status-pending"><i />Pending review</span><span className="muted-cell">No flags</span><button className="row-open-button" onClick={() => onOpenWorkspace()}>Open <Icon name="chevron" size={14} /></button></div>
      </section>
      <div className="bottom-disclaimer"><Icon name="info" size={15} /><span>Queue entries are example data for a hackathon prototype, not real patient records.</span></div>
    </div>
  );
}

function SafetyPage() {
  return (
    <div className="subpage-content">
      <div className="page-intro"><div><div className="page-kicker">MEDICATION SAFETY</div><h1>Drug safety checks</h1><p>Surface potential name confusion so a pharmacist can verify it against a trusted reference.</p></div><span className="mode-chip"><span /> DEMO EXAMPLE</span></div>
      <div className="safety-hero panel"><div className="safety-hero-icon"><Icon name="shield" size={25} /></div><div><h2>Similarity is a warning signal, not a diagnosis</h2><p>A production version should use a validated drug catalogue and a curated look-alike / sound-alike (LASA) reference. Never treat model similarity alone as proof that two medicines are interchangeable.</p></div></div>
      <div className="safety-example-grid">
        <section className="panel safety-example-card"><div className="eyebrow">ILLUSTRATIVE NAME CHECK</div><div className="name-pair"><div className="name-chip name-chip-alert"><span>H</span><div><strong>Hydroxyzine</strong><small>Detected sample name</small></div></div><div className="similarity-icon"><Icon name="arrow" size={20} /></div><div className="name-chip"><span>H</span><div><strong>Hydralazine</strong><small>Potential look-alike</small></div></div></div><div className="notice-box"><Icon name="warning" size={17} /><p>This pair is shown only to demonstrate the UI. Production warnings must be sourced from a trusted, versioned medication-safety dataset.</p></div></section>
        <section className="panel safety-checklist-card"><div className="eyebrow">REVIEW CHECKLIST</div><h2>Before confirming a flagged line</h2><div className="safety-check-row"><span>01</span><p>Compare the extracted name with the original prescription image.</p><Icon name="checkCircle" size={17} /></div><div className="safety-check-row"><span>02</span><p>Verify strength, formulation, dose and directions.</p><Icon name="checkCircle" size={17} /></div><div className="safety-check-row"><span>03</span><p>Consult your organisation's approved medicine reference and escalation policy.</p><Icon name="checkCircle" size={17} /></div></section>
      </div>
      <div className="bottom-disclaimer"><Icon name="info" size={15} /><span>This page is educational UI content, not a clinical reference or substitute for professional judgment.</span></div>
    </div>
  );
}

function AuditPage({ auditEvents, confirmed }) {
  return (
    <div className="subpage-content">
      <div className="page-intro"><div><div className="page-kicker">TRACEABILITY</div><h1>Audit trail</h1><p>Track the steps taken while reviewing the current demo prescription.</p></div><span className={`audit-status ${confirmed ? 'audit-status-confirmed' : ''}`}><span />{confirmed ? 'Confirmation recorded' : 'Review in progress'}</span></div>
      <section className="panel audit-panel"><div className="panel-heading"><div><div className="eyebrow">CURRENT CASE</div><h2>RX-2408 activity</h2></div><span className="prescription-id">DEMO RECORD</span></div>
        {auditEvents.length ? <div className="audit-timeline">{auditEvents.map((event, index) => <div className="audit-event" key={event.id}><div className={`audit-event-icon ${event.kind || ''}`}><Icon name={event.icon || 'clock'} size={16} /></div><div className="audit-event-copy"><strong>{event.title}</strong><p>{event.detail}</p><span>{event.time}</span></div>{index === 0 && <span className="latest-tag">LATEST</span>}</div>)}</div> : <div className="empty-results"><div className="empty-results-icon"><Icon name="clock" size={25} /></div><strong>No activity yet</strong><p>Upload a prescription or make a review change to create demo activity.</p></div>}
      </section>
      <div className="bottom-disclaimer"><Icon name="info" size={15} /><span>Audit history is kept only in this browser session and is not a production audit log.</span></div>
    </div>
  );
}

function ConfirmModal({ onCancel, onConfirm, medicineCount }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <button className="modal-close icon-button" onClick={onCancel} aria-label="Close confirmation"><Icon name="x" size={18} /></button>
        <div className="modal-icon"><Icon name="shield" size={25} /></div>
        <div className="eyebrow">FINAL HUMAN CHECK</div><h2 id="confirm-title">Confirm pharmacist review?</h2>
        <p>You are confirming that you reviewed all {medicineCount} displayed medicine line(s), checked their fields against the source, and acknowledged every name-similarity warning.</p>
        <div className="modal-warning"><Icon name="warning" size={17} /><span>This prototype records a demo review only. It does not validate clinical correctness or authorize dispensing.</span></div>
        <div className="modal-actions"><button className="secondary-button" onClick={onCancel}>Go back</button><button className="primary-button" onClick={onConfirm}><Icon name="checkCircle" size={17} /> Confirm review</button></div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState('workspace');
  const [medicines, setMedicines] = useState(() => DEMO_MEDICINES.map(item => ({ ...item, confidence: { ...item.confidence } })));
  const [imageSrc, setImageSrc] = useState('/sample-prescription.svg');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [rawOCRText, setRawOCRText] = useState('');
  const [fileName, setFileName] = useState('sample-prescription.svg');
  const [isUploaded, setIsUploaded] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDemoOutput, setIsDemoOutput] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [auditEvents, setAuditEvents] = useState([{ id: 'evt-1', title: 'Demo prescription opened', detail: 'Synthetic sample loaded into the review workspace.', time: 'Just now', icon: 'file', kind: '' }]);
  const inputRef = useRef(null);

  const createAuditEvent = (title, detail, icon = 'clock', kind = '') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAuditEvents(current => [{ id: `${Date.now()}-${Math.random()}`, title, detail, time: `Today Â· ${time}`, icon, kind }, ...current]);
  };
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(current => current.message === message ? { message: '', type: 'success' } : current), 4200);
  };
  const handleUploadClick = () => inputRef.current?.click();
  const handleFileSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file (JPG, PNG, or WEBP).', 'error');
      event.target.value = '';
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      showToast('Choose an image smaller than 12 MB for this prototype.', 'error');
      event.target.value = '';
      return;
    }
    setUploadedFile(file);
    setRawOCRText('');
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result));
      setFileName(file.name);
      setIsUploaded(true);
      setIsAnalyzed(false);
      setIsDemoOutput(false);
      setMedicines([]);
      setConfirmed(false);
      createAuditEvent('Prescription image uploaded', `${file.name} selected. No OCR processing has run.`, 'upload');
      showToast('Image loaded. Use the demo extraction button to preview the UI with sample output.', 'success');
    };
    reader.onerror = () => showToast('The image could not be opened. Try another file.', 'error');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleAnalyze = async () => {
    if (isAnalyzing) return;

    if (!uploadedFile) {
      showToast('Please upload a prescription image first.', 'error');
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch(
        'http://127.0.0.1:8000/api/prescriptions/extract',
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || `OCR request failed: ${response.status}`
        );
      }

      const recognizedText =
        typeof result.text === 'string' ? result.text : '';

      setRawOCRText(recognizedText);
      setMedicines([]);
      setIsAnalyzed(true);
      setIsDemoOutput(false);
      setConfirmed(false);

      createAuditEvent(
        'Prescription OCR completed',
        `Cloud Vision returned ${recognizedText.length} characters of text.`,
        'scan',
        'audit-event-blue'
      );

      if (recognizedText.trim()) {
        showToast(
          'OCR completed. Verify the extracted text carefully.',
          'success'
        );
      } else {
        showToast(
          'No readable text found. Try a clearer image.',
          'error'
        );
      }
    } catch (error) {
      setIsAnalyzed(false);
      showToast(
        error.message || 'Cannot connect to the OCR backend.',
        'error'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetReview = () => {
    setMedicines(DEMO_MEDICINES.map(item => ({ ...item, confidence: { ...item.confidence }, reviewed: false, safetyAcknowledged: false })));
    setConfirmed(false);
    setIsAnalyzed(true);
    setIsDemoOutput(true);
    setIsUploaded(false);
    setImageSrc('/sample-prescription.svg');
    setFileName('sample-prescription.svg');
    createAuditEvent('Review restarted', 'Reset review status and reloaded the synthetic prescription.', 'refresh');
    showToast('Review reset to the sample prescription.', 'success');
    setActiveNav('workspace');
  };
  const finishConfirmation = () => {
    setConfirmOpen(false);
    setConfirmed(true);
    createAuditEvent('Pharmacist review confirmed', 'Demo confirmation recorded after all line checks and name warning acknowledgement.', 'checkCircle', 'audit-event-green');
    showToast('Demo review confirmation recorded.', 'success');
  };

  const pageInfo = useMemo(() => ({
    workspace: { title: 'Review workspace', subtitle: 'Prescription review' },
    queue: { title: 'Review queue', subtitle: 'Review queue' },
    safety: { title: 'Drug safety', subtitle: 'Drug safety' },
    audit: { title: 'Audit trail', subtitle: 'Audit trail' },
  }[activeNav]), [activeNav]);

  return (
    <div className="app-shell">
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} confirmed={confirmed} />
      <main className="main-area">
        <Topbar title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <div className={`page-content ${activeNav !== 'workspace' ? 'page-content-subpage' : ''}`}>
          {activeNav === 'workspace' && <Workspace medicines={medicines} setMedicines={setMedicines} imageSrc={imageSrc} fileName={fileName} isUploaded={isUploaded} onUploadClick={handleUploadClick} inputRef={inputRef} isAnalyzed={isAnalyzed} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} confirmed={confirmed} setConfirmOpen={setConfirmOpen} showToast={showToast} resetReview={resetReview} isDemoOutput={isDemoOutput} rawOCRText={rawOCRText} />}
          {activeNav === 'queue' && <QueuePage onOpenWorkspace={() => setActiveNav('workspace')} confirmed={confirmed} />}
          {activeNav === 'safety' && <SafetyPage />}
          {activeNav === 'audit' && <AuditPage auditEvents={auditEvents} confirmed={confirmed} />}
        </div>
        <footer className="app-footer"><span>Â© 2026 MedMatch Rx <i /> Hackathon prototype</span><span>Built around a simple principle: <strong>AI assists. Pharmacists decide.</strong></span></footer>
      </main>
      <input ref={inputRef} type="file" accept="image/*" className="visually-hidden" onChange={handleFileSelected} aria-label="Upload prescription image" />
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      {confirmOpen && <ConfirmModal onCancel={() => setConfirmOpen(false)} onConfirm={finishConfirmation} medicineCount={medicines.length} />}
    </div>
  );
}

