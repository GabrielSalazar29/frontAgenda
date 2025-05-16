<template>
  <section id="section01">
        <h1 class="texts1" style="font-size: 6vh;">PROJETO</h1>
        <h1 class="texts1" style="font-size: 20vh;">JAVA</h1>
        <h1 class="texts1" style="font-size: 6vh;">PROJETO</h1>
        <h1 class="texts1" style="font-size: 20vh;">JAVA</h1>
        <h1 class="texts1" style="font-size: 6vh;">PROJETO</h1>
        <h1 class="texts1" style="font-size: 20vh;">JAVA</h1>
        <h1 class="texts1" style="font-size: 6vh;">PROJETO</h1>
        <h1 class="texts1" style="font-size: 20vh;">JAVA</h1>      <h1 class="texts1" style="font-size: 6vh;">PROJETO</h1>
        <h1 class="texts1" style="font-size: 20vh;">JAVA</h1>
  </section>
  <section id="section02">

    <div id="logodiv">
      <div id="textlogodiv">
        <h3 id="h3sec1" class="textdivs1">Agenda</h3>
        <h1 id="h1sec1" class="textdivs1">de Compromissos</h1>
      </div>
      <img src="../assets/logowhite.png" alt="logomarca do projeto">
    </div>
   

    <div id="divsec2">
        <form @submit.prevent="handleLogin" class="login-form">
            <label class="label">Usuário:</label>
            <input type="text" class="input" id="username" v-model="username" required :disabled="authStore.isLoading" />
            <label class="label">Senha:</label>
            <input type="password" class="input" id="password" v-model="password" required :disabled="authStore.isLoading" />
            <div class="footerForm">
                <p v-if="authStore.getErrorMessage" class="error-msg">{{ authStore.getErrorMessage }}</p>
                <button type="submit" :disabled="authStore.isLoading">
                    {{ authStore.isLoading ? 'Entrando...' : 'Entrar' }}
                </button>
            </div>
        </form>
        <div id="register">
          <label> Ainda não é cadastrado? </label>
          <a class="link" @click="handleRegister"> Registre-se.</a>
         </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const username = ref<string>(''); // Tipagem explícita
const password = ref<string>(''); // Tipagem explícita

const router = useRouter();
const authStore = useAuthStore(); // Usa o store

const handleLogin = async () => {
  try {
    await authStore.login({ username: username.value, password: password.value });
    if (authStore.isAuthenticated) {
      router.push('/compromissos');
    }
  } catch (error) {
    // O store já define a errorMessage
    console.error('Falha no login (componente):', error);
  }
};

const handleRegister = () => {
    authStore.errorMessage = null;
    router.push('/registrar'); // Redireciona para a página de login após o logout
};
</script>
