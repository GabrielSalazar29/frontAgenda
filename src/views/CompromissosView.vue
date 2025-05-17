<template>
  <section class="comp-main">
    <div class="text-content">
      <h1>MEUS COMPROMISSOS</h1>
      <p v-if="authStore.isAuthenticated">
        <h>Bem-vindo, </h><h style="color: #FFB22C; font-weight: 500;">{{ authStore.getUsername }}! </h><h>Aqui estarão seus compromissos.</h>
      </p>
      <p v-else>
        Você precisa estar logado para ver seus compromissos.
      </p>
    </div>
    <button @click="handleLogout" class="logout-button">LOGOUT</button>
  </section>
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
  main{
    display: flex;
    flex-direction: column;
  }
  .comp-main{
    display: flex;
    flex-direction: column;
    align-items: center;
    color: white;
    background-color: rgb(0, 0, 0);
    width: 100%;
    padding: 1rem;
  }

  .logout-button{
    font-size: 1.2rem;
    padding: 0 1rem;
    background-color: rgb(0, 0, 0);
    color: white;
    border: none;
    border: 2px white solid;
    border-radius: 20px;
    height: 50px;
    transition: 0.5s;
    font-weight: 500;
  }.logout-button:hover{
    transition: 0.5s;
    box-shadow: rgb(255, 198, 11) 0px 0px 5px 0px;
    cursor: pointer;
    transform: scale(1.03);
  }

  .text-content{
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 1.5rem;
  }
</style>

