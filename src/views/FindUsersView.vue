<template>
  <div class="body">
  <section id="rgcolumn">
      <div id="logodiv">
        <img src="../assets/logowhite.png" alt="logomarca do projeto">
        <div id="textlogodiv" class="textlogodiv">
          <h3 id="h3sec1" class="textdivs1">Agenda</h3>
          <h1 id="h1sec1" class="textdivs1">de Compromissos</h1>
        </div>
      </div>
      <div id="log-conteiner">
        <h2> Logado como: {{ authStore.getUsername?.charAt(0).toUpperCase() + authStore.getUsername?.slice(1) }}. </h2>
      </div>
                  <!-- BOTÃO DO HAMBURGER COM CLASSE DINÂMICA PARA ANIMAÇÃO -->
      <button @click="toggleMenu" class="hamburger-menu" :class="{ 'is-active': isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- Links e Logout agora estão dentro do mesmo contêiner -->
      <div class="links" :class="{ 'menu-open': isMenuOpen }">
        <RouterLink to="/compromissos" @click="closeMenu">Home</RouterLink>
        <RouterLink to="/amigos" @click="closeMenu">Amigos</RouterLink>
        <RouterLink to="/solicitacoes-amizade" @click="closeMenu">Solicitações</RouterLink>
        <RouterLink to="/encontrar-amigos" @click="closeMenu">Encontrar Amigos</RouterLink>
        <!-- Botão de logout movido para aqui -->
        <button @click="handleLogout" class="logout-button-mobile">LOGOUT</button>
      </div>

      <!-- Botão de logout original para ecrãs grandes -->
      <button @click="handleLogout" class="logout-button">LOGOUT</button>
    </section>
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
        <span>{{ user.username }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router'; // Importar useRouter
import { useFriendStore } from '../stores/friendStore';
import type { UsuarioSummaryDTO, SolicitacaoAmizadeDTO } from '../types/amizade';
import { StatusAmizade } from '../types/amizade'; // Importar o enum
import { useAuthStore } from '@/stores/authStore';
const authStore = useAuthStore();


const friendStore = useFriendStore();
const router = useRouter();
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

// ---- LÓGICA DO MENU HAMBURGER ----
const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};
// ---- FIM DA LÓGICA DO MENU ----

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
const handleLogout = () => {
  authStore.logout();
  router.push('/');
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
.body {
    display: flex;
    flex-direction: column;
    height: 110vh !important;
    overflow: hidden;
    width: 100%;
    margin: 0;
}

#rgcolumn {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 6rem;
    justify-content: space-around;
    background-color: #0D0C0C;
    position: relative;
    z-index: 10; /* CORREÇÃO FINAL: Garante que o cabeçalho fique acima do resto do conteúdo */
}

#logodiv {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 0;
  margin-left: 3%;
}

.links {
  display: flex;
  gap: 25px;
  margin-right: 20px;
}
.links a {
  color: white !important;
  white-space: nowrap;
}

#log-conteiner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: white;
}

.logout-button {
  font-size: 1.2rem;
  padding: 0 1rem;
  background-color: rgb(0, 0, 0);
  color: white;
  border: none;
  border: 2px white solid;
  border-radius: 20px;
  height: 50px;
  width: 250px;
  transition: 0.5s;
  font-weight: 500;
  margin: 3rem;
  margin-inline: 2rem;
}
.logout-button:hover {
  transition: 0.5s;
  box-shadow: rgb(255, 198, 11) 0px 0px 5px 0px;
  cursor: pointer;
  transform: scale(1.03);
}.hamburger-menu {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  z-index: 1002;
}
.hamburger-menu span {
  display: block;
  width: 25px;
  height: 3px;
  margin: 5px 0;
  background-color: white;
  transition: all 0.3s ease-in-out;
}
.hamburger-menu.is-active span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.hamburger-menu.is-active span:nth-child(2) {
  opacity: 0;
}
.hamburger-menu.is-active span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

.logout-button-mobile { display: none; }

@media screen and (max-width: 1336px) {
  #rgcolumn .logout-button {
    display: none;
  }
  
  .hamburger-menu {
    display: block;
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
  }

  .links {
    position: absolute;
    top: 6rem;
    left: 0;
    width: 100%;
    background-color: #0D0C0C;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    border-top: 1px solid #333;
    z-index: 1001;
    
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    padding: 10px 0;

    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: opacity 0.3s ease, transform 0.3s ease, visibility 0s 0.3s;
  }
  
  .links.menu-open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    transition: opacity 0.3s ease, transform 0.3s ease, visibility 0s 0s;
  }

  .links a {
    color: white !important;
    padding: 15px 0;
    width: 100%;
    text-align: center;
    border-bottom: 1px solid #222;
  }
  .links a:last-of-type {
    border-bottom: none;
  }

  .links .logout-button-mobile {
    display: block;
    font-size: 1.2rem;
    padding: 15px 1rem;
    background-color: transparent;
    color: #ff4d4d;
    border: none;
    width: 100%;
    transition: 0.3s;
    font-weight: 500;
    margin: 0;
    border-radius: 0;
    height: auto;
  }
  .links .logout-button-mobile:hover {
    background-color: #ff4d4d;
    color: white;
    box-shadow: none;
    transform: none;
  }

  #rgcolumn { justify-content: flex-start; }
  #log-conteiner { flex-grow: 1; justify-content: center; margin-left: 0; }
}

@media screen and (max-width: 750px){
    #rgcolumn {
        flex-direction: column;
        height: auto;
        padding-bottom: 2rem;
        padding-right: 0;
        justify-content: center;
    }
    .hamburger-menu {
        top: 20px;
        right: 20px;
        transform: none; 
    }
    #log-conteiner { margin-top: 2rem; width: 100%; height: auto; text-align: center; }
    #logodiv { display: flex; width: 90%; margin-top: 2rem; margin-left: 0; justify-content: center; }
    #calendar { padding-top: 1rem; }
    .calendar-container { width: 100%; height: 100%; padding: 10px; box-sizing: border-box; }
    #secrender, .oculto { display: none; }
}
.find-users-container {
  max-width: 1024px;
  margin: 20px auto;
  padding: 20px;
  color: #f9f9f9;
  width: 100%;
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
