import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import { ROUND_CRITERIA, ROUND2_CRITERIA, scoreTotalFor, scoreOutOf10For } from '../../services/dbStore';
import { todayISO, stageLabel, stageIndex } from '../../services/utils';

const ScoreSheetModal = () => {
  const { db, updateDb, modalParams, closeModal, showToast } = useAuth();
  const app = modalParams ? modalParams.app : null;
  const round = modalParams ? modalParams.round || 1 : 1;

  const criteria = round === 1 ? ROUND_CRITERIA : ROUND2_CRITERIA;
  const existingR = app && app.rounds ? (round === 1 ? app.rounds.r1 : app.rounds.r2) : null;

  const [marks, setMarks] = useState(() => {
    if (existingR && existingR.attempts && existingR.attempts.length > 0) {
      return { ...existingR.attempts[existingR.attempts.length - 1].marks };
    }
    const initial = {};
    criteria.forEach(c => {
      c.sub.forEach(q => {
        initial[q.key] = q.options[0] ? q.options[0].value : 0;
      });
    });
    return initial;
  });

  const [remarks, setRemarks] = useState(existingR && existingR.attempts && existingR.attempts.length ? existingR.attempts[existingR.attempts.length - 1].remarks : '');
  const [outcome, setOutcome] = useState(existingR ? existingR.status || 'selected' : 'selected');

  if (!app) return null;

  const totalScore = scoreTotalFor(marks, criteria);
  const score10 = scoreOutOf10For(marks, criteria);

  const handleOptionSelect = (qKey, val) => {
    setMarks(prev => ({ ...prev, [qKey]: Number(val) }));
  };

  const handleSaveScore = () => {
    const attempt = {
      date: todayISO(),
      marks,
      total: totalScore,
      scoreOutOf10: score10,
      outcome,
      remarks: remarks.trim(),
      by: round === 1 ? 'Arun Kumar R' : 'Sakthivel S'
    };

    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        const rounds = { ...(a.rounds || {}) };
        const roundKey = round === 1 ? 'r1' : 'r2';
        rounds[roundKey] = {
          attempts: [attempt],
          status: outcome,
          scoreOutOf10: score10,
          total: totalScore,
          date: attempt.date,
          by: attempt.by,
          remarks: attempt.remarks,
          outcome
        };

        let newStage = a.stage;
        let newStatus = a.status;

        if (outcome === 'selected') {
          if (round === 1 && stageIndex(a.stage) < stageIndex('ced_evaluation')) {
            newStage = 'ced_evaluation';
          } else if (round === 2) {
            newStage = 'data_collection';
          }
          newStatus = 'selected';
        } else if (outcome === 'rejected') {
          newStatus = 'rejected';
        }

        const history = [
          ...(a.history || []),
          {
            date: todayISO(),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            user: attempt.by,
            action: `Round ${round} Scored: ${score10}/10`,
            from: stageLabel(a.stage),
            to: stageLabel(newStage),
            remarks: attempt.remarks || `Decision: ${outcome}`
          }
        ];

        return { ...a, rounds, stage: newStage, status: newStatus, history };
      }
      return a;
    });

    updateDb({ ...db, applications: updatedApps });
    showToast(`Round ${round} score saved (${score10}/10)`, 'success');
    closeModal();
  };

  return (
    <div>
      <div className="modal-head">
        <h3>CED Evaluation Voucher &mdash; Round {round}</h3>
        <button className="x" onClick={closeModal}><Icon name="x" /></button>
      </div>

      <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
        <div style={{ background: 'var(--navy-900)', color: '#fff', padding: '14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justify: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>{app.applicantName}</div>
            <div style={{ fontSize: '12px', color: 'var(--cyan-300)' }}>{app.applicationId} &middot; {app.ideaName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyan-400)' }}>{score10} <span style={{ fontSize: '14px', color: '#fff' }}>/ 10</span></div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Total Marks: {totalScore}</div>
          </div>
        </div>

        {criteria.map((c, idx) => (
          <div key={c.key} className="card" style={{ padding: '14px', marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--navy-900)', marginBottom: '8px' }}>
              {idx + 1}. {c.label} (Max {c.weight} pts)
            </div>
            {c.sub.map(q => (
              <div key={q.key} style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--slate-700)', marginBottom: '6px' }}>{q.label}</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {q.options.map(opt => {
                    const isSelected = marks[q.key] === opt.value;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid var(--cyan-600)' : '1px solid var(--slate-300)',
                          background: isSelected ? 'var(--cyan-50)' : '#fff',
                          color: isSelected ? 'var(--cyan-700)' : 'var(--slate-700)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleOptionSelect(q.key, opt.value)}
                      >
                        {opt.label} ({opt.value} pts)
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="card" style={{ padding: '14px', marginTop: '16px' }}>
          <div className="form-field" style={{ marginBottom: '12px' }}>
            <label>Decision / Outcome</label>
            <select className="tbl-filter" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="selected">Selected / Advanced</option>
              <option value="pending">Waiting / Pending Re-attempt</option>
              <option value="rejected">Not Selected / Rejected</option>
            </select>
          </div>

          <div className="form-field">
            <label>Evaluator Remarks</label>
            <textarea
              rows="2"
              placeholder="Enter feedback for student or CED records..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="modal-foot">
        <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSaveScore}>
          <Icon name="save" /> Save Evaluation ({score10}/10)
        </button>
      </div>
    </div>
  );
};

export default ScoreSheetModal;
