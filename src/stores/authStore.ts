import { defineStore } from 'pinia';
import apiClient from '../services/api';
import type { UsuarioSummaryDTO } from '../types/amizade';

interface AuthState {
  user: UsuarioSummaryDTO | null;
  token: string | null;
  errorMessage: string | null;
  loading: boolean;
}

interface LoginResponse {
    token: string;
    user: UsuarioSummaryDTO;
}

interface LoginCredentials {
  username: string;
  password: string;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    // ---- MUDANÇA: Lógica de inicialização mais segura ----
    let userObject: UsuarioSummaryDTO | null = null;
    let tokenValue: string | null = null;

    try {
      const userString = localStorage.getItem('user');
      tokenValue = localStorage.getItem('authToken');

      // Verifica se a string do utilizador existe e não é a palavra "undefined"
      if (userString && userString !== 'undefined') {
        userObject = JSON.parse(userString);
      }
      
      // Se não houver token, o utilizador também não deve ser considerado logado
      if (!tokenValue) {
        userObject = null;
      }

    } catch (e) {
      console.error("Erro ao aceder ao localStorage ou ao fazer parse dos dados. A sua sessão pode não ser restaurada.", e);
      // Garante que o estado seja limpo se os dados estiverem corrompidos ou inacessíveis
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    }

    return {
      user: userObject,
      token: tokenValue,
      errorMessage: null,
      loading: false,
    };
  },

  getters: {
    isAuthenticated: (state): boolean => !!state.token && !!state.user,
    isLoading: (state): boolean => state.loading,
    getErrorMessage: (state): string | null => state.errorMessage,
    getUsername: (state): string | null => state.user?.username || null,
    getToken: (state): string | null => state.token,
    getUser: (state): UsuarioSummaryDTO | null => state.user,
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.loading = true;
      this.errorMessage = null;
      try {
        const response = await apiClient.post<LoginResponse>(
          `/auth/login`,
          credentials
        );

        const receivedToken = response.data.token;
        const receivedUser = response.data.user;

        this.token = receivedToken;
        this.user = receivedUser;

        localStorage.setItem('authToken', receivedToken);
        localStorage.setItem('user', JSON.stringify(receivedUser));

        console.log('Login bem-sucedido, utilizador e token salvos:', receivedUser);

      } catch (error: any) {
        console.error('Erro no login (authStore):', error);
        this.logout();
        if (error.response) {
          if (error.response.data && error.response.data.message) {
            this.errorMessage = `Erro: ${error.response.data.message}`;
          } else if (error.response.status === 401 || error.response.status === 403) {
            this.errorMessage = 'Utilizador ou senha inválidos.';
          } else {
            this.errorMessage = `Erro do servidor: ${error.response.status}`;
          }
        } else if (error.request) {
          this.errorMessage = 'Não foi possível conectar ao servidor.';
        } else {
          this.errorMessage = 'Erro ao tentar fazer login.';
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } catch (e) {
        console.error("Erro ao limpar o localStorage no logout.", e);
      }
      console.log('Logout realizado, token e utilizador removidos.');
    },
    
    // A lógica de inicialização agora está dentro do 'state', tornando esta ação menos crítica,
    // mas pode ser mantida para forçar uma recarga do estado se necessário.
    initializeAuth() {
      try {
        const token = localStorage.getItem('authToken');
        const userString = localStorage.getItem('user');
        if (token && userString && userString !== 'undefined') {
          this.token = token;
          this.user = JSON.parse(userString);
        } else {
          this.logout();
        }
      } catch(e) {
        console.error("Falha ao inicializar autenticação a partir do storage.", e);
        this.logout();
      }
    }
  },
});
