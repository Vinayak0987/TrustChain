import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../utils/supabaseClient';
import {
  fetchUserCommunity,
  fetchUserVouchers,
  fetchTrustScoreHistory,
  updateTrustScore as dbUpdateTrustScore,
} from '../utils/supabaseService';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // ── Auth / Profile ────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Fetch full profile from Supabase
  const loadProfile = async (authUser) => {
    if (!authUser) return;
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    let profile = existingProfile;

    if (!profile) {
      const dbName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'New User';
      const payload = {
        id: authUser.id,
        full_name: dbName,
        role: 'borrower',
        trust_score: 50,
        kyc_status: 'pending',
        avatar_color: '#3B9B9B',
      };

      // Try creating the profile if it's missing (fails gracefully if RLS or Schema is locked)
      try {
        const { data: newProfile, error: insertErr } = await supabase
          .from('profiles')
          .insert(payload)
          .select()
          .maybeSingle();

        if (!insertErr && newProfile) {
          profile = newProfile;
        } else if (insertErr) {
          console.warn('Profile background sync pending (check RLS):', insertErr.message);
          profile = { ...payload, sync_pending: true };
        }
      } catch (e) {
        profile = { ...payload, sync_pending: true };
      }
    }

    if (profile) {
      const dbName = authUser.user_metadata?.full_name || profile.full_name || '';
      const merged = {
        ...authUser,
        ...profile,
        name: dbName,
        phone: authUser.phone || profile.phone_number || '',
        initials: dbName ? dbName.substring(0, 2).toUpperCase() : '??',
        kycStatus: profile.kyc_status,
        trustScore: profile.trust_score ?? 50,
        avatarColor: profile.avatar_color || '#3B9B9B',
        walletAddress: profile.wallet_address || null,
        role: profile.role || 'borrower',
        location: profile.location || '',
      };
      setUser(merged);
      setIsLoggedIn(true);

      // Load community, vouchers and trust history in background
      loadCommunityData(authUser.id);
      loadVouchersData(authUser.id);
      loadTrustHistory(authUser.id);
    }

  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user).finally(() => setAuthLoading(false));
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setCommunity(null);
        setVouchers([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── KYC ────────────────────────────────────────────────────────────────────
  const kycCompleted = user?.kycStatus === 'completed';

  // ── Trust Score ────────────────────────────────────────────────────────────
  // trustScore is stored in user.trustScore (from profile)
  // Provide a convenient setter that also persists to DB
  const [trustScore, setTrustScoreState] = useState(50);

  useEffect(() => {
    if (user?.trustScore !== undefined) {
      setTrustScoreState(user.trustScore);
    }
  }, [user?.trustScore]);

  const setTrustScore = async (valueOrUpdater) => {
    const newScore = typeof valueOrUpdater === 'function'
      ? valueOrUpdater(trustScore)
      : valueOrUpdater;

    setTrustScoreState(newScore);
    setUser(prev => prev ? { ...prev, trustScore: newScore } : prev);

    if (user?.id) {
      await dbUpdateTrustScore(user.id, Math.min(100, Math.max(0, newScore)));
    }
  };

  // Other trust factors (off-chain simulation)
  const [streak, setStreak] = useState(3);
  const [podStrength, setPodStrength] = useState('average');
  const [verification, setVerification] = useState('phone');

  // Keep trust score in sync with factors when no DB score exists
  useEffect(() => {
    if (!user?.id) {
      let base = 40;
      base += streak * 4;
      base += { weak: 0, average: 8, strong: 18 }[podStrength] || 0;
      base += { none: 0, phone: 5, ngo: 12 }[verification] || 0;
      setTrustScoreState(Math.min(100, base));
    }
  }, [streak, podStrength, verification, user?.id]);

  // ── Trust Score History ───────────────────────────────────────────────────
  const [trustHistory, setTrustHistory] = useState([]);
  const loadTrustHistory = async (userId) => {
    const history = await fetchTrustScoreHistory(userId);
    setTrustHistory(history);
  };

  // ── Community ─────────────────────────────────────────────────────────────
  const [community, setCommunity] = useState(null);  // full community object from Supabase
  const [communityLoading, setCommunityLoading] = useState(false);

  // Keep local off-chain state in sync for CommunityPage (legacy compat)
  const [communities, setCommunities] = useState([]);
  const [userCommunityId, setUserCommunityId] = useState(null);

  const loadCommunityData = async (userId) => {
    setCommunityLoading(true);
    const data = await fetchUserCommunity(userId);
    setCommunity(data);
    if (data) {
      setCommunities([data]);
      setUserCommunityId(data.id);
    }
    setCommunityLoading(false);
  };

  const refreshCommunity = (userId) => loadCommunityData(userId || user?.id);

  // ── Vouchers ───────────────────────────────────────────────────────────────
  const [vouchers, setVouchers] = useState([]);
  const loadVouchersData = async (userId) => {
    const data = await fetchUserVouchers(userId);
    setVouchers(data);
  };

  // ── Endorsement Requests (persisted via supabaseService via CommunityPage) ─
  const [endorsementRequests, setEndorsementRequests] = useState([]);

  // ── Community Loan Requests (persisted via supabaseService via CommunityPage)
  const [communityLoanRequests, setCommunityLoanRequests] = useState([]);

  // ── Loan UI state ─────────────────────────────────────────────────────────
  const [loanAmount, setLoanAmount] = useState(10000);
  const [loanWeeks, setLoanWeeks] = useState(8);
  const [loanPeriod, setLoanPeriod] = useState(3);

  // ── ID Verify steps ───────────────────────────────────────────────────────
  const [verifyStep, setVerifyStep] = useState(1);
  const [verifyDocType, setVerifyDocType] = useState(null);

  // ── Governance votes ──────────────────────────────────────────────────────
  const [hasVotedFraud, setHasVotedFraud] = useState(null);
  const [hasVotedGov, setHasVotedGov] = useState(null);

  const value = {
    // Auth
    user, setUser,
    isLoggedIn, setIsLoggedIn,
    onboardingStep, setOnboardingStep,
    authLoading,
    kycCompleted,
    loadProfile,

    // Trust
    trustScore, setTrustScore,
    streak, setStreak,
    podStrength, setPodStrength,
    verification, setVerification,
    trustHistory,
    loadTrustHistory,

    // Loan UI
    loanAmount, setLoanAmount,
    loanWeeks, setLoanWeeks,
    loanPeriod, setLoanPeriod,

    // Community
    community, setCommunity,
    communityLoading,
    communities, setCommunities,
    userCommunityId, setUserCommunityId,
    refreshCommunity,

    // Vouchers
    vouchers, setVouchers,

    // Endorsements / community loans (local optimistic state, synced from Supabase)
    endorsementRequests, setEndorsementRequests,
    communityLoanRequests, setCommunityLoanRequests,

    // ID Verify
    verifyStep, setVerifyStep,
    verifyDocType, setVerifyDocType,

    // Governance
    hasVotedFraud, setHasVotedFraud,
    hasVotedGov, setHasVotedGov,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Convenience hook
export const useApp = () => useContext(AppContext);
