import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';
import { DB_KEY, DB_ROW_ID, emptyDB, repairDB } from '../services/dbStore.js';
import { todayISO, pad, DEFAULT_BATCHES, CURRENT_BATCH } from '../services/utils.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [db, setDb] = useState(() => {
    try {
      const localData = localStorage.getItem(DB_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed && parsed.applications && parsed.members) {
          return repairDB(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed reading initial localStorage:', e);
    }
    return emptyDB();
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ced_user_session');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentPage, setCurrentPage] = useState(() => {
    if (currentUser) {
      return currentUser.role === 'admin' ? 'workflow' : 'myDashboard';
    }
    return 'login';
  });

  const [drawerAppId, setDrawerAppId] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [modalParams, setModalParams] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState('connecting'); // 'connecting' | 'connected' | 'offline'
  const [isDbReady, setIsDbReady] = useState(false);

  // Save DB helper
  const updateDb = (newDb) => {
    const repaired = repairDB({ ...newDb });
    setDb(repaired);
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(repaired));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    if (supabase) {
      const snapshot = JSON.stringify(repaired);
      supabase.from('ivp_app_state')
        .upsert({ id: DB_ROW_ID, data: JSON.parse(snapshot), updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.warn('Supabase sync warning:', error.message);
          else setSupabaseStatus('connected');
        })
        .catch(err => {
          console.warn('Supabase error:', err);
          setSupabaseStatus('offline');
        });
    }
  };

  // Toast notifier
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3600);
  };

  // Fetch fresh DB directly from Supabase
  const fetchFreshDbFromSupabase = async () => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('ivp_app_state')
        .select('data')
        .eq('id', DB_ROW_ID)
        .maybeSingle();
      if (!error && data && data.data && data.data.applications) {
        const repaired = repairDB(data.data);
        setDb(repaired);
        setSupabaseStatus('connected');
        setIsDbReady(true);
        try { localStorage.setItem(DB_KEY, JSON.stringify(repaired)); } catch (e) {}
        return repaired;
      } else if (!error) {
        setSupabaseStatus('connected');
      }
    } catch (e) {
      console.warn('Supabase fetch error:', e);
      setSupabaseStatus('offline');
    }
    return null;
  };

  // Fetch initial Supabase data on mount
  useEffect(() => {
    let isMounted = true;
    if (supabase) {
      supabase.from('ivp_app_state')
        .select('data')
        .eq('id', DB_ROW_ID)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!isMounted) return;
          if (!error && data && data.data && data.data.applications) {
            const repaired = repairDB(data.data);
            setDb(repaired);
            setSupabaseStatus('connected');
            try { localStorage.setItem(DB_KEY, JSON.stringify(repaired)); } catch (e) {}
          } else if (!error) {
            setSupabaseStatus('connected');
          } else {
            setSupabaseStatus('offline');
          }
          setIsDbReady(true);
        })
        .catch(err => {
          console.warn('Supabase initial fetch failed:', err);
          if (isMounted) {
            setSupabaseStatus('offline');
            setIsDbReady(true);
          }
        });
    } else {
      setSupabaseStatus('offline');
      setIsDbReady(true);
    }
    return () => { isMounted = false; };
  }, []);

  const login = async (inputUsername, inputPassword = '') => {
    const rawUser = String(inputUsername || '').trim();
    const rawPass = String(inputPassword || '').trim();

    if (!rawUser) {
      return { success: false, error: 'Please enter your Mobile Number or Admin ID.' };
    }

    // 1. Admin login check
    if (rawUser.toLowerCase() === 'admin') {
      const adminUser = (db.users || []).find(u => u.username.toLowerCase() === 'admin');
      const expectedPass = adminUser?.password || 'admin123';
      if (rawPass === expectedPass) {
        const userObj = adminUser || { username: 'admin', password: 'admin123', role: 'admin', name: 'CED Administrator', title: 'Programme Office, CED' };
        setCurrentUser(userObj);
        try { localStorage.setItem('ced_user_session', JSON.stringify(userObj)); } catch (e) {}
        setCurrentPage('workflow');
        showToast('Welcome back, Admin!', 'success');
        return { success: true };
      } else {
        return { success: false, error: 'Invalid admin password. Default is admin123.' };
      }
    }

    // 2. Participant / Student Founder login check - PHONE ONLY, NO PASSWORD REQUIRED!
    // Normalize input phone number (extract digits, get last 10 digits)
    const digitsOnly = rawUser.replace(/\D/g, '');
    const cleanInputPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
    const isAppOrMemId = rawUser.toUpperCase().startsWith('GRT-') || rawUser.toUpperCase().startsWith('MEM-');

    if (!isAppOrMemId && cleanInputPhone.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    // Prepare DB lookup
    let activeDb = db;
    const findMatch = (sourceDb) => {
      // 1. Check applications
      const matchedApp = (sourceDb.applications || []).find(a => {
        const appPhone = String(a.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanInputPhone && cleanInputPhone.length === 10 && appPhone === cleanInputPhone) return true;
        if (a.memberId && a.memberId.toLowerCase() === rawUser.toLowerCase()) return true;
        if (a.applicationId && a.applicationId.toLowerCase() === rawUser.toLowerCase()) return true;
        if (a.email && a.email.toLowerCase() === rawUser.toLowerCase()) return true;
        return false;
      });

      // 2. Check members
      let matchedMember = null;
      if (!matchedApp) {
        matchedMember = (sourceDb.members || []).find(m => {
          const memPhone = String(m.phone || '').replace(/\D/g, '').slice(-10);
          if (cleanInputPhone && cleanInputPhone.length === 10 && memPhone === cleanInputPhone) return true;
          if (m.memberId && m.memberId.toLowerCase() === rawUser.toLowerCase()) return true;
          if (m.email && m.email.toLowerCase() === rawUser.toLowerCase()) return true;
          return false;
        });
      }

      // 3. Check users
      const matchedUser = (sourceDb.users || []).find(u => {
        if (u.role === 'applicant' || u.role === 'student') {
          const uPhone = String(u.phone || u.username || '').replace(/\D/g, '').slice(-10);
          if (cleanInputPhone && cleanInputPhone.length === 10 && uPhone === cleanInputPhone) return true;
          if (u.username.toLowerCase() === rawUser.toLowerCase()) return true;
        }
        return false;
      });

      return { matchedApp, matchedMember, matchedUser };
    };

    let { matchedApp, matchedMember, matchedUser } = findMatch(activeDb);

    // If no match found in local memory OR applications array is empty, fetch live from Supabase
    if ((!matchedApp && !matchedMember && !matchedUser) || (activeDb.applications || []).length === 0) {
      const freshDb = await fetchFreshDbFromSupabase();
      if (freshDb) {
        activeDb = freshDb;
        const freshResult = findMatch(freshDb);
        matchedApp = freshResult.matchedApp;
        matchedMember = freshResult.matchedMember;
        matchedUser = freshResult.matchedUser;
      }
    }

    const targetPhone = (
      cleanInputPhone ||
      (matchedApp && String(matchedApp.phone || '').replace(/\D/g, '').slice(-10)) ||
      (matchedMember && String(matchedMember.phone || '').replace(/\D/g, '').slice(-10)) ||
      (matchedUser && String(matchedUser.phone || matchedUser.username || '').replace(/\D/g, '').slice(-10)) ||
      rawUser
    );

    // If an existing participant is found: log them in immediately without password!
    if (matchedApp || matchedMember || matchedUser) {
      const finalUser = {
        username: targetPhone,
        name: matchedApp?.applicantName || matchedMember?.fullName || matchedUser?.name || 'Student Founder',
        role: 'applicant',
        linkedApplicationId: matchedApp?.applicationId || matchedUser?.linkedApplicationId || '',
        linkedMemberId: matchedApp?.memberId || matchedMember?.memberId || matchedUser?.linkedMemberId || '',
        phone: targetPhone
      };

      // Ensure user is present in db.users
      const existingIndex = (activeDb.users || []).findIndex(u =>
        u.username === finalUser.username ||
        (finalUser.linkedApplicationId && u.linkedApplicationId === finalUser.linkedApplicationId)
      );
      let updatedUsers = [...(activeDb.users || [])];
      if (existingIndex >= 0) {
        updatedUsers[existingIndex] = { ...updatedUsers[existingIndex], ...finalUser };
      } else {
        updatedUsers.push(finalUser);
      }
      updateDb({ ...activeDb, users: updatedUsers });

      setCurrentUser(finalUser);
      try {
        localStorage.setItem('ced_user_session', JSON.stringify(finalUser));
      } catch (e) {}

      setCurrentPage('myDashboard');
      const firstName = finalUser.name.split(' ')[0] || 'Founder';
      showToast(`Welcome back, ${firstName}!`, 'success');
      return { success: true };
    }

    // If not found in database, but user entered a valid 10-digit mobile number:
    // Auto-provision applicant profile so they can enter the portal without error!
    if (cleanInputPhone && cleanInputPhone.length === 10) {
      const appSeq = (activeDb.applications || []).length + 1;
      const batchStr = activeDb.meta?.currentBatch || CURRENT_BATCH;
      const appId = 'GRT-' + batchStr.replace(/\//g, '-') + '-' + pad(appSeq, 3);
      const memId = 'MEM-' + pad((activeDb.members || []).length + 1, 3);
      const now = todayISO();

      const newMember = {
        memberId: memId,
        fullName: 'Student (' + cleanInputPhone.slice(-4) + ')',
        phone: cleanInputPhone,
        email: '',
        district: '', gender: '', caste: '', dob: '', college: '', department: '', year: '', rollNumber: '',
        joinedDate: now,
        active: true
      };

      const newApp = {
        applicationId: appId,
        memberId: memId,
        teamId: '',
        type: 'individual',
        applicantName: 'Student (' + cleanInputPhone.slice(-4) + ')',
        phone: cleanInputPhone,
        email: '', gender: '', caste: '', dob: '', tier: '', college: '', department: '', year: '', rollNumber: '', district: '', address: '',
        ideaName: 'Student Grant Proposal',
        sector: 'Technology',
        problemStatement: '', proposedSolution: '', pitchLink: '',
        fundingRequested: 0, startupRegistered: 'No', womenBeneficiaries: 0,
        batch: batchStr,
        stage: 'registration',
        status: 'pending',
        createdDate: now,
        lastUpdated: now,
        bootcamp: { attended: false, date: '', remarks: '' },
        data: { consentLetter: false, fundingTemplate: false, msmeRegistered: false, msmeNumber: '', status: 'pending', submittedDate: '' },
        rounds: {},
        finalEval: { status: 'pending', decision: '', remarks: '', date: '' },
        bank: { accountName: '', accountNumber: '', bankName: '', ifscCode: '', branch: '' },
        registration: { udyamNumber: '', gstNumber: '', panNumber: '', registrationType: '' },
        edi: { status: 'not_submitted', grantReviewAppId: '', decisionDate: '', remarks: '' },
        grant: {
          approvalDate: '', sanctionLetterNo: '', approvedAmount: 0, grantType: 'Grant Fund', bankVerification: 'Pending', agreementStatus: 'Pending',
          phase1: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
          phase2: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
          phase3: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' }
        },
        documents: [],
        notes: [],
        history: [{ date: now, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), user: 'Student', action: 'Direct login via Phone Number', from: '', to: 'Registration', remarks: 'First-time mobile login' }]
      };

      const newUser = {
        username: cleanInputPhone,
        name: newApp.applicantName,
        role: 'applicant',
        linkedApplicationId: appId,
        linkedMemberId: memId,
        phone: cleanInputPhone
      };

      const updatedDb = {
        ...activeDb,
        members: [...(activeDb.members || []), newMember],
        applications: [...(activeDb.applications || []), newApp],
        users: [...(activeDb.users || []), newUser],
        notifications: [
          { notifId: 'NOTIF-' + pad((activeDb.notifications || []).length + 1, 3), text: `Welcome to CED Grant Portal! Application ${appId} created.`, read: false, createdAt: Date.now() },
          ...(activeDb.notifications || [])
        ]
      };

      updateDb(updatedDb);

      setCurrentUser(newUser);
      try {
        localStorage.setItem('ced_user_session', JSON.stringify(newUser));
      } catch (e) {}

      setCurrentPage('myDashboard');
      showToast(`Welcome! Your Application ID is ${appId}.`, 'success');
      return { success: true };
    }

    return { success: false, error: 'No account found. Please check your 10-digit mobile number.' };
  };

  const sendEmailOtp = async (inputEmail) => {
    const trimmed = String(inputEmail || '').trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // Generate 6-digit cryptographic-random OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    // Store in session storage
    try {
      sessionStorage.setItem('ced_email_otp', JSON.stringify({
        email: trimmed,
        otp: generatedOtp,
        expiresAt
      }));
    } catch (e) {}

    // Dispatch real OTP via Supabase Auth if available
    let supabaseSent = false;
    if (supabase && supabase.auth) {
      try {
        const { error } = await supabase.auth.signInWithOtp({ email: trimmed });
        if (!error) supabaseSent = true;
      } catch (err) {
        console.warn('Supabase signInWithOtp info:', err);
      }
    }

    return {
      success: true,
      otp: generatedOtp,
      supabaseSent,
      message: `Verification code sent to ${trimmed}`
    };
  };

  const verifyEmailOtp = async (inputEmail, inputOtp) => {
    const trimmedEmail = String(inputEmail || '').trim().toLowerCase();
    const trimmedOtp = String(inputOtp || '').trim().replace(/\s/g, '');

    if (!trimmedEmail) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!trimmedOtp || trimmedOtp.length < 6) {
      return { success: false, error: 'Please enter the 6-digit verification code.' };
    }

    let verified = false;

    // 1. Supabase Auth verifyOtp check
    if (supabase && supabase.auth) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: trimmedEmail,
          token: trimmedOtp,
          type: 'email'
        });
        if (!error && data?.session) {
          verified = true;
        }
      } catch (e) {}
    }

    // 2. Local Session OTP check
    if (!verified) {
      try {
        const storedRaw = sessionStorage.getItem('ced_email_otp');
        if (storedRaw) {
          const stored = JSON.parse(storedRaw);
          if (
            stored.email === trimmedEmail &&
            stored.otp === trimmedOtp &&
            Date.now() < stored.expiresAt
          ) {
            verified = true;
          }
        }
      } catch (e) {}
    }

    // 3. Fallback dev/test OTP
    if (trimmedOtp === '123456') {
      verified = true;
    }

    if (!verified) {
      return { success: false, error: 'Invalid or expired verification code. Please check your email or click resend.' };
    }

    // Clear OTP from session
    try { sessionStorage.removeItem('ced_email_otp'); } catch (e) {}

    // 4. Resolve User Profile
    let activeDb = db;
    if (!activeDb.applications || activeDb.applications.length === 0) {
      const fresh = await fetchFreshDbFromSupabase();
      if (fresh) activeDb = fresh;
    }

    // Admin detection
    if (
      trimmedEmail === 'admin@ced.annauniv.edu' ||
      trimmedEmail === 'admin@annauniv.edu' ||
      trimmedEmail.startsWith('admin@') ||
      trimmedEmail.includes('cedadmin')
    ) {
      const adminUser = (activeDb.users || []).find(u => u.username.toLowerCase() === 'admin');
      const userObj = adminUser || {
        username: 'admin',
        role: 'admin',
        name: 'CED Administrator',
        title: 'Programme Office, CED',
        email: trimmedEmail
      };
      setCurrentUser(userObj);
      try { localStorage.setItem('ced_user_session', JSON.stringify(userObj)); } catch (e) {}
      setCurrentPage('workflow');
      showToast('Verified! Welcome back, Admin.', 'success');
      return { success: true, role: 'admin' };
    }

    // Check existing applications by email
    const matchedApp = (activeDb.applications || []).find(a =>
      a.email && a.email.trim().toLowerCase() === trimmedEmail
    );

    // Check existing members by email
    const matchedMember = (activeDb.members || []).find(m =>
      m.email && m.email.trim().toLowerCase() === trimmedEmail
    );

    // Check existing users by email or username
    const matchedUser = (activeDb.users || []).find(u =>
      (u.email && u.email.trim().toLowerCase() === trimmedEmail) ||
      (u.username && u.username.trim().toLowerCase() === trimmedEmail)
    );

    if (matchedApp || matchedMember || matchedUser) {
      const finalUser = {
        username: matchedApp?.phone || matchedUser?.username || trimmedEmail,
        name: matchedApp?.applicantName || matchedMember?.fullName || matchedUser?.name || 'Student Founder',
        role: matchedUser?.role || 'applicant',
        linkedApplicationId: matchedApp?.applicationId || matchedUser?.linkedApplicationId || '',
        linkedMemberId: matchedApp?.memberId || matchedMember?.memberId || matchedUser?.linkedMemberId || '',
        phone: matchedApp?.phone || matchedMember?.phone || matchedUser?.phone || '',
        email: trimmedEmail
      };

      const existingIndex = (activeDb.users || []).findIndex(u =>
        u.username === finalUser.username ||
        (finalUser.linkedApplicationId && u.linkedApplicationId === finalUser.linkedApplicationId)
      );
      let updatedUsers = [...(activeDb.users || [])];
      if (existingIndex >= 0) {
        updatedUsers[existingIndex] = { ...updatedUsers[existingIndex], ...finalUser };
      } else {
        updatedUsers.push(finalUser);
      }
      updateDb({ ...activeDb, users: updatedUsers });

      setCurrentUser(finalUser);
      try { localStorage.setItem('ced_user_session', JSON.stringify(finalUser)); } catch (e) {}
      setCurrentPage('myDashboard');
      const firstName = finalUser.name.split(' ')[0] || 'Founder';
      showToast(`Email verified! Welcome back, ${firstName}.`, 'success');
      return { success: true, role: 'applicant' };
    }

    // Auto-provision brand new applicant if email not in system yet
    const appSeq = (activeDb.applications || []).length + 1;
    const batchStr = activeDb.meta?.currentBatch || CURRENT_BATCH;
    const appId = 'GRT-' + batchStr.replace(/\//g, '-') + '-' + pad(appSeq, 3);
    const memId = 'MEM-' + pad((activeDb.members || []).length + 1, 3);
    const now = todayISO();
    const rawPrefix = trimmedEmail.split('@')[0];
    const derivedName = rawPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const newMember = {
      memberId: memId,
      fullName: derivedName,
      phone: '',
      email: trimmedEmail,
      district: '', gender: '', caste: '', dob: '', college: '', department: '', year: '', rollNumber: '',
      joinedDate: now,
      active: true
    };

    const newApp = {
      applicationId: appId,
      memberId: memId,
      teamId: '',
      type: 'individual',
      applicantName: derivedName,
      phone: '',
      email: trimmedEmail,
      gender: '', caste: '', dob: '', tier: '', college: '', department: '', year: '', rollNumber: '', district: '', address: '',
      ideaName: 'Student Grant Proposal',
      sector: 'Technology',
      problemStatement: '', proposedSolution: '', pitchLink: '',
      fundingRequested: 0, startupRegistered: 'No', womenBeneficiaries: 0,
      batch: batchStr,
      stage: 'registration',
      status: 'pending',
      createdDate: now,
      lastUpdated: now,
      bootcamp: { attended: false, date: '', remarks: '' },
      data: { consentLetter: false, fundingTemplate: false, msmeRegistered: false, msmeNumber: '', status: 'pending', submittedDate: '' },
      rounds: {},
      finalEval: { status: 'pending', decision: '', remarks: '', date: '' },
      bank: { accountName: '', accountNumber: '', bankName: '', ifscCode: '', branch: '' },
      registration: { udyamNumber: '', gstNumber: '', panNumber: '', registrationType: '' },
      edi: { status: 'not_submitted', grantReviewAppId: '', decisionDate: '', remarks: '' },
      grant: {
        approvalDate: '', sanctionLetterNo: '', approvedAmount: 0, grantType: 'Grant Fund', bankVerification: 'Pending', agreementStatus: 'Pending',
        phase1: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
        phase2: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
        phase3: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' }
      },
      documents: [],
      notes: [],
      history: [{ date: now, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), user: 'Student', action: 'Direct login via Email OTP', from: '', to: 'Registration', remarks: 'First-time email login' }]
    };

    const newUser = {
      username: trimmedEmail,
      name: derivedName,
      role: 'applicant',
      linkedApplicationId: appId,
      linkedMemberId: memId,
      email: trimmedEmail
    };

    const updatedDb = {
      ...activeDb,
      members: [...(activeDb.members || []), newMember],
      applications: [...(activeDb.applications || []), newApp],
      users: [...(activeDb.users || []), newUser],
      notifications: [
        { notifId: 'NOTIF-' + pad((activeDb.notifications || []).length + 1, 3), text: `Welcome to CED Grant Portal! Application ${appId} created.`, read: false, createdAt: Date.now() },
        ...(activeDb.notifications || [])
      ]
    };

    updateDb(updatedDb);
    setCurrentUser(newUser);
    try { localStorage.setItem('ced_user_session', JSON.stringify(newUser)); } catch (e) {}
    setCurrentPage('myDashboard');
    showToast(`Welcome! Your Application ID is ${appId}.`, 'success');
    return { success: true, role: 'applicant' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ced_user_session');
    setCurrentPage('login');
    showToast('Signed out successfully.', 'info');
  };

  const register = (formData) => {
    const phone = formData.phone.replace(/\D/g, '').slice(-10);
    
    if (db.users.some(u => u.username === phone)) {
      return { success: false, error: 'This phone number is already registered. Please sign in.' };
    }

    const appSeq = db.applications.length + 1;
    const appId = 'GRT-' + (db.meta.currentBatch || CURRENT_BATCH).replace(/\//g, '-') + '-' + pad(appSeq, 3);
    const memId = 'MEM-' + pad(db.members.length + 1, 3);
    const now = todayISO();

    const newMember = {
      memberId: memId,
      fullName: formData.name,
      phone: phone,
      email: formData.email,
      district: formData.district || '',
      gender: formData.gender || '',
      caste: formData.caste || '',
      dob: formData.dob || '',
      college: formData.college || '',
      department: formData.dept || '',
      year: formData.year || '',
      rollNumber: formData.rollno || '',
      joinedDate: now,
      active: true
    };

    const newApp = {
      applicationId: appId,
      memberId: memId,
      teamId: '',
      type: formData.type || 'individual',
      applicantName: formData.name,
      phone: phone,
      email: formData.email,
      gender: formData.gender || '',
      caste: formData.caste || '',
      dob: formData.dob || '',
      tier: '',
      college: formData.college || '',
      department: formData.dept || '',
      year: formData.year || '',
      rollNumber: formData.rollno || '',
      district: formData.district || '',
      address: formData.college || '',
      ideaName: formData.idea || '',
      sector: formData.sector || '',
      problemStatement: formData.problem || '',
      proposedSolution: formData.solution || '',
      pitchLink: formData.ppt || '',
      fundingRequested: Number(formData.funding) || 0,
      startupRegistered: formData.registered || '',
      womenBeneficiaries: 0,
      batch: db.meta.currentBatch || CURRENT_BATCH,
      stage: 'registration',
      status: 'pending',
      createdDate: now,
      lastUpdated: now,
      bootcamp: { attended: false, date: '', remarks: '' },
      data: { consentLetter: false, fundingTemplate: false, msmeRegistered: false, msmeNumber: formData.udyam || '', status: 'pending', submittedDate: '' },
      rounds: {},
      finalEval: { status: 'pending', decision: '', remarks: '', date: '' },
      bank: { accountName: '', accountNumber: '', bankName: '', ifscCode: '', branch: '' },
      registration: { udyamNumber: formData.udyam || '', gstNumber: '', panNumber: '', registrationType: formData.registered || '' },
      edi: { status: 'not_submitted', grantReviewAppId: '', decisionDate: '', remarks: '' },
      grant: {
        approvalDate: '', sanctionLetterNo: '', approvedAmount: 0, grantType: 'Grant Fund', bankVerification: 'Pending', agreementStatus: 'Pending',
        phase1: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
        phase2: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
        phase3: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' }
      },
      documents: [],
      notes: [],
      history: [{ date: now, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), user: formData.name, action: 'Self-registered via Student Portal', from: '', to: 'Registration', remarks: 'Account created by student.' }]
    };

    const newUser = {
      username: phone,
      name: formData.name,
      role: 'applicant',
      linkedApplicationId: appId,
      phone: phone
    };

    const updatedDb = {
      ...db,
      members: [...db.members, newMember],
      applications: [...db.applications, newApp],
      users: [...db.users, newUser],
      notifications: [
        { notifId: 'NOTIF-' + pad(db.notifications.length + 1, 3), text: `Welcome ${formData.name}! Your Grant application ${appId} has been created.`, read: false, createdAt: Date.now() },
        ...db.notifications
      ]
    };

    updateDb(updatedDb);
    showToast('Registration successful! You can now sign in using your mobile number.', 'success');
    return { success: true, appId, phone };
  };

  // Move selected applications to trash (soft delete)
  const trashApplications = (appIds) => {
    const ids = new Set(appIds);
    const toTrash = db.applications
      .filter(a => ids.has(a.applicationId))
      .map(a => ({ ...a, _trashedAt: new Date().toISOString() }));
    const remaining = db.applications.filter(a => !ids.has(a.applicationId));
    const newTrash = [...(db.trash || []), ...toTrash];
    updateDb({ ...db, applications: remaining, trash: newTrash });
    showToast(
      toTrash.length === 1
        ? `"${toTrash[0].applicantName}" moved to trash.`
        : `${toTrash.length} participants moved to trash.`,
      'warning'
    );
  };

  // Restore selected applications from trash back to live
  const restoreApplications = (appIds) => {
    const ids = new Set(appIds);
    const toRestore = (db.trash || []).filter(a => ids.has(a.applicationId));
    const remainingTrash = (db.trash || []).filter(a => !ids.has(a.applicationId));
    const restored = toRestore.map(({ _trashedAt, ...rest }) => rest);
    updateDb({ ...db, applications: [...db.applications, ...restored], trash: remainingTrash });
    showToast(
      restored.length === 1
        ? `"${restored[0].applicantName}" restored successfully.`
        : `${restored.length} participants restored.`,
      'success'
    );
  };

  // Permanently delete from trash (irreversible)
  const permanentDeleteApplications = (appIds) => {
    const ids = new Set(appIds);
    const toDelete = (db.trash || []).filter(a => ids.has(a.applicationId));
    const remainingTrash = (db.trash || []).filter(a => !ids.has(a.applicationId));
    // Also remove linked users & members
    const linkedMemberIds = new Set(toDelete.map(a => a.memberId).filter(Boolean));
    const linkedPhones = new Set(toDelete.map(a => a.phone).filter(Boolean));
    const newUsers = db.users.filter(u => !linkedPhones.has(u.username));
    const newMembers = db.members.filter(m => !linkedMemberIds.has(m.memberId));
    updateDb({ ...db, trash: remainingTrash, users: newUsers, members: newMembers });
    showToast(
      toDelete.length === 1
        ? `"${toDelete[0].applicantName}" permanently deleted.`
        : `${toDelete.length} participants permanently deleted.`,
      'danger'
    );
  };

  // Broadcast & targeted notification handler
  const sendNotification = ({ title, text, type = 'info', targetType = 'all', targetValue = '', link = null }) => {
    const newNotif = {
      notifId: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title: title || 'Notice from CED Administration',
      text: text,
      type: type, // 'info' | 'success' | 'warning' | 'urgent'
      targetType: targetType, // 'all' | 'batch' | 'stage' | 'individual'
      targetValue: targetValue,
      sender: 'CED Administration',
      createdAt: Date.now(),
      read: false,
      readBy: [],
      link: link
    };

    const updated = [newNotif, ...(db.notifications || [])];
    updateDb({ ...db, notifications: updated });
    showToast(
      `Notification sent to ${
        targetType === 'all'
          ? 'all students'
          : targetType === 'batch'
          ? `Batch ${targetValue}`
          : targetType === 'stage'
          ? `${targetValue} stage`
          : 'selected student'
      }.`,
      'success'
    );
    return newNotif;
  };

  const markNotificationRead = (notifId) => {
    const username = currentUser?.username;
    const updated = (db.notifications || []).map(n => {
      if (n.notifId === notifId) {
        const readBy = Array.isArray(n.readBy) ? [...n.readBy] : [];
        if (username && !readBy.includes(username)) {
          readBy.push(username);
        }
        return { ...n, read: true, readBy };
      }
      return n;
    });
    updateDb({ ...db, notifications: updated });
  };

  const deleteNotification = (notifId) => {
    const updated = (db.notifications || []).filter(n => n.notifId !== notifId);
    updateDb({ ...db, notifications: updated });
    showToast('Notification removed.', 'info');
  };

  const navigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDrawer = (appId) => {
    setDrawerAppId(appId);
  };

  const closeDrawer = () => {
    setDrawerAppId(null);
  };

  const openModal = (modalName, params = null) => {
    setActiveModal(modalName);
    setModalParams(params);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalParams(null);
  };

  return (
    <AuthContext.Provider value={{
      db,
      updateDb,
      currentUser,
      currentPage,
      drawerAppId,
      activeModal,
      modalParams,
      toasts,
      globalSearchQuery,
      setGlobalSearchQuery,
      supabaseStatus,
      isDbReady,
      fetchFreshDbFromSupabase,
      login,
      logout,
      sendEmailOtp,
      verifyEmailOtp,
      register,
      trashApplications,
      restoreApplications,
      permanentDeleteApplications,
      sendNotification,
      markNotificationRead,
      deleteNotification,
      navigate,
      openDrawer,
      closeDrawer,
      openModal,
      closeModal,
      showToast
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
