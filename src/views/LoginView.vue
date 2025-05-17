<template>
  <section id="section01">
    <div class="sectionLogo">
      <img src="/src/assets/javalogo.png" alt="javalogo" class="javalogo">
    </div>
  </section>

  <section id="section02">

    <div class="boxlogin">
      <div id="logodiv">
        <img src="../assets/logowhite.png" alt="logomarca do projeto">
        <div id="textlogodiv" class="textlogodiv">
          <h3 id="h3sec1" class="textdivs1">Agenda</h3>
          <h1 id="h1sec1" class="textdivs1">de Compromissos</h1>
        </div>
      </div>

      <div id="divsec2">
          <form @submit.prevent="handleLogin" class="login-form">
              <label class="labeltext">Usuário:</label>
              <input type="text" class="inputlogin" id="username" v-model="username" required :disabled="authStore.isLoading" />

              <label class="labeltext">Senha:</label>
              <input type="password" class="inputlogin" id="password" style="margin-bottom: 0;" v-model="password" required :disabled="authStore.isLoading" />
              <p v-if="authStore.getErrorMessage" class="error-msg">{{ authStore.getErrorMessage }}</p>
              
              <div class="footerForm">
                <button class="submitbutton" type="submit" :disabled="authStore.isLoading">
                  {{ authStore.isLoading ? 'Entrando...' : 'Entrar' }}
                </button>
              </div>
          </form>
          
          <div id="register">
            <label> Ainda não é cadastrado? </label>
            <a class="link" @click="handleRegister"> Registre-se.</a>
          </div>
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


<style scoped>
  main{
    display: flex;
    flex-direction: row;
  }

  .sectionLogo{
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    img{
      filter: contrast(1000%);
      width: 50%;
      height: auto;
    }
  }
</style>