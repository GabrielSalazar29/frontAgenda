// src/services/api.ts
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore'; // Importa o store para pegar o token

const API_BASE_URL = 'http://localhost:8080/api'; // Mesma URL base

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição: Adiciona o token JWT a todas as requisições
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore(); // Obtém a instância do store
    const token = authStore.getToken; // Usa o getter para pegar o token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta (Opcional, mas útil para tratamento global de erros)
apiClient.interceptors.response.use(
  (response) => {
    return response; // Se a resposta for bem-sucedida, apenas a retorna
  },
  (error) => {
    const authStore = useAuthStore();
    if (error.response && error.response.status === 401) {
      console.warn('Erro 401 detectado pelo interceptor do Axios. Deslogando usuário.');
      authStore.logout(); // Desloga o usuário
    }
    return Promise.reject(error);
  }
);

export default apiClient;