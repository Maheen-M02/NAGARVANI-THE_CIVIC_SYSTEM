import { supabase } from '../config/supabase';

// SHA-256 using Web Crypto API (browser-native, no dependencies)
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate hash: SHA-256(previous_hash + complaint_id + action + canonical_timestamp)
export async function generateHash(previousHash, complaintId, action, timestamp) {
  return sha256(`${previousHash}${complaintId}${action}${timestamp}`);
}

async function getLastBlock(complaintId) {
  try {
    const { data, error } = await supabase
      .from('audit_blocks')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('block_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Could not fetch last block:', err.message);
    return null;
  }
}

async function insertBlock(block) {
  try {
    const { data, error } = await supabase
      .from('audit_blocks')
      .insert([block])
      .select()
      .single();
    if (error) throw error;
    return { success: true, block: data };
  } catch (err) {
    console.warn('Block insert failed, using local fallback:', err.message);
    return { success: false, block: saveLocalBlock(block) };
  }
}

function saveLocalBlock(block) {
  try {
    const key = `audit_${block.complaint_id}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const localBlock = { ...block, isLocal: true };
    existing.push(localBlock);
    localStorage.setItem(key, JSON.stringify(existing));
    return localBlock;
  } catch (e) {
    return { ...block, isLocal: true };
  }
}

// ============================================================
// PUBLIC API
// ============================================================

export async function createGenesisBlock(complaintId, data = {}) {
  // canonical_timestamp is stored in data so verification uses
  // the exact same string — not the DB-normalized timestamptz
  const canonicalTimestamp = new Date().toISOString();
  const previousHash = 'GENESIS';
  const action = 'complaint_created';
  const hash = await generateHash(previousHash, complaintId, action, canonicalTimestamp);

  return insertBlock({
    complaint_id: complaintId,
    action,
    data: { ...data, canonical_timestamp: canonicalTimestamp },
    timestamp: canonicalTimestamp,
    previous_hash: previousHash,
    hash,
    block_index: 0
  });
}

export async function addBlock(complaintId, action, data = {}) {
  try {
    const lastBlock = await getLastBlock(complaintId);
    const previousHash = lastBlock ? lastBlock.hash : 'GENESIS';
    const blockIndex = lastBlock ? lastBlock.block_index + 1 : 0;
    const canonicalTimestamp = new Date().toISOString();
    const hash = await generateHash(previousHash, complaintId, action, canonicalTimestamp);

    return insertBlock({
      complaint_id: complaintId,
      action,
      data: { ...data, canonical_timestamp: canonicalTimestamp },
      timestamp: canonicalTimestamp,
      previous_hash: previousHash,
      hash,
      block_index: blockIndex
    });
  } catch (err) {
    console.warn('addBlock failed:', err.message);
    const canonicalTimestamp = new Date().toISOString();
    return { success: false, block: saveLocalBlock({
      id: Date.now().toString(),
      complaint_id: complaintId,
      action,
      data: { ...data, canonical_timestamp: canonicalTimestamp },
      timestamp: canonicalTimestamp,
      previous_hash: 'LOCAL',
      hash: 'local_' + Math.random().toString(36).slice(2, 10),
      block_index: 0
    })};
  }
}

export async function getAuditChain(complaintId) {
  try {
    const { data, error } = await supabase
      .from('audit_blocks')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('block_index', { ascending: true });

    if (error) throw error;

    // Merge with any local fallback blocks
    const localBlocks = JSON.parse(localStorage.getItem(`audit_${complaintId}`) || '[]');
    const allBlocks = [...(data || [])];
    localBlocks.forEach(lb => {
      if (!allBlocks.find(b => b.id === lb.id)) allBlocks.push(lb);
    });

    return allBlocks.sort((a, b) => a.block_index - b.block_index);
  } catch (err) {
    console.warn('Could not fetch audit chain:', err.message);
    return JSON.parse(localStorage.getItem(`audit_${complaintId}`) || '[]');
  }
}

export async function verifyChain(complaintId) {
  const blocks = await getAuditChain(complaintId);

  if (blocks.length === 0) {
    return { valid: false, message: 'No blocks found', blocks: [], totalBlocks: 0 };
  }

  const results = [];
  let valid = true;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const expectedPrevHash = i === 0 ? 'GENESIS' : blocks[i - 1].hash;

    if (block.isLocal) {
      results.push({ ...block, verified: true, note: 'Local block' });
      continue;
    }

    // Use canonical_timestamp from data (exact string used at creation)
    // Falls back to DB timestamp for old blocks
    const timestampForHash = block.data?.canonical_timestamp || block.timestamp;

    const recomputedHash = await generateHash(
      block.previous_hash,
      block.complaint_id,
      block.action,
      timestampForHash
    );

    const hashMatch = recomputedHash === block.hash;
    const prevHashMatch = block.previous_hash === expectedPrevHash;
    const blockValid = hashMatch && prevHashMatch;

    if (!blockValid) valid = false;

    results.push({ ...block, verified: blockValid, hashMatch, prevHashMatch, recomputedHash });
  }

  return {
    valid,
    message: valid ? '✅ Chain integrity verified' : '⚠️ Chain tampered or corrupted',
    blocks: results,
    totalBlocks: blocks.length
  };
}

export const ACTION_LABELS = {
  complaint_created:  { label: 'Complaint Created',        icon: '📝', color: '#0ea5e9' },
  status_updated:     { label: 'Status Updated',           icon: '🔄', color: '#f59e0b' },
  assigned_officer:   { label: 'Assigned to Officer',      icon: '👮', color: '#8b5cf6' },
  assigned_volunteer: { label: 'Assigned to Volunteer',    icon: '🙋', color: '#06b6d4' },
  complaint_resolved: { label: 'Complaint Resolved',       icon: '✅', color: '#22c55e' },
  image_uploaded:     { label: 'Image Proof Uploaded',     icon: '📷', color: '#ec4899' },
  escalated:          { label: 'Complaint Escalated',      icon: '⚠️', color: '#ef4444' },
  comment_added:      { label: 'Comment Added',            icon: '💬', color: '#64748b' }
};
