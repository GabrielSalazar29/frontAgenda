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
        <span>{{ friend.username }}</span>
        <button @click="handleUnfriend(friend.id)" class="btn-unfriend" :disabled="processingUnfriendId === friend.id">
          {{ processingUnfriendId === friend.id ? 'Desfazendo...' : 'Desfazer Amizade' }}
        </button>
      </li>
    </ul>
    <p v-if="friendStore.getActionError" class="error-message action-error">{{ friendStore.getActionError }}</p>
  </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref as vueRef } from 'vue';
import { RouterLink } from 'vue-router';
import { useFriendStore } from '../stores/friendStore';
import type { UsuarioSummaryDTO } from '../types/amizade';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from "vue-toastification";

const toast = useToast();
const router = useRouter();
const authStore = useAuthStore();
const friendStore = useFriendStore();
const processingUnfriendId = vueRef<number | null>(null);

// ---- LÓGICA DO MENU HAMBURGER ----
const isMenuOpen = vueRef(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};
// ---- FIM DA LÓGICA DO MENU ----

// Propriedade computada para acessar a lista de amigos da store
const friends = computed<UsuarioSummaryDTO[]>(() => friendStore.getFriends);

onMounted(() => {
  friendStore.error = null; // Limpa erros anteriores ao montar
  friendStore.actionError = null;
  friendStore.fetchFriends();
});
const handleLogout = () => {
  authStore.logout();
  router.push('/');
};
const handleUnfriend = async (friendId: number) => {
  if (processingUnfriendId.value) return; // Evita múltiplos cliques

  if (confirm(`Tem certeza que quer desfazer a amizade com o usuário ID ${friendId}?`)) {
    processingUnfriendId.value = friendId;
    friendStore.actionError = null;
    try {
      await friendStore.unfriend(friendId);
      toast.success('Amizade desfeita.');
      // A lista de amigos será atualizada automaticamente pela store após a ação de unfriend
    } catch (error: any) {
      // O erro já deve estar em friendStore.actionError, mas podemos adicionar um alerta se preferir
      toast.error(`Erro ao desfazer amizade: ${friendStore.getActionError || 'Tente novamente.'}`);
    } finally {
      processingUnfriendId.value = null;
    }
  }
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
.friends-list-container {
  max-width: 1024px;
  margin: 20px auto;
  color: white;
  width: 100%;
  padding: 20px;
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
