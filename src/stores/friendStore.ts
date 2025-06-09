import { defineStore } from 'pinia';
import apiClient from '../services/api'; // Sua instância Axios configurada
import type { UsuarioSummaryDTO, SolicitacaoAmizadeDTO } from '../types/amizade';
import { StatusAmizade } from '../types/amizade'; // Importar o enum
import { useAuthStore } from './authStore'; // Para garantir que o usuário está logado

// Interface para o usuário buscado, pode ser estendida se necessário
interface SearchedUser extends UsuarioSummaryDTO {
  // Adicionar propriedades de status pode ser útil para a UI,
  // mas a lógica principal de status estará nas funções `isAlreadyFriend`, etc.
  // friendshipStatus?: 'friends' | 'pending_them' | 'pending_me' | 'none';
}

interface FriendState {
  friends: UsuarioSummaryDTO[];
  incomingRequests: SolicitacaoAmizadeDTO[];
  outgoingRequests: SolicitacaoAmizadeDTO[];
  searchedUsers: SearchedUser[];
  loadingFriends: boolean;
  loadingIncomingRequests: boolean;
  loadingOutgoingRequests: boolean;
  loadingSearch: boolean;
  error: string | null; // Erro genérico para fetch de amigos/solicitações
  searchError: string | null; // Erro específico para a busca de usuários
  actionError: string | null; // Erro para ações como enviar solicitação, aceitar, etc.
}

