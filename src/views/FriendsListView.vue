<template>
  <div class="friends-list-container">
    <h2>Meus Amigos</h2>
    <div v-if="friendStore.isLoadingFriends" class="loading-message">
      Carregando amigos...
    </div>
    <div v-else-if="friendStore.getError && !friendStore.isLoadingFriends && !friends.length" class="error-message">
      {{ friendStore.getError }}
    </div>
    <div v-else-if="friends.length === 0" class="no-friends-message">
      Você ainda não tem amigos. <RouterLink to="/encontrar-amigos">Encontre amigos</RouterLink>
    </div>
    <ul v-else class="friends-list">
      <li v-for="friend in friends" :key="friend.id" class="friend-item">
        <span>{{ friend.username }} (ID: {{ friend.id }})</span>
        <button @click="handleUnfriend(friend.id)" class="btn-unfriend" :disabled="processingUnfriendId === friend.id">
          {{ processingUnfriendId === friend.id ? 'Desfazendo...' : 'Desfazer Amizade' }}
        </button>
      </li>
    </ul>
    <p v-if="friendStore.getActionError" class="error-message action-error">{{ friendStore.getActionError }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref as vueRef } from 'vue';
import { RouterLink } from 'vue-router';
import { useFriendStore } from '../stores/friendStore';
import type { UsuarioSummaryDTO } from '../types/amizade';

const friendStore = useFriendStore();
const processingUnfriendId = vueRef<number | null>(null);

// Propriedade computada para acessar a lista de amigos da store
const friends = computed<UsuarioSummaryDTO[]>(() => friendStore.getFriends);

onMounted(() => {
  friendStore.error = null; // Limpa erros anteriores ao montar
  friendStore.actionError = null;
  friendStore.fetchFriends();
});

const handleUnfriend = async (friendId: number) => {
  if (processingUnfriendId.value) return; // Evita múltiplos cliques

  if (confirm(`Tem certeza que quer desfazer a amizade com o usuário ID ${friendId}?`)) {
    processingUnfriendId.value = friendId;
    friendStore.actionError = null;
    try {
      await friendStore.unfriend(friendId);
      alert('Amizade desfeita.');
      // A lista de amigos será atualizada automaticamente pela store após a ação de unfriend
    } catch (error: any) {
      // O erro já deve estar em friendStore.actionError, mas podemos adicionar um alerta se preferir
      alert(`Erro ao desfazer amizade: ${friendStore.getActionError || 'Tente novamente.'}`);
      console.error("Erro unfriend no componente:", error);
    } finally {
      processingUnfriendId.value = null;
    }
  }
};
</script>

<style scoped>
.friends-list-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.friends-list-container h2 {
  text-align: center;
  margin-bottom: 20px;
}
.loading-message, .error-message, .no-friends-message {
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
.no-friends-message {
  color: #6c757d;
}
.friends-list {
  list-style: none;
  padding: 0;
}
.friend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.friend-item:last-child {
  border-bottom: none;
}
.btn-unfriend {
  padding: 5px 10px;
  background-color: #ffc107;
  color: #212529;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-unfriend:hover:not(:disabled) {
  background-color: #e0a800;
}
.btn-unfriend:disabled {
  background-color: #6c757d;
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
