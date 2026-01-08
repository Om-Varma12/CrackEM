const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  user?: {
    name: string;
    email: string;
  };
}

export const api = {
  async signup(data: SignupRequest): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Network error');
    }

    return response.json();
  },

  async signin(data: SigninRequest): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Network error');
    }

    return response.json();
  },

  async createMeet(meetID: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/meet/create?meetID=${meetID}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Network error');
    }

    return response.json();
  },
};

