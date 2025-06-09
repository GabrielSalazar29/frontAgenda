<template>
  <div class="find-users-container">
    <h2>Encontrar Amigos</h2>
    <div class="search-bar">
      <input
        type="text"
        v-model="searchTerm"
        @input="debouncedSearch"
        placeholder="Digite o nome de usuário..."
      />
      <button @click="executeSearch" :disabled="friendStore.isLoadingSearch || searchTerm.length < 2">
        {{ friendStore.isLoadingSearch ? 'Buscando...' : 'Buscar' }}
      </button>
    </div>

    <div v-if="friendStore.getSearchError" class="error-message">
      {{ friendStore.getSearchError }}
    </div>

    <div v-if="!friendStore.isLoadingSearch && searchedUsers.length === 0 && hasSearched" class="no-results-message">
      Nenhum usuário encontrado com o termo "{{ lastSearchTerm }}".
    </div>

    <ul v-if="searchedUsers.length > 0" class="users-list">
      <li v-for="user in searchedUsers" :key="user.id" class="user-item">
        <span>{{ user.username }} (ID: {{ user.id }})</span>
        <button 
          @click="handleUserAction(user)" 
          :disabled="isButtonDisabled(user)"
          :class="getButtonClass(user)"
        >
          {{ getButtonText(user) }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router'; // Importar useRouter
import { useFriendStore } from '../stores/friendStore';
import type { UsuarioSummaryDTO, SolicitacaoAmizadeDTO } from '../types/amizade';
import { StatusAmizade } from '../types/amizade'; // Importar o enum

const friendStore = useFriendStore();
const router = useRouter(); // Instanciar o router
const searchTerm = ref<string>('');
const lastSearchTerm = ref<string>('');
const hasSearched = ref<boolean>(false);

const searchedUsers = computed(() => friendStore.getSearchedUsers);
const friends = computed(() => friendStore.getFriends);
const outgoingRequests = computed(() => friendStore.getOutgoingRequests);
const incomingRequests = computed(() => friendStore.getIncomingRequests); // Adicionar getter para incomingRequests

let debounceTimer: number | undefined;

onMounted(() => {
  friendStore.fetchFriends();
  friendStore.fetchOutgoingRequests();
  friendStore.fetchIncomingRequests(); // Buscar solicitações recebidas
  friendStore.searchedUsers = [];
  friendStore.searchError = null;
});

const debouncedSearch = () => {
  clearTimeout(debounceTimer);
  hasSearched.value = false;
  if (searchTerm.value.length >= 2) {
    debounceTimer = window.setTimeout(() => {
      executeSearch();
    }, 500);
  } else {
    friendStore.searchedUsers = [];
    friendStore.searchError = null;
  }
};

const executeSearch = () => {
  if (searchTerm.value.length < 2) {
    friendStore.searchError = "Digite pelo menos 2 caracteres para buscar.";
    return;
  }
  lastSearchTerm.value = searchTerm.value;
  hasSearched.value = true;
  friendStore.searchUsers(searchTerm.value);
};

const handleUserAction = async (user: UsuarioSummaryDTO) => {
  if (isAlreadyFriend(user.id) || isRequestSentTo(user.id)) {
    // Nenhuma ação padrão ou pode levar ao perfil do amigo
    console.log('Ação para amigo ou solicitação enviada: nenhuma ação padrão ou ir para perfil.');
    return;
  }
  if (isRequestReceivedFrom(user.id)) {
    // Leva para a página de solicitações para que o usuário possa aceitar/rejeitar
    router.push({ name: 'friendRequests' }); 
    return;
  }
  // Se nenhuma das condições acima, então é para enviar uma nova solicitação
  try {
    await friendStore.sendFriendRequest(user.id);
    alert(`Solicitação de amizade enviada para ${user.username}!`);
    // Atualiza a lista de solicitações enviadas para refletir a mudança no botão
    await friendStore.fetchOutgoingRequests();
  } catch (error: any) {
    alert(`Erro ao enviar solicitação: ${error.message || 'Tente novamente.'}`);
  }
};

const isRequestSentTo = (targetUserId: number): boolean => {
  return outgoingRequests.value.some(req => req.solicitado.id === targetUserId && req.status === StatusAmizade.PENDENTE);
};

const isRequestReceivedFrom = (targetUserId: number): boolean => {
  return incomingRequests.value.some(req => req.solicitante.id === targetUserId && req.status === StatusAmizade.PENDENTE);
};

const isAlreadyFriend = (targetUserId: number): boolean => {
  return friends.value.some(friend => friend.id === targetUserId);
};

const getButtonText = (user: UsuarioSummaryDTO): string => {
  if (isAlreadyFriend(user.id)) {
    return 'Amigos';
  }
  if (isRequestReceivedFrom(user.id)) {
    return 'Responder Solicitação';
  }
  if (isRequestSentTo(user.id)) {
    return 'Solicitação Enviada';
  }
  return 'Adicionar Amigo';
};

const isButtonDisabled = (user: UsuarioSummaryDTO): boolean => {
  // Desabilita se já são amigos ou se uma solicitação já foi enviada E AINDA ESTÁ PENDENTE
  // Se for uma solicitação recebida, o botão não estará desabilitado, mas terá outra ação.
  return isAlreadyFriend(user.id) || (isRequestSentTo(user.id));
};

const getButtonClass = (user: UsuarioSummaryDTO): string[] => {
  if (isAlreadyFriend(user.id)) {
    return ['btn-already-friends'];
  }
  if (isRequestReceivedFrom(user.id)) {
    return ['btn-respond-request'];
  }
  if (isRequestSentTo(user.id)) {
    return ['btn-request-sent'];
  }
  return ['btn-add-friend'];
};

</script>

<style scoped>
.find-users-container {
  max-width: 700px;
  margin: 20px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.find-users-container h2 {
  text-align: center;
  margin-bottom: 25px;
}
.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.search-bar input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}
.search-bar button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.search-bar button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.users-list {
  list-style: none;
  padding: 0;
}
.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.user-item:last-child {
  border-bottom: none;
}
.user-item button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  min-width: 150px; /* Para acomodar textos maiores */
  text-align: center;
}
.user-item button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Classes de botão específicas */
.btn-add-friend {
  background-color: #28a745; /* Verde */
  color: white;
}
.btn-add-friend:hover:not(:disabled) {
  background-color: #218838;
}
.btn-request-sent, .btn-already-friends {
  background-color: #6c757d; /* Cinza */
  color: white;
}
.btn-respond-request {
  background-color: #ffc107; /* Amarelo */
  color: #212529;
}
.btn-respond-request:hover:not(:disabled) {
  background-color: #e0a800;
}


.error-message, .no-results-message {
  text-align: center;
  padding: 10px;
  margin-top: 10px;
  color: #6c757d;
}
.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}
</style>
