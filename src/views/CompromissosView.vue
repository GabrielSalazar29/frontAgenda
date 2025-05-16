<template>
  <div>
    <h1>Meus Compromissos</h1>
    <p v-if="authStore.isAuthenticated">
      Bem-vindo, {{ authStore.getUsername }}! Aqui estarão seus compromissos.
    </p>
    <p v-else>
      Você precisa estar logado para ver seus compromissos.
    </p>
    </div>
    <button @click="handleLogout" class="logout-button">Logout</button>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore'; // Importa o store de autenticação

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout(); // Chama a ação de logout da store Pinia
  router.push('/'); // Redireciona para a página de login após o logout
};
</script>

<style scoped>
div{
    color: #fff
}
</style>

