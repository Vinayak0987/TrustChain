import { supabase } from './supabaseClient';

// ─── Profile ──────────────────────────────────────────────────────────────────
export const fetchUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) console.error('fetchUserProfile:', error);
  return data;
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) console.error('updateUserProfile:', error);
  return { data, error };
};

export const updateWalletAddress = async (userId, walletAddress) => {
  return updateUserProfile(userId, { wallet_address: walletAddress });
};

export const updateTrustScore = async (userId, score) => {
  const { data: prev } = await supabase
    .from('profiles')
    .select('trust_score')
    .eq('id', userId)
    .single();

  await updateUserProfile(userId, { trust_score: score });

  // Record history entry
  await supabase.from('trust_score_history').insert({
    user_id: userId,
    score,
    month_label: new Date().toLocaleString('en-IN', { month: 'short' }),
  });

  return score;
};

// ─── Loans ────────────────────────────────────────────────────────────────────
export const createLoan = async ({ userId, amount, purpose, story, periodMonths, riskTier, interestRate }) => {
  const totalOwed = Math.round(amount * (1 + interestRate / 100));
  const { data, error } = await supabase
    .from('loans')
    .insert({
      user_id: userId,
      amount,
      purpose,
      story,
      period_months: periodMonths,
      risk_tier: riskTier,
      status: 'pending',
      interest_rate: interestRate,
      total_owed: totalOwed,
    })
    .select()
    .single();
  if (error) console.error('createLoan:', error);
  return { data, error };
};

export const fetchUserLoans = async (userId) => {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) console.error('fetchUserLoans:', error);
  return data || [];
};

export const fetchLenderLoans = async (funderId) => {
  const { data, error } = await supabase
    .from('loans')
    .select('*, profiles!loans_user_id_fkey(full_name, avatar_color, trust_score)')
    .eq('funded_by', funderId)
    .order('created_at', { ascending: false });
  if (error) console.error('fetchLenderLoans:', error);
  return data || [];
};

export const fetchOpenLoans = async () => {
  const { data, error } = await supabase
    .from('loans')
    .select('*, profiles!loans_user_id_fkey(full_name, avatar_color, trust_score, kyc_status)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) console.error('fetchOpenLoans:', error);
  return data || [];
};

export const updateLoanStatus = async (loanId, updates) => {
  const { data, error } = await supabase
    .from('loans')
    .update(updates)
    .eq('id', loanId)
    .select()
    .maybeSingle();
  if (error) console.error('updateLoanStatus:', error);
  return { data, error };
};

export const fundLoan = async (loanId, funderId) => {
  return updateLoanStatus(loanId, { status: 'active', funded_by: funderId });
};

export const repayLoan = async (loanId) => {
  return updateLoanStatus(loanId, { status: 'repaid' });
};

// ─── Transactions ──────────────────────────────────────────────────────────────
export const createTransaction = async ({ userId, type, actorName, amount, relatedLoanId }) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type,
      actor_name: actorName,
      amount,
      related_loan_id: relatedLoanId || null,
    })
    .select()
    .maybeSingle();
  if (error) console.error('createTransaction:', error);
  return { data, error };
};

export const fetchAllTransactions = async (limit = 30) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) console.error('fetchAllTransactions:', error);
  return data || [];
};

export const fetchUserTransactions = async (userId, limit = 20) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) console.error('fetchUserTransactions:', error);
  return data || [];
};

// ─── Communities ──────────────────────────────────────────────────────────────
const generateInviteCode = (name, userId) =>
  btoa(`${name}::${userId}::${Date.now()}`)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
    .toUpperCase();

export const createCommunity = async ({ name, description, adminId }) => {
  const inviteCode = generateInviteCode(name, adminId);
  const { data: community, error } = await supabase
    .from('communities')
    .insert({ name, description, admin_id: adminId, invite_code: inviteCode })
    .select()
    .single();
  if (error) { console.error('createCommunity:', error); return { data: null, error }; }

  // Add admin as first member
  await supabase.from('community_members').insert({
    community_id: community.id,
    user_id: adminId,
    role: 'admin',
  });

  return { data: community, error: null };
};

export const joinCommunity = async ({ inviteCode, userId }) => {
  // Find the community by invite code
  const { data: community, error: findErr } = await supabase
    .from('communities')
    .select('*')
    .eq('invite_code', inviteCode.trim().toUpperCase())
    .single();

  if (findErr || !community) return { data: null, error: findErr || new Error('Invalid invite code') };

  // Check if already a member
  const { data: existing } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', community.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return { data: null, error: new Error('Already a member') };

  const { error: joinErr } = await supabase
    .from('community_members')
    .insert({ community_id: community.id, user_id: userId, role: 'member' });

  if (joinErr) { console.error('joinCommunity:', joinErr); return { data: null, error: joinErr }; }

  return { data: community, error: null };
};

export const leaveCommunity = async ({ communityId, userId }) => {
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId);
  if (error) console.error('leaveCommunity:', error);
  return { error };
};

