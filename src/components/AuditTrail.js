import React, { useState, useEffect, useCallback } from 'react';
import { getAuditChain, verifyChain, ACTION_LABELS } from '../lib/auditChain';

export default function AuditTrail({ complaintId, ticketId }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const loadChain = useCallback(async () => {
    if (!complaintId) return;
    setLoading(true);
    try {
      const chain = await getAuditChain(complaintId);
      setBlocks(chain);
    } catch (err) {
      console.error('Failed to load audit chain:', err);
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => { loadChain(); }, [loadChain]);

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyChain(complaintId);
      setVerifyResult(result);
    } catch (err) {
      setVerifyResult({ valid: false, message: 'Verification failed: ' + err.message });
    } finally {
      setVerifying(false);
    }
  };

  const shortHash = (hash) => {
    if (!hash || hash === 'GENESIS' || hash === 'LOCAL') return hash;
    return `0x${hash.slice(0, 4).toUpperCase()}...${hash.slice(-4).toUpperCase()}`;
  };

  const timeStr = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={S.container}>
        <div style={S.header}>
          <span style={{ fontSize: '1.25rem' }}>⛓️</span>
          <span style={S.headerTitle}>Blockchain Audit Trail</span>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          ⏳ Loading audit chain...
        </div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⛓️</span>
          <div>
            <div style={S.headerTitle}>Blockchain Audit Trail</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 2 }}>
              {ticketId && (
                <span style={S.ticketBadge}>{ticketId}</span>
              )}
              <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                {blocks.length} block{blocks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={S.verifiedBadge}>🔒 Blockchain Verified</div>
          <button onClick={handleVerify} disabled={verifying} style={S.verifyBtn}>
            {verifying ? '⏳ Verifying...' : '🔍 Verify Chain'}
          </button>
        </div>
      </div>

      {/* Verify result banner */}
      {verifyResult && (
        <div style={{
          margin: '0.75rem 1.25rem 0',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: verifyResult.valid ? '#dcfce7' : '#fee2e2',
          border: `2px solid ${verifyResult.valid ? '#22c55e' : '#ef4444'}`,
          color: verifyResult.valid ? '#166534' : '#991b1b'
        }}>
          <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>{verifyResult.message}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: 2 }}>
            {verifyResult.totalBlocks} blocks verified •{' '}
            {verifyResult.valid ? 'All hashes match' : 'Hash mismatch detected'}
          </div>
        </div>
      )}

      {/* Empty state */}
      {blocks.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
          No audit records found
        </div>
      )}

      {/* Timeline */}
      <div style={{ padding: '1.25rem' }}>
        {blocks.map((block, i) => {
          const meta = ACTION_LABELS[block.action] || { label: block.action, icon: '📌', color: '#64748b' };
          const isLatest = i === blocks.length - 1;
          const isExpanded = expanded === block.id;
          const verifiedBlock = verifyResult?.blocks?.find(b => b.id === block.id);

          return (
            <div key={block.id || i} style={{ display: 'flex', gap: '0.875rem', marginBottom: i < blocks.length - 1 ? '0.875rem' : 0, position: 'relative' }}>
              {/* Vertical line */}
              {i < blocks.length - 1 && (
                <div style={{ position: 'absolute', left: '1.125rem', top: '2.5rem', width: 2, height: 'calc(100% + 0.875rem)', background: '#1e293b', zIndex: 0 }} />
              )}

              {/* Icon */}
              <div style={{
                width: '2.25rem', height: '2.25rem', borderRadius: '50%', flexShrink: 0,
                background: meta.color + '20', border: `2px solid ${meta.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.875rem', zIndex: 1, marginTop: 2
              }}>
                {meta.icon}
              </div>

              {/* Card */}
              <div style={{
                flex: 1, background: '#1e293b', borderRadius: '10px', padding: '0.875rem 1rem',
                border: `1.5px solid ${isLatest ? meta.color : '#334155'}`,
                boxShadow: isLatest ? `0 0 0 3px ${meta.color}20` : 'none'
              }}>
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem',
                        borderRadius: '5px', color: meta.color, background: meta.color + '18'
                      }}>
                        {meta.label}
                      </span>
                      {isLatest && <span style={S.latestBadge}>LATEST</span>}
                      {block.isLocal && <span style={S.localBadge}>LOCAL</span>}
                      {verifiedBlock && (
                        <span style={{ fontSize: '0.75rem' }}>{verifiedBlock.verified ? '✅' : '❌'}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 3 }}>
                      {timeStr(block.timestamp)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={S.blockIndex}>#{block.block_index}</span>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : block.id)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.7rem', padding: '0.2rem' }}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Hash row */}
                <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0.625rem', background: '#0f172a', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={S.hashLabel}>HASH</span>
                    <code style={{ ...S.hashValue, color: meta.color }}>{shortHash(block.hash)}</code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={S.hashLabel}>PREV</span>
                    <code style={S.hashValue}>{shortHash(block.previous_hash)}</code>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#0f172a', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      ['Full Hash', block.hash],
                      ['Previous Hash', block.previous_hash],
                      ['Block ID', block.id]
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div style={S.expandLabel}>{label}</div>
                        <code style={S.expandValue}>{val}</code>
                      </div>
                    ))}
                    {block.data && Object.keys(block.data).filter(k => k !== 'canonical_timestamp').length > 0 && (
                      <div>
                        <div style={S.expandLabel}>Data</div>
                        <pre style={{ ...S.expandValue, whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'auto', margin: 0 }}>
                          {JSON.stringify(
                            Object.fromEntries(Object.entries(block.data).filter(([k]) => k !== 'canonical_timestamp')),
                            null, 2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem', borderTop: '1px solid #1e293b', fontSize: '0.65rem', color: '#475569', fontWeight: '600' }}>
        <span>⛓️ SHA-256 Blockchain</span>
        <span>•</span>
        <span>Immutable • Tamper-proof • Transparent</span>
      </div>
    </div>
  );
}

const S = {
  container: { background: '#0f172a', borderRadius: '14px', overflow: 'hidden', border: '1px solid #1e293b' },
  header: {
    background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
    padding: '1rem 1.25rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid #1e293b', flexWrap: 'wrap', gap: '0.5rem'
  },
  headerTitle: { fontSize: '0.9rem', fontWeight: '700', color: '#f1f5f9' },
  ticketBadge: {
    fontSize: '0.65rem', fontWeight: '700', color: '#00c2e0',
    background: 'rgba(0,194,224,0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px'
  },
  verifiedBadge: {
    fontSize: '0.65rem', fontWeight: '700', color: '#22c55e',
    background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
    padding: '0.3rem 0.625rem', borderRadius: '999px'
  },
  verifyBtn: {
    fontSize: '0.7rem', fontWeight: '700', color: '#00c2e0',
    background: 'rgba(0,194,224,0.1)', border: '1px solid rgba(0,194,224,0.3)',
    padding: '0.3rem 0.75rem', borderRadius: '999px', cursor: 'pointer'
  },
  latestBadge: {
    fontSize: '0.55rem', fontWeight: '800', color: '#f59e0b',
    background: 'rgba(245,158,11,0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px', letterSpacing: '1px'
  },
  localBadge: {
    fontSize: '0.55rem', fontWeight: '800', color: '#94a3b8',
    background: 'rgba(148,163,184,0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px'
  },
  blockIndex: {
    fontSize: '0.65rem', fontWeight: '700', color: '#475569',
    background: '#0f172a', padding: '0.1rem 0.4rem', borderRadius: '4px'
  },
  hashLabel: { fontSize: '0.55rem', fontWeight: '800', color: '#475569', letterSpacing: '1px' },
  hashValue: { fontSize: '0.7rem', fontFamily: 'monospace', color: '#94a3b8' },
  expandLabel: { fontSize: '0.6rem', fontWeight: '700', color: '#475569', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 },
  expandValue: { fontSize: '0.65rem', fontFamily: 'monospace', color: '#94a3b8', background: '#1e293b', padding: '0.3rem 0.4rem', borderRadius: '4px', wordBreak: 'break-all', display: 'block' }
};
