import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadInitialData = useCallback(async () => {
    try {
      const [personasRes, meRes] = await Promise.allSettled([
        api.getPersonas(),
        api.getMe(),
      ]);

      if (personasRes.status === 'fulfilled' && personasRes.value.success) {
        setPersonas(personasRes.value.personas || []);
      }

      if (meRes.status === 'fulfilled' && meRes.value.success) {
        setUser(meRes.value.user);
        setTenant(meRes.value.tenant);

        // Fetch tenant list
        try {
          const compRes = await api.getCompanies();
          if (compRes.success) setCompanies(compRes.companies || []);
        } catch (_) {}
      } else {
        // Auto-login as Rahul Sharma for instant demo experience if no session
        const rahulPersona = personasRes.status === 'fulfilled'
          ? personasRes.value.personas?.find((p) => p.email === 'rahul@acme.com')
          : null;

        if (rahulPersona) {
          const loginRes = await api.login(rahulPersona.email, 'Password123!');
          if (loginRes.success) {
            localStorage.setItem('companybrain_token', loginRes.token);
            setUser(loginRes.user);
            setTenant(loginRes.tenant);
            const compRes = await api.getCompanies();
            if (compRes.success) setCompanies(compRes.companies || []);
          }
        }
      }
    } catch (err) {
      console.error('Error loading initial auth context:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const login = async (email, password, tenantId) => {
    try {
      const res = await api.login(email, password, tenantId);
      if (res.success) {
        localStorage.setItem('companybrain_token', res.token);
        setUser(res.user);
        setTenant(res.tenant);

        const compRes = await api.getCompanies();
        if (compRes.success) setCompanies(compRes.companies || []);

        showToast(`Welcome back, ${res.user.name}! Connected to ${res.tenant.name}.`, 'success');
        return true;
      }
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const quickLoginAs = async (email) => {
    const success = await login(email, 'Password123!');
    return success;
  };

  const switchTenant = async (tenantId) => {
    try {
      const res = await api.switchTenant(tenantId);
      if (res.success) {
        localStorage.setItem('companybrain_token', res.token);
        setUser(res.user);
        setTenant(res.tenant);
        showToast(`Tenant context switched to ${res.tenant.name}`, 'info');
        return true;
      }
    } catch (err) {
      showToast(`Cannot switch company: ${err.message}`, 'error');
      return false;
    }
  };

  const signup = async (signupData) => {
    try {
      const res = await api.signup(signupData);
      if (res.success) {
        localStorage.setItem('companybrain_token', res.token);
        setUser(res.user);
        setTenant(res.tenant);

        const compRes = await api.getCompanies();
        if (compRes.success) setCompanies(compRes.companies || []);

        showToast(`Registration successful! Welcome to ${res.tenant.name}, ${res.user.name}.`, 'success');
        return true;
      }
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const logout = async () => {
    try {
      await api.logout();
    } catch (_) {}
    localStorage.removeItem('companybrain_token');
    setUser(null);
    setTenant(null);
    showToast('Logged out of CompanyBrain session.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        companies,
        personas,
        loading,
        login,
        signup,
        quickLoginAs,
        switchTenant,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        refreshProfile: loadInitialData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
