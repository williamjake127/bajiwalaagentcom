'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { useSettings } from '@/context/SettingsContext';
import { getCachedAgents, setCachedAgents, clearCachedAgents, broadcastSync, subscribeSync } from '@/lib/syncChannel';

export default function AdminPanel() {
  const { siteLogo, siteIcon, siteName, complainWhatsapp, updateSettings } = useSettings();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Data states - Instant 0ms hydration from client cache
  const [agents, setAgents] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = getCachedAgents();
      if (cached && Array.isArray(cached)) return cached;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);

  // Settings form states
  const [siteNameInput, setSiteNameInput] = useState('Bajiwala Baji365');
  const [siteLogoInput, setSiteLogoInput] = useState('/wp-content/uploads/2026/07/logo.png');
  const [siteIconInput, setSiteIconInput] = useState('/wp-content/uploads/2026/07/ChatGPT-Image-Jul-27-2026-06_49_47-PM.webp');
  const [complainNumber, setComplainNumber] = useState('27635215141');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  // Modals & Form
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    agentId: '',
    area: '',
    whatsapp: '',
    category: 'Master',
    role: '',
    status: 'verified',
    image: '/wp-content/uploads/2026/07/images.jpg'
  });
  const [formError, setFormError] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [adminSearch, setAdminSearch] = useState('');

  // Tab-close timeout duration: 1 minute (60 seconds)
  const TAB_CLOSE_TIMEOUT_MS = 60 * 1000;

  // Listen to Firebase Auth state and enforce 1-minute closed tab timeout
  useEffect(() => {
    const tabId = 'tab_' + Math.random().toString(36).substring(2, 9);
    let heartbeatTimer = null;

    const triggerAutoLogout = (reason = '') => {
      try {
        signOut(auth);
      } catch (e) {}
      setUser(null);
      localStorage.removeItem('admin_active_session');
      localStorage.removeItem('admin_tab_closed_at');
      localStorage.removeItem('admin_last_heartbeat');
      localStorage.removeItem('admin_active_tabs');
      setAuthLoading(false);
      if (reason) {
        setAuthError(reason);
      }
    };

    const checkExpiration = () => {
      const closedAt = parseInt(localStorage.getItem('admin_tab_closed_at') || '0', 10);
      const lastHeartbeat = parseInt(localStorage.getItem('admin_last_heartbeat') || '0', 10);
      const hasActiveSession = localStorage.getItem('admin_active_session') === 'true';
      const now = Date.now();

      // 1. Tab was closed for 1 minute or longer
      if (closedAt > 0 && (now - closedAt >= TAB_CLOSE_TIMEOUT_MS)) {
        triggerAutoLogout('You were logged out because the admin tab was closed for more than 1 minute.');
        return true;
      }

      // 2. Active session marked, but heartbeat died > 1 minute ago (force quit/system shutdown)
      if (hasActiveSession && lastHeartbeat > 0 && (now - lastHeartbeat >= TAB_CLOSE_TIMEOUT_MS)) {
        triggerAutoLogout('You were logged out because the admin tab was closed for more than 1 minute.');
        return true;
      }

      // 3. Stale session with no active session tracking
      if (!hasActiveSession && !closedAt && !lastHeartbeat) {
        triggerAutoLogout('');
        return true;
      }

      // Not expired: clear closed-at marker for current active session
      if (closedAt > 0) {
        localStorage.removeItem('admin_tab_closed_at');
      }

      return false;
    };

    if (checkExpiration()) {
      return;
    }

    const registerTab = () => {
      try {
        const tabs = JSON.parse(localStorage.getItem('admin_active_tabs') || '{}');
        const now = Date.now();
        tabs[tabId] = now;
        for (const id in tabs) {
          if (now - tabs[id] > 15000) delete tabs[id];
        }
        localStorage.setItem('admin_active_tabs', JSON.stringify(tabs));
        localStorage.setItem('admin_last_heartbeat', now.toString());
      } catch (e) {}
    };

    const unregisterTab = () => {
      try {
        const tabs = JSON.parse(localStorage.getItem('admin_active_tabs') || '{}');
        delete tabs[tabId];
        const now = Date.now();
        for (const id in tabs) {
          if (now - tabs[id] > 15000) delete tabs[id];
        }
        const remaining = Object.keys(tabs).length;
        localStorage.setItem('admin_active_tabs', JSON.stringify(tabs));
        if (remaining === 0) {
          // All admin tabs are closed: record timestamp for 1-minute timeout
          localStorage.setItem('admin_tab_closed_at', now.toString());
        }
      } catch (e) {}
    };

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (checkExpiration()) {
          return;
        }

        if (currentUser) {
          setUser(currentUser);
          localStorage.setItem('admin_active_session', 'true');
          localStorage.removeItem('admin_tab_closed_at');
          registerTab();
        } else {
          setUser(null);
        }
        setAuthLoading(false);
      });
    } catch (e) {
      console.warn('Firebase auth listener fallback:', e);
      setAuthLoading(false);
    }

    // Update heartbeat every 3 seconds while tab is active
    heartbeatTimer = setInterval(() => {
      registerTab();
    }, 3000);

    const handleBeforeUnload = () => {
      unregisterTab();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!checkExpiration()) {
          registerTab();
        }
      }
    };

    const handlePageShow = (event) => {
      if (event.persisted) {
        if (!checkExpiration()) {
          registerTab();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unregisterTab();
      unsubscribe();
    };
  }, []);

  // Fetch agents and settings once logged in
  useEffect(() => {
    if (user) {
      loadData(agents.length > 0);
    }
  }, [user]);

  // Subscribe to instant cross-tab updates
  useEffect(() => {
    const unsubscribe = subscribeSync((event) => {
      if (event.type === 'AGENTS_UPDATED') {
        if (event.payload?.agents && Array.isArray(event.payload.agents)) {
          setAgents(event.payload.agents);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const loadData = async (silent = false) => {
    if (!silent && agents.length === 0) {
      setLoading(true);
    }
    try {
      const [agentsRes, settingsRes] = await Promise.all([
        fetch(`/api/agents?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }),
        fetch(`/api/settings?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        })
      ]);
      const agentsData = await agentsRes.json();
      const settingsData = await settingsRes.json();

      if (agentsData.success && Array.isArray(agentsData.data)) {
        setAgents(agentsData.data);
        setCachedAgents(agentsData.data);
      }
      if (settingsData.success && settingsData.data) {
        if (settingsData.data.site_name) setSiteNameInput(settingsData.data.site_name);
        if (settingsData.data.site_logo) setSiteLogoInput(settingsData.data.site_logo);
        if (settingsData.data.site_icon) setSiteIconInput(settingsData.data.site_icon);
        if (settingsData.data.complain_whatsapp) setComplainNumber(settingsData.data.complain_whatsapp);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gallery File Upload Helper (Optimizes and converts image to Base64)
  const handleFileUpload = (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(file.type || 'image/png', 0.9);
        setter(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegisterMode) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        setUser(res.user);
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);
        setUser(res.user);
      }
      localStorage.setItem('admin_active_session', 'true');
      localStorage.setItem('admin_last_heartbeat', Date.now().toString());
      localStorage.removeItem('admin_tab_closed_at');
    } catch (err) {
      console.error('Firebase Auth error:', err);
      // Helpful fallback message
      if (err.code === 'auth/invalid-api-key' || err.code === 'auth/network-request-failed' || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        setAuthError('Firebase credentials are not set yet. Logging in with Demo Admin mode.');
        setUser({ email: email || 'admin@bajiwala.com', uid: 'demo-admin-123' });
        localStorage.setItem('admin_active_session', 'true');
        localStorage.setItem('admin_last_heartbeat', Date.now().toString());
        localStorage.removeItem('admin_tab_closed_at');
      } else {
        setAuthError(err.message || 'Authentication failed. Please check credentials.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log('Signed out');
    }
    setUser(null);
    localStorage.removeItem('admin_active_session');
    localStorage.removeItem('admin_tab_closed_at');
    localStorage.removeItem('admin_last_heartbeat');
    localStorage.removeItem('admin_active_tabs');
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage('');
    try {
      const payload = {
        site_name: siteNameInput.trim() || 'Bajiwala Baji365',
        site_logo: siteLogoInput.trim() || '/wp-content/uploads/2026/07/logo.png',
        site_icon: siteIconInput.trim() || '/wp-content/uploads/2026/07/ChatGPT-Image-Jul-27-2026-06_49_47-PM.webp',
        complain_whatsapp: complainNumber.replace(/[^0-9]/g, '').trim()
      };

      // Optimistically update context & broadcast instantly (0ms)
      updateSettings(payload);

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSettingsMessage('Settings saved! Logo, Icon & Name updated instantly across the site.');
      } else {
        setSettingsMessage(data.error || 'Failed to update settings');
      }
    } catch (err) {
      setSettingsMessage('Error saving settings');
    } finally {
      setSavingSettings(false);
      setTimeout(() => setSettingsMessage(''), 5000);
    }
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.agentId || !formData.whatsapp) {
      setFormError('Please fill in Name, Agent ID, and WhatsApp Number.');
      return;
    }

    const payload = { ...formData };
    const tempId = 'temp_' + Date.now();
    const optimisticAgent = {
      _id: tempId,
      serial: String(Math.floor(Math.random() * 90) + 10),
      ...payload,
      role: payload.role || `${payload.category} Agent`,
      status: payload.status || 'verified',
      image: payload.image || '/wp-content/uploads/2026/07/images.jpg',
      createdAt: new Date().toISOString()
    };

    // Instant UI update (0ms)
    const previousAgents = [...agents];
    const newAgentsList = [optimisticAgent, ...agents];
    setAgents(newAgentsList);
    setCachedAgents(newAgentsList);
    broadcastSync('AGENTS_UPDATED', { agents: newAgentsList, action: 'add' });

    setIsAddModalOpen(false);
    setFormData({
      name: '',
      agentId: '',
      area: '',
      whatsapp: '',
      category: 'Master',
      role: '',
      status: 'verified',
      image: '/wp-content/uploads/2026/07/images.jpg'
    });

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Reconcile temp id with DB id
        setAgents((prev) => {
          const updated = prev.map(a => a._id === tempId ? data.data : a);
          setCachedAgents(updated);
          broadcastSync('AGENTS_UPDATED', { agents: updated, action: 'confirm_add' });
          return updated;
        });
      } else {
        // Rollback on server error
        setAgents(previousAgents);
        setCachedAgents(previousAgents);
        broadcastSync('AGENTS_UPDATED', { agents: previousAgents });
        alert(data.error || 'Failed to add agent');
      }
    } catch (err) {
      // Rollback on network error
      setAgents(previousAgents);
      setCachedAgents(previousAgents);
      broadcastSync('AGENTS_UPDATED', { agents: previousAgents });
      alert('Network error while adding agent');
    }
  };

  const handleEditAgent = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!currentAgent) return;

    const id = currentAgent._id || currentAgent.id || currentAgent.agentId;
    const updatedAgent = {
      ...currentAgent,
      ...formData,
      role: formData.role || `${formData.category} Agent`
    };

    // Instant UI update (0ms)
    const previousAgents = [...agents];
    const newAgentsList = agents.map(a => (a._id === id || a.agentId === currentAgent.agentId) ? updatedAgent : a);
    setAgents(newAgentsList);
    setCachedAgents(newAgentsList);
    broadcastSync('AGENTS_UPDATED', { agents: newAgentsList, action: 'edit' });

    setIsEditModalOpen(false);
    setCurrentAgent(null);

    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback
        setAgents(previousAgents);
        setCachedAgents(previousAgents);
        broadcastSync('AGENTS_UPDATED', { agents: previousAgents });
        alert(data.error || 'Failed to update agent');
      }
    } catch (err) {
      setAgents(previousAgents);
      setCachedAgents(previousAgents);
      broadcastSync('AGENTS_UPDATED', { agents: previousAgents });
      alert('Network error while updating agent');
    }
  };

  const handleDeleteAgent = async (agent) => {
    if (!confirm(`Are you sure you want to delete agent "${agent.name}" (ID: ${agent.agentId})?`)) {
      return;
    }

    const id = agent._id || agent.id;
    const previousAgents = [...agents];
    const newAgentsList = agents.filter(a => a._id !== id && a.agentId !== agent.agentId);

    // Instant UI update (0ms)
    setAgents(newAgentsList);
    setCachedAgents(newAgentsList);
    broadcastSync('AGENTS_UPDATED', { agents: newAgentsList, action: 'delete' });

    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback
        setAgents(previousAgents);
        setCachedAgents(previousAgents);
        broadcastSync('AGENTS_UPDATED', { agents: previousAgents });
        alert(data.error || 'Failed to delete agent');
      }
    } catch (err) {
      setAgents(previousAgents);
      setCachedAgents(previousAgents);
      broadcastSync('AGENTS_UPDATED', { agents: previousAgents });
      alert('Network error while deleting agent');
    }
  };

  const handleCleanDatabase = async () => {
    if (!confirm('Are you sure you want to delete ALL agents and clean the database completely? This action cannot be undone.')) {
      return;
    }

    const previousAgents = [...agents];
    // Instant 0ms UI update
    setAgents([]);
    clearCachedAgents();
    broadcastSync('AGENTS_UPDATED', { agents: [], action: 'clean' });

    try {
      const res = await fetch('/api/agents', { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        setAgents(previousAgents);
        setCachedAgents(previousAgents);
        broadcastSync('AGENTS_UPDATED', { agents: previousAgents });
        alert(data.error || 'Failed to clean database');
      }
    } catch (e) {
      setAgents(previousAgents);
      setCachedAgents(previousAgents);
      broadcastSync('AGENTS_UPDATED', { agents: previousAgents });
      alert('Error cleaning database');
    }
  };

  const openEditModal = (agent) => {
    setCurrentAgent(agent);
    setFormData({
      name: agent.name || '',
      agentId: agent.agentId || '',
      area: agent.area || '',
      whatsapp: agent.whatsapp || '',
      category: agent.category || 'Master',
      role: agent.role || `${agent.category} Agent`,
      status: agent.status || 'verified',
      image: agent.image || '/wp-content/uploads/2026/07/images.jpg'
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const filteredList = agents.filter(agent => {
    if (filterCategory !== 'All' && agent.category !== filterCategory) {
      return false;
    }
    if (!adminSearch) return true;
    const q = adminSearch.toLowerCase().trim();
    return (
      agent.name?.toLowerCase().includes(q) ||
      agent.agentId?.toLowerCase().includes(q) ||
      agent.area?.toLowerCase().includes(q) ||
      agent.category?.toLowerCase().includes(q)
    );
  });

  if (authLoading) {
    return (
      <div className="admin-wrapper" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#d4af37', fontSize: '18px' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i> Checking authentication...
        </p>
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="login-header">
            <img src={siteLogo || '/wp-content/uploads/2026/07/logo.png'} alt={`${siteName} Admin`} width="160" />
            <h2>ADMIN PORTAL</h2>
            <p>Secure login with Firebase Authentication</p>
          </div>

          {authError && <div className="admin-alert-error">{authError}</div>}

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label>Admin Email</label>
              <input
                type="email"
                placeholder="admin@bajiwala.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="admin-btn-primary">
              {isRegisterMode ? 'CREATE ADMIN ACCOUNT' : 'LOGIN TO ADMIN PANEL'}
            </button>
          </form>

          <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '13px', color: '#8899a6' }}>
            <button
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegisterMode ? 'Already have an account? Sign In' : 'Need a new admin account? Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  const adminCount = agents.filter(a => a.category === 'Admin').length;
  const subAdminCount = agents.filter(a => a.category === 'Sub Admin').length;
  const superCount = agents.filter(a => a.category === 'Super').length;
  const masterCount = agents.filter(a => a.category === 'Master').length;

  return (
    <div className="admin-dashboard-container">
      {/* Top Bar */}
      <div className="admin-top-bar">
        <div>
          <h1 className="admin-page-title">{siteName} AGENT CONTROL PANEL</h1>
          <p className="admin-subtitle">Logged in as: <span style={{ color: '#d4af37' }}>{user.email}</span></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleCleanDatabase} className="admin-btn-secondary" title="Delete all agents from database">
            <i className="fa-solid fa-trash-can"></i> Clean Database
          </button>
          <button onClick={handleLogout} className="admin-btn-danger">
            <i className="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="admin-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"><i className="fa-solid fa-users"></i></div>
          <div className="metric-info">
            <h3>{agents.length}</h3>
            <p>Total Agents</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ color: '#cf2e2e' }}><i className="fa-solid fa-user-tie"></i></div>
          <div className="metric-info">
            <h3>{adminCount}</h3>
            <p>Admin Agents</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ color: '#ff6900' }}><i className="fa-solid fa-user-shield"></i></div>
          <div className="metric-info">
            <h3>{subAdminCount}</h3>
            <p>Sub Admin Agents</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ color: '#fcb900' }}><i className="fa-solid fa-user-astronaut"></i></div>
          <div className="metric-info">
            <h3>{superCount}</h3>
            <p>Super Agents</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ color: '#00d084' }}><i className="fa-solid fa-user-check"></i></div>
          <div className="metric-info">
            <h3>{masterCount}</h3>
            <p>Master Agents</p>
          </div>
        </div>
      </div>

      {/* Dynamic Branding & Site Settings */}
      <div className="admin-card-section">
        <div className="section-heading">
          <h2><i className="fa-solid fa-sliders" style={{ color: '#f3c346', marginRight: '8px' }}></i> Global Website Branding &amp; Settings</h2>
          <p>Upload or enter Logo, Icon / Hero Image / Favicon, Website Name, and Complain WhatsApp number. Updates apply instantly.</p>
        </div>

        <form onSubmit={handleSaveSettings} style={{ marginTop: '20px' }}>
          <div className="form-grid settings-form-grid">
            <div className="form-group">
              <label>Website Name (Displayed everywhere on frontend)</label>
              <input
                type="text"
                placeholder="e.g. Bajiwala Baji365"
                value={siteNameInput}
                onChange={(e) => setSiteNameInput(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Complain WhatsApp Number (With Country Code)</label>
              <input
                type="text"
                placeholder="e.g. 27635215141 or 8801700000000"
                value={complainNumber}
                onChange={(e) => setComplainNumber(e.target.value)}
                required
              />
            </div>

            {/* Site Logo Section with Gallery Upload */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Site Logo</label>
                <label className="admin-upload-btn">
                  <i className="fa-solid fa-cloud-arrow-up"></i> Upload from Gallery
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setSiteLogoInput)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <input
                type="text"
                placeholder="Image URL or upload from gallery above..."
                value={siteLogoInput}
                onChange={(e) => setSiteLogoInput(e.target.value)}
                required
              />
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: '#8899a6' }}>Current Logo:</span>
                <img
                  src={siteLogoInput}
                  alt="Logo Preview"
                  style={{ maxHeight: '34px', background: '#020407', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.3)' }}
                />
                <button
                  type="button"
                  onClick={() => setSiteLogoInput('/wp-content/uploads/2026/07/logo.png')}
                  style={{ background: 'none', border: 'none', color: '#f3c346', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Reset to Default
                </button>
              </div>
            </div>

            {/* Site Icon / Hero Section with Gallery Upload */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Site Icon / Hero / Favicon</label>
                <label className="admin-upload-btn">
                  <i className="fa-solid fa-cloud-arrow-up"></i> Upload from Gallery
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setSiteIconInput)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <input
                type="text"
                placeholder="Image URL or upload from gallery above..."
                value={siteIconInput}
                onChange={(e) => setSiteIconInput(e.target.value)}
                required
              />
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: '#8899a6' }}>Current Icon:</span>
                <img
                  src={siteIconInput}
                  alt="Icon Preview"
                  style={{ maxHeight: '36px', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.3)' }}
                />
                <button
                  type="button"
                  onClick={() => setSiteIconInput('/wp-content/uploads/2026/07/ChatGPT-Image-Jul-27-2026-06_49_47-PM.webp')}
                  style={{ background: 'none', border: 'none', color: '#f3c346', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </div>

          <div className="admin-save-wrapper" style={{ marginTop: '20px' }}>
            <button type="submit" disabled={savingSettings} className="admin-btn-primary admin-save-btn">
              {savingSettings ? 'Saving Settings...' : 'SAVE & APPLY SETTINGS'}
            </button>
          </div>
        </form>
        {settingsMessage && <p className="admin-success-text" style={{ marginTop: '12px' }}>{settingsMessage}</p>}
      </div>

      {/* Agent Management Section */}
      <div className="admin-card-section">
        <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2><i className="fa-solid fa-id-card-clip" style={{ color: '#d4af37', marginRight: '8px' }}></i> Manage Agents</h2>
            <p>Add, edit or remove agents in Admin, Sub Admin, Super, and Master categories.</p>
          </div>
          <button onClick={() => { setIsAddModalOpen(true); setFormError(''); }} className="admin-btn-primary admin-add-agent-btn">
            <i className="fa-solid fa-plus"></i> ADD NEW AGENT
          </button>
        </div>

        {/* Filters */}
        <div className="admin-table-filters">
          <div className="category-pill-group">
            {['All', 'Admin', 'Sub Admin', 'Super', 'Master'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`category-pill ${filterCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="admin-search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Filter by ID, name, or area..."
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Agent Name</th>
                <th>Category</th>
                <th>Agent ID</th>
                <th>WhatsApp</th>
                <th>Area</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#f3c346' }}>
                    <i className="fa-solid fa-spinner fa-spin"></i> Loading agents...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#8899a6' }}>
                    No agents found in this category.
                  </td>
                </tr>
              ) : (
                filteredList.map((agent, index) => {
                  let catBadgeClass = 'badge-master';
                  if (agent.category === 'Admin') catBadgeClass = 'badge-admin';
                  if (agent.category === 'Sub Admin') catBadgeClass = 'badge-sub-admin';
                  if (agent.category === 'Super') catBadgeClass = 'badge-super';

                  return (
                    <tr key={agent._id || agent.agentId || index} className="admin-table-row">
                      <td data-label="#">{agent.serial || String(index + 1).padStart(2, '0')}</td>
                      <td data-label="Agent Name">
                        <strong>{agent.name}</strong>
                      </td>
                      <td data-label="Category">
                        <span className={`badge-cat ${catBadgeClass}`}>
                          {agent.category}
                        </span>
                      </td>
                      <td data-label="Agent ID">
                        <span className="table-id-badge">{agent.agentId}</span>
                      </td>
                      <td data-label="WhatsApp">
                        <a
                          href={`https://wa.me/${String(agent.whatsapp).replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#00d084', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <i className="fa-brands fa-whatsapp"></i> {agent.whatsapp}
                        </a>
                      </td>
                      <td data-label="Area">{agent.area || '-'}</td>
                      <td data-label="Actions" className="table-actions-cell">
                        <button
                          onClick={() => openEditModal(agent)}
                          className="table-action-btn edit"
                          title="Edit Agent"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> <span className="btn-text-mobile">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent)}
                          className="table-action-btn delete"
                          title="Delete Agent"
                        >
                          <i className="fa-solid fa-trash"></i> <span className="btn-text-mobile">Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD AGENT MODAL */}
      {isAddModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="modal-header">
              <h3>ADD NEW VERIFIED AGENT</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="modal-close-btn">&times;</button>
            </div>
            {formError && <div className="admin-alert-error">{formError}</div>}
            <form onSubmit={handleAddAgent} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Agent Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. RAHIM KHAN"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Agent ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. 1055"
                    value={formData.agentId}
                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value, role: `${e.target.value} Agent` })}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Sub Admin">Sub Admin</option>
                    <option value="Super">Super</option>
                    <option value="Master">Master</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>WhatsApp Number (with Country Code) *</label>
                  <input
                    type="text"
                    placeholder="e.g. 601123965886"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group form-group-full">
                  <label>Area / Location (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka / Chittagong"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                </div>
                <div className="form-group form-group-full">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Agent Avatar Image</label>
                    <label className="admin-upload-btn">
                      <i className="fa-solid fa-cloud-arrow-up"></i> Upload Avatar
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, (val) => setFormData({ ...formData, image: val }))}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Avatar image URL..."
                    value={formData.image || ''}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="admin-btn-secondary">Cancel</button>
                <button type="submit" className="admin-btn-primary">CREATE AGENT</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT AGENT MODAL */}
      {isEditModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="modal-header">
              <h3>EDIT AGENT (ID: {formData.agentId})</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="modal-close-btn">&times;</button>
            </div>
            {formError && <div className="admin-alert-error">{formError}</div>}
            <form onSubmit={handleEditAgent} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Agent Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Agent ID *</label>
                  <input
                    type="text"
                    value={formData.agentId}
                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value, role: `${e.target.value} Agent` })}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Sub Admin">Sub Admin</option>
                    <option value="Super">Super</option>
                    <option value="Master">Master</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>WhatsApp Number *</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group form-group-full">
                  <label>Area / Location</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                </div>
                <div className="form-group form-group-full">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Agent Avatar Image</label>
                    <label className="admin-upload-btn">
                      <i className="fa-solid fa-cloud-arrow-up"></i> Upload Avatar
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, (val) => setFormData({ ...formData, image: val }))}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.image || ''}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="admin-btn-secondary">Cancel</button>
                <button type="submit" className="admin-btn-primary">SAVE CHANGES</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