export const fetchUserCommunity = async (userId) => {
  const { data: membership, error } = await supabase
    .from('community_members')
    .select('*, communities(*)')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) console.error('fetchUserCommunity:', error);
  if (!membership) return null;

  // Also fetch all members
  const { data: members } = await supabase
    .from('community_members')
    .select('*, profiles(full_name, avatar_color)')
    .eq('community_id', membership.community_id);

  return { ...membership.communities, members: members || [], userRole: membership.role };
};

// ─── Vouchers ──────────────────────────────────────────────────────────────────
export const fetchUserVouchers = async (userId) => {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*, profiles!vouchers_voucher_id_fkey(full_name, avatar_color, trust_score)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) console.error('fetchUserVouchers:', error);
  return data || [];
};

export const requestVoucher = async ({ userId, voucherEmail }) => {
  // For now, store a pending voucher entry with just user_id (voucher_id filled when someone confirms)
  const { data, error } = await supabase
    .from('vouchers')
    .insert({ user_id: userId, voucher_id: userId, status: 'pending' }) // placeholder
    .select()
    .single();
  if (error) console.error('requestVoucher:', error);
  return { data, error };
};

export const confirmVoucher = async (voucherId) => {
  const { data, error } = await supabase
    .from('vouchers')
    .update({ status: 'confirmed' })
    .eq('id', voucherId)
    .select()
    .single();
  if (error) console.error('confirmVoucher:', error);
  return { data, error };
};

// ─── Governance Votes ──────────────────────────────────────────────────────────
export const castGovernanceVote = async ({ userId, caseId, caseType, vote }) => {
  const { data, error } = await supabase
    .from('governance_votes')
    .upsert({ user_id: userId, case_id: caseId, case_type: caseType, vote },
             { onConflict: 'user_id,case_id,case_type' })
    .select()
    .single();
  if (error) console.error('castGovernanceVote:', error);
  return { data, error };
};

export const fetchUserVote = async ({ userId, caseId, caseType }) => {
  const { data, error } = await supabase
    .from('governance_votes')
    .select('vote')
    .eq('user_id', userId)
    .eq('case_id', caseId)
    .eq('case_type', caseType)
    .single();
  if (error && error.code !== 'PGRST116') console.error('fetchUserVote:', error);
  return data?.vote || null;
};

export const fetchVoteTallies = async ({ caseId, caseType }) => {
  const { data, error } = await supabase
    .from('governance_votes')
    .select('vote')
    .eq('case_id', caseId)
    .eq('case_type', caseType);
  if (error) { console.error('fetchVoteTallies:', error); return {}; }
  return (data || []).reduce((acc, row) => {
    acc[row.vote] = (acc[row.vote] || 0) + 1;
    return acc;
  }, {});
};

// ─── Endorsement Requests ─────────────────────────────────────────────────────
export const createEndorsementRequest = async ({ requesterId, communityId, message }) => {
  const { data, error } = await supabase
    .from('endorsement_requests')
    .insert({ requester_id: requesterId, community_id: communityId, message })
    .select()
    .single();
  if (error) console.error('createEndorsementRequest:', error);
  return { data, error };
};

export const fetchEndorsementRequests = async (communityId) => {
  const { data, error } = await supabase
    .from('endorsement_requests')
    .select('*, profiles!endorsement_requests_requester_id_fkey(full_name)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });
  if (error) console.error('fetchEndorsementRequests:', error);
  return data || [];
};

export const updateEndorsementRequest = async (id, { status, approvedBy }) => {
  const { data, error } = await supabase
    .from('endorsement_requests')
    .update({ status, approved_by: approvedBy })
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('updateEndorsementRequest:', error);
  return { data, error };
};

// ─── Community Loan Requests ──────────────────────────────────────────────────
export const createCommunityLoanRequest = async ({ requesterId, communityId, amount, purpose }) => {
  const { data, error } = await supabase
    .from('community_loan_requests')
    .insert({ requester_id: requesterId, community_id: communityId, amount, purpose })
    .select()
    .single();
  if (error) console.error('createCommunityLoanRequest:', error);
  return { data, error };
};

export const fetchCommunityLoanRequests = async (communityId) => {
  const { data, error } = await supabase
    .from('community_loan_requests')
    .select('*, profiles!community_loan_requests_requester_id_fkey(full_name)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });
  if (error) console.error('fetchCommunityLoanRequests:', error);
  return data || [];
};

export const fundCommunityLoan = async (requestId, funderId) => {
  const { data, error } = await supabase
    .from('community_loan_requests')
    .update({ status: 'funded', funded_by: funderId })
    .eq('id', requestId)
    .select()
    .single();
  if (error) console.error('fundCommunityLoan:', error);
  return { data, error };
};

// ─── Trust Score History ──────────────────────────────────────────────────────
export const fetchTrustScoreHistory = async (userId) => {
  const { data, error } = await supabase
    .from('trust_score_history')
    .select('score, month_label, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(12);
  if (error) console.error('fetchTrustScoreHistory:', error);
  return data || [];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const timeAgo = (isoString) => {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};
