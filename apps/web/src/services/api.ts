const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('netcall_access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('netcall_refresh_token');
  }

  private setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem('netcall_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('netcall_refresh_token', refreshToken);
    }
  }

  private clearTokens() {
    localStorage.removeItem('netcall_access_token');
    localStorage.removeItem('netcall_refresh_token');
    localStorage.removeItem('netcall_user');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle token expiration
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            this.setTokens(refreshData.data.accessToken, refreshData.data.refreshToken);
            headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
            response = await fetch(url, { ...options, headers });
          } else {
            this.clearTokens();
            window.location.href = '/login';
          }
        } catch (e) {
          this.clearTokens();
          window.location.href = '/login';
        }
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'An unexpected error occurred');
    }

    return data;
  }

  // Auth Endpoints
  async register(body: any) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async login(body: any) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async logout() {
    const refreshToken = this.getRefreshToken();
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
    } finally {
      this.clearTokens();
    }
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // User Endpoints
  async searchUsers(query: string) {
    return this.request<any>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async updateProfile(body: any) {
    return this.request<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  // Call Endpoints
  async initiateCall(body: any) {
    return this.request<any>('/calls/initiate', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async endCall(callId: string, reason?: string, finalStatus?: string) {
    return this.request<any>(`/calls/${callId}/end`, {
      method: 'POST',
      body: JSON.stringify({ reason, finalStatus })
    });
  }

  async getCallHistory(page: number = 1, limit: number = 20) {
    return this.request<any>(`/calls/history?page=${page}&limit=${limit}`);
  }

  // Wallet Endpoints
  async getWallet() {
    return this.request<any>('/wallet');
  }

  async getPricingPlans() {
    return this.request<any>('/wallet/plans');
  }

  async topUpWallet(amountPaise: number, planId?: string) {
    return this.request<any>('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amountPaise, planId })
    });
  }

  async getTransactions(page: number = 1, limit: number = 20) {
    return this.request<any>(`/wallet/transactions?page=${page}&limit=${limit}`);
  }

  // Telephony & Sandbox Endpoints
  async getTelephonyInfo() {
    return this.request<any>('/telephony/provider');
  }

  async simulateSandboxEvent(callId: string, event: 'answered' | 'completed') {
    return this.request<any>('/telephony/sandbox/simulate-event', {
      method: 'POST',
      body: JSON.stringify({ callId, event })
    });
  }

  // WebRTC Configuration
  async getIceServers() {
    return this.request<any>('/webrtc/ice-servers');
  }

  // Admin Endpoints
  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }

  async getAdminUsers(page: number = 1) {
    return this.request<any>(`/admin/users?page=${page}`);
  }

  async updateAdminUserStatus(userId: string, status: string) {
    return this.request<any>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async getAdminCalls(page: number = 1) {
    return this.request<any>(`/admin/calls?page=${page}`);
  }
}

export const api = new ApiClient();

