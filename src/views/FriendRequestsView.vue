<template>
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
</template>

<script setup lang="ts">
import { onMounted, computed, ref as vueRef } from 'vue';
import { RouterLink } from 'vue-router';
import { useFriendStore } from '../stores/friendStore';
import type { SolicitacaoAmizadeDTO } from '../types/amizade';

const friendStore = useFriendStore();
const currentSection = vueRef<'incoming' | 'outgoing' | 'incoming_action' | null>(null); // Para diferenciar erros e loadings
const processingRequestId = vueRef<number | null>(null);
const actionType = vueRef<'accept' | 'reject' | null>(null);

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

const handleAccept = async (amizadeId: number) => {
  if (processingRequestId.value) return;
  processingRequestId.value = amizadeId;
  actionType.value = 'accept';
  currentSection.value = 'incoming_action';
  friendStore.actionError = null;
  try {
    await friendStore.acceptFriendRequest(amizadeId);
    alert('Solicitação aceita!');
  } catch (error) {
    // O erro já está em friendStore.actionError
    alert(`Erro ao aceitar solicitação: ${friendStore.getActionError || 'Tente novamente.'}`);
    console.error(error);
  } finally {
    processingRequestId.value = null;
    actionType.value = null;
    currentSection.value = null;
  }
};

const handleReject = async (amizadeId: number) => {
  if (processingRequestId.value) return;
  processingRequestId.value = amizadeId;
  actionType.value = 'reject';
  currentSection.value = 'incoming_action';
  friendStore.actionError = null;
  try {
    await friendStore.rejectFriendRequest(amizadeId);
    alert('Solicitação rejeitada.');
  } catch (error) {
    alert(`Erro ao rejeitar solicitação: ${friendStore.getActionError || 'Tente novamente.'}`);
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
.requests-container {
  max-width: 700px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.requests-container h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
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
  color: #6c757d;
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
  color: #6c757d;
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