export const useFriendStore = defineStore('friends', {
  state: (): FriendState => ({
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    searchedUsers: [],
    loadingFriends: false,
    loadingIncomingRequests: false,
    loadingOutgoingRequests: false,
    loadingSearch: false,
    error: null,
    searchError: null,
    actionError: null,
  }),

  getters: {
    getFriends: (state) => state.friends,
    getIncomingRequests: (state) => state.incomingRequests,
    getOutgoingRequests: (state) => state.outgoingRequests,
    getSearchedUsers: (state) => state.searchedUsers,
    isLoadingFriends: (state) => state.loadingFriends,
    isLoadingIncomingRequests: (state) => state.loadingIncomingRequests,
    isLoadingOutgoingRequests: (state) => state.loadingOutgoingRequests,
    isLoadingSearch: (state) => state.loadingSearch,
    getError: (state) => state.error, // Erro genérico
    getSearchError: (state) => state.searchError,
    getActionError: (state) => state.actionError,
  },

  actions: {
    // AÇÕES DE BUSCA DE DADOS (FETCH)
    async fetchFriends() {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        this.error = "Usuário não autenticado para buscar amigos.";
        return;
      }
      this.loadingFriends = true;
      this.error = null;
      try {
        const response = await apiClient.get<UsuarioSummaryDTO[]>('/amizades/meus-amigos');
        this.friends = response.data;
      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || 'Falha ao buscar amigos.';
        this.friends = [];
        console.error("Erro fetchFriends:", err);
      } finally {
        this.loadingFriends = false;
      }
    },

    async fetchIncomingRequests() {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        this.error = "Usuário não autenticado para buscar solicitações recebidas.";
        return;
      }
      this.loadingIncomingRequests = true;
      this.error = null;
      try {
        const response = await apiClient.get<SolicitacaoAmizadeDTO[]>('/amizades/solicitacoes/recebidas');
        this.incomingRequests = response.data.filter(req => req.status === StatusAmizade.PENDENTE);
      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || 'Falha ao buscar solicitações recebidas.';
        this.incomingRequests = [];
        console.error("Erro fetchIncomingRequests:", err);
      } finally {
        this.loadingIncomingRequests = false;
      }
    },

    async fetchOutgoingRequests() {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        this.error = "Usuário não autenticado para buscar solicitações enviadas.";
        return;
      }
      this.loadingOutgoingRequests = true;
      this.error = null;
      try {
        const response = await apiClient.get<SolicitacaoAmizadeDTO[]>('/amizades/solicitacoes/enviadas');
        this.outgoingRequests = response.data.filter(req => req.status === StatusAmizade.PENDENTE);
      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || 'Falha ao buscar solicitações enviadas.';
        this.outgoingRequests = [];
        console.error("Erro fetchOutgoingRequests:", err);
      } finally {
        this.loadingOutgoingRequests = false;
      }
    },

    async searchUsers(termo: string) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        this.searchError = "Usuário não autenticado para buscar usuários.";
        return;
      }
      if (!termo || termo.trim().length < 2) {
        this.searchedUsers = [];
        // this.searchError = "Termo de busca muito curto (mínimo 2 caracteres)."; // O componente já lida com isso
        return;
      }
      this.loadingSearch = true;
      this.searchError = null;
      try {
        const response = await apiClient.get<SearchedUser[]>(`/usuarios/buscar?termo=${encodeURIComponent(termo.trim())}`);
        this.searchedUsers = response.data;
      } catch (err: any) {
        this.searchError = err.response?.data?.message || err.message || 'Falha ao buscar usuários.';
        this.searchedUsers = [];
        console.error("Erro searchUsers:", err);
      } finally {
        this.loadingSearch = false;
      }
    },

    // AÇÕES DE MODIFICAÇÃO DE AMIZADE
    async sendFriendRequest(targetUserId: number) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        this.actionError = "Usuário não autenticado para enviar solicitação.";
        throw new Error(this.actionError);
      }
      this.actionError = null;
      try {
        await apiClient.post(`/amizades/solicitar/${targetUserId}`);
        // Após enviar, atualiza a lista de solicitações enviadas para refletir o status
        await this.fetchOutgoingRequests();
      } catch (err: any) {
        this.actionError = err.response?.data?.message || err.message || 'Falha ao enviar solicitação de amizade.';
        console.error("Erro sendFriendRequest:", err);
        throw err; // Re-lança para o componente tratar (ex: exibir no alert)
      }
    },

    async acceptFriendRequest(amizadeId: number) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        this.actionError = "Usuário não autenticado para aceitar solicitação.";
        throw new Error(this.actionError);
      }
      this.actionError = null;
      try {
        await apiClient.post(`/amizades/aceitar/${amizadeId}`);
        // Após aceitar, recarrega as solicitações recebidas e a lista de amigos
        await this.fetchIncomingRequests();
        await this.fetchFriends();
      } catch (err: any) {
        this.actionError = err.response?.data?.message || err.message || 'Falha ao aceitar solicitação.';
        console.error("Erro acceptFriendRequest:", err);
        throw err;
      }
    },

    async rejectFriendRequest(amizadeId: number) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        this.actionError = "Usuário não autenticado para rejeitar solicitação.";
        throw new Error(this.actionError);
      }
      this.actionError = null;
      try {
        await apiClient.post(`/amizades/rejeitar/${amizadeId}`);
        // Após rejeitar, recarrega as solicitações recebidas
        await this.fetchIncomingRequests();
      } catch (err: any) {
        this.actionError = err.response?.data?.message || err.message || 'Falha ao rejeitar solicitação.';
        console.error("Erro rejectFriendRequest:", err);
        throw err;
      }
    },

    async unfriend(friendUserId: number) {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        this.actionError = "Usuário não autenticado para desfazer amizade.";
        throw new Error(this.actionError);
      }
      this.actionError = null;
      try {
        await apiClient.delete(`/amizades/desfazer/${friendUserId}`);
        // Após desfazer, recarrega a lista de amigos
        await this.fetchFriends();
      } catch (err: any) {
        this.actionError = err.response?.data?.message || err.message || 'Falha ao desfazer amizade.';
        console.error("Erro unfriend:", err);
        throw err;
      }
    },

    // Ação para limpar os resultados da busca quando o componente FindUsersView é desmontado ou o termo é limpo
    clearSearchedUsers() {
      this.searchedUsers = [];
      this.searchError = null;
      this.loadingSearch = false; // Garante que o loading seja resetado
    }
  },
});
