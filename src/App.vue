<template>
  <main>
    <RouterView /> 
  </main>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useAuthStore } from './stores/authStore'; // Importa o store de autenticação
import { onMounted } from 'vue'; // Para executar código quando o componente é montado

const authStore = useAuthStore();
const router = useRouter();

// Chama initializeAuth quando o componente App é montado para garantir
// que o estado seja carregado do localStorage se a página for recarregada.
// Isso é importante para manter o usuário logado entre sessões do navegador.
onMounted(() => {
  authStore.initializeAuth();
});

</script>