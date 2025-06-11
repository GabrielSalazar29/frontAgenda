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
  <div class="requests-container">
    <section class="incoming-requests">
      <h2>Solicitações de Amizade Recebidas</h2>
      <div v-if="friendStore.isLoadingIncomingRequests" class="loading-message">
        Carregando solicitações recebidas...
      </div>
      <div v-else-if="friendStore.getError && currentSection === 'incoming'" class="error-message">
        {{ friendStore.getError }}
      </div>
      <div v-else-if="incomingRequests.length === 0" class="no-requests-message">
        Você não tem nenhuma solicitação de amizade pendente recebida.
      </div>
      <ul v-else class="requests-list">
        <li v-for="request in incomingRequests" :key="request.id" class="request-item">
          <div class="request-info">
            <span>De: <strong>{{ request.solicitante.username }}</strong></span>
            <span class="request-date"> ({{ formatDate(request.dataSolicitacao) }})</span>
          </div>
          <div class="request-actions">
            <button @click="handleAccept(request.id)" class="btn-accept" :disabled="processingRequestId === request.id">
              {{ processingRequestId === request.id && actionType === 'accept' ? 'Processando...' : 'Aceitar' }}
            </button>
            <button @click="handleReject(request.id)" class="btn-reject" :disabled="processingRequestId === request.id">
              {{ processingRequestId === request.id && actionType === 'reject' ? 'Processando...' : 'Rejeitar' }}
            </button>
          </div>
        </li>
      </ul>
      <p v-if="friendStore.getActionError && currentSection === 'incoming_action'" class="error-message action-error">
        {{ friendStore.getActionError }}
      </p>
    </section>

    <hr class="section-divider">

    <section class="outgoing-requests">
      <h2>Solicitações de Amizade Enviadas</h2>
      <div v-if="friendStore.isLoadingOutgoingRequests" class="loading-message">
        Carregando solicitações enviadas...
      </div>
      <div v-else-if="friendStore.getError && currentSection === 'outgoing'" class="error-message">
        {{ friendStore.getError }}
      </div>
      <div v-else-if="outgoingRequests.length === 0" class="no-requests-message">
        Você não enviou nenhuma solicitação de amizade pendente.
         <RouterLink to="/encontrar-amigos">Encontre amigos</RouterLink> para enviar novas solicitações.
      </div>
      <ul v-else class="requests-list">
        <li v-for="request in outgoingRequests" :key="request.id" class="request-item">
          <div class="request-info">
            <span>Para: <strong>{{ request.solicitado.username }}</strong></span>
            <span class="request-date"> ({{ formatDate(request.dataSolicitacao) }}) - Status: {{ request.status }}</span>
          </div>
          <div class="request-actions">
            </div>
        </li>
      </ul>
    </section>
  </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref as vueRef } from 'vue';
import { RouterLink } from 'vue-router';
import { useFriendStore } from '../stores/friendStore';
import type { SolicitacaoAmizadeDTO } from '../types/amizade';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from "vue-toastification";

const toast = useToast();
const authStore = useAuthStore();
const friendStore = useFriendStore();
const currentSection = vueRef<'incoming' | 'outgoing' | 'incoming_action' | null>(null); // Para diferenciar erros e loadings
const processingRequestId = vueRef<number | null>(null);
const actionType = vueRef<'accept' | 'reject' | null>(null);
const router = useRouter();
const incomingRequests = computed<SolicitacaoAmizadeDTO[]>(() => friendStore.getIncomingRequests);
const outgoingRequests = computed<SolicitacaoAmizadeDTO[]>(() => friendStore.getOutgoingRequests);

onMounted(async () => {
  friendStore.error = null;
  friendStore.actionError = null;

  currentSection.value = 'incoming';
  await friendStore.fetchIncomingRequests();
  currentSection.value = 'outgoing';
  await friendStore.fetchOutgoingRequests();
  currentSection.value = null;
});

// ---- LÓGICA DO MENU HAMBURGER ----
const isMenuOpen = vueRef(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};
// ---- FIM DA LÓGICA DO MENU ----

const handleAccept = async (amizadeId: number) => {
  if (processingRequestId.value) return;
  processingRequestId.value = amizadeId;
  actionType.value = 'accept';
  currentSection.value = 'incoming_action';
  friendStore.actionError = null;
  try {
    await friendStore.acceptFriendRequest(amizadeId);
    toast.success('Solicitação aceita!');
  } catch (error) {
    // O erro já está em friendStore.actionError
    toast.error(`Erro ao aceitar solicitação: ${friendStore.getActionError || 'Tente novamente.'}`);
    console.error(error);
  } finally {
    processingRequestId.value = null;
    actionType.value = null;
    currentSection.value = null;
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};

const handleReject = async (amizadeId: number) => {
  if (processingRequestId.value) return;
  processingRequestId.value = amizadeId;
  actionType.value = 'reject';
  currentSection.value = 'incoming_action';
  friendStore.actionError = null;
  try {
    await friendStore.rejectFriendRequest(amizadeId);
    toast.success('Solicitação rejeitada.');
  } catch (error) {
    toast.error(`Erro ao rejeitar solicitação: ${friendStore.getActionError || 'Tente novamente.'}`);
    console.error(error);
  } finally {
    processingRequestId.value = null;
    actionType.value = null;
    currentSection.value = null;
  }
};

// const cancelOutgoingRequest = async (amizadeId: number) => {
//   // Implementar lógica e chamada à store/API
//   alert(`Cancelar solicitação ID ${amizadeId} (não implementado)`);
// };

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
.requests-container {
  max-width: 1024px;
  margin: 20px auto;
  padding: 20px;
  width: 100%;
  color: #f9f9f9;
}
.requests-container h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #ffffff;
}
.section-divider {
  margin: 30px 0;
  border: 0;
  border-top: 1px solid #ddd;
}
.loading-message, .error-message, .no-requests-message {
  text-align: center;
  padding: 10px;
  margin-top: 10px;
}
.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}
.action-error {
  margin-top: 15px;
}
.no-requests-message {
  color: #ffffffcb;
}
.requests-list {
  list-style: none;
  padding: 0;
}
.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 10px;
  border-bottom: 1px solid #eee;
}
.request-item:last-child {
  border-bottom: none;
}
.request-info {
  flex-grow: 1;
}
.request-date {
  font-size: 0.9em;
  color: #d1d1d1;
  margin-left: 5px;
}
.request-actions button {
  margin-left: 10px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  min-width: 90px; /* Para acomodar "Processando..." */
  text-align: center;
}
.request-actions button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
.btn-accept {
  background-color: #28a745;
  color: white;
}
.btn-accept:hover:not(:disabled) {
  background-color: #218838;
}
.btn-reject {
  background-color: #ffc107;
  color: #212529;
}
.btn-reject:hover:not(:disabled) {
  background-color: #e0a800;
}
.btn-cancel-req {
  background-color: #6c757d;
  color: white;
}
.btn-cancel-req:hover:not(:disabled) {
  background-color: #5a6268;
}
</style>
