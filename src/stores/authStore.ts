import { defineStore } from 'pinia';
import apiClient from '../services/api'; // Usaremos axios aqui também
import { useRouter } from 'vue-router'; // Para redirecionamento programático

// URL da sua API backend
const API_BASE_URL = 'http://localhost:8080/api'; // Ajuste se necessário

interface AuthState {
  token: string | null;
  username: string | null; // Ou um objeto de usuário mais completo
  errorMessage: string | null;
  loading: boolean;
}

// Defina uma interface para as credenciais de login
interface LoginCredentials {
  username: string;
  password: string;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('authToken'), // Tenta carregar o token do localStorage na inicialização
    username: localStorage.getItem('username'), // Tenta carregar o username
    errorMessage: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    isLoading: (state): boolean => state.loading,
    getErrorMessage: (state): string | null => state.errorMessage,
    getUsername: (state): string | null => state.username,
    getToken: (state): string | null => state.token,
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.loading = true;
      this.errorMessage = null;
      try {
        const response = await apiClient.post<{ token: string, type?: string }>( // Define o tipo da resposta esperada
          `${API_BASE_URL}/auth/login`,
          credentials
        );

        const receivedToken = response.data.token;
        this.token = receivedToken;
        this.username = credentials.username; // Ou decodifique do token se ele contiver o username

        localStorage.setItem('authToken', receivedToken);
        localStorage.setItem('username', credentials.username);

        console.log('Login bem-sucedido, token salvo:', receivedToken);

        // Após o login, o axios interceptor (que vamos criar) pegará o token do store ou localStorage.
        // Redirecionamento será feito pelo componente que chamou o login.

      } catch (error: any) { // Use 'any' ou um tipo de erro mais específico se souber
        console.error('Erro no login (authStore):', error);
        localStorage.removeItem('authToken'); // Garante que token inválido seja removido
        localStorage.removeItem('username');
        this.token = null;
        this.username = null;
        if (error.response) {
          if (error.response.data && error.response.data.message) {
            this.errorMessage = `Erro: ${error.response.data.message}`;
          } else if (error.response.status === 401 || error.response.status === 403) {
            this.errorMessage = 'Usuário ou senha inválidos.';
          } else {
            this.errorMessage = `Erro do servidor: ${error.response.status}`;
          }
        } else if (error.request) {
          this.errorMessage = 'Não foi possível conectar ao servidor.';
        } else {
          this.errorMessage = 'Erro ao tentar fazer login.';
        }
        throw error; // Re-lança o erro para que o componente possa tratá-lo se necessário
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.username = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      console.log('Logout realizado, token removido.');
      // O redirecionamento geralmente é feito pelo componente que chama o logout
      // ou por um navigation guard.
    },

    // Ação para ser chamada quando a aplicação inicia, para tentar carregar o estado
    // (já fazemos isso na inicialização do state, mas pode ser útil para lógica adicional)
    initializeAuth() {
      const token = localStorage.getItem('authToken');
      const username = localStorage.getItem('username');
      if (token && username) {
        this.token = token;
        this.username = username;
        console.log('Sessão restaurada do localStorage.');
      } else {
        this.token = null;
        this.username = null;
      }
    }
  },
});