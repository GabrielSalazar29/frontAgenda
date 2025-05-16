<template>
  <section id="section02">

    <div class="boxlogin">
      <div id="logodiv" class="logodivreg">
        <div id="textlogodiv" class="textlogodiv">
          <h3 id="h3sec1" class="textdivs1">Agenda</h3>
          <h1 id="h1sec1" class="textdivs1">de Compromissos</h1>
        </div>
        <img src="../assets/logowhite.png" alt="logomarca do projeto">
      </div>

      <div id="divsec2">
          <form @submit.prevent="handleRegistrar" class="login-form">
              <label class="labeltext">Usuário:</label>
              <input type="text" class="inputlogin" id="username" v-model="username" required :disabled="loading" />
              
              <label class="labeltext">Senha:</label>
              <input type="password" class="inputlogin" id="password" v-model="password" required :disabled="loading" />
              <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
              <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

              <div class="footerForm" style="margin: 1.5rem 0;">
                <button class="submitbutton2" type="submit" :disabled="loading">
                  {{ loading ? 'Registrando...' : 'Registrar' }}
                </button>
              </div>
          </form>

          <div id="register">
            <label> Ja possui conta? </label>
            <a class="link" @click="handleLogin"> Logar.</a>
          </div>
      </div>
    </div>
  </section>

  <section id="section01" class="section01reg">
  </section>

</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../services/api';
import { useAuthStore } from '../stores/authStore';

const username = ref<string>(''); // Tipagem explícita
const password = ref<string>(''); // Tipagem explícita
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const loading = ref<boolean>(false);

const router = useRouter();
const authStore = useAuthStore(); 

const handleRegistrar = async () => {
  loading.value = true;

  errorMessage.value=null;
  successMessage.value=null;

  try {
    const response = await apiClient.post( 
        `/usuarios/registrar`,
        {
          username: username.value,
          password: password.value
        }
      );
    successMessage.value = 'Usuário registrado com sucesso! Você pode fazer login agora.';
    
    username.value='';
    password.value='';
    
    setTimeout(() => {
      router.push('/compromissos');
    }, 3000);

  } catch (error: any) {
    console.error('Erro no registro:', error);
    if (error.response && error.response.data) {
      // Se o backend enviar uma mensagem de erro específica (como string)
      if (typeof error.response.data === 'string') {
        errorMessage.value = error.response.data;
      } else if (error.response.data.message) {
        errorMessage.value = `Erro: ${error.response.data.message}`;
      } else {
        errorMessage.value = 'Ocorreu um erro desconhecido durante o registro.';
      }
    } else if (error.request) {
      errorMessage.value = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    } else {
      errorMessage.value = 'Erro ao configurar a requisição de registro.';
    }
  }finally{
    loading.value = false
  }
};

const handleLogin = () => {
  router.push('/'); // Redireciona para a página de login após o logout
};
</script>

<style>
  .logodivreg{
    flex-direction: row-reverse;
  }
  .submitbutton2{
    font-size: 1rem;
    font-weight: 600;
    padding: 0.5rem 3rem;
    background-color: white;
    border: 2px #000000 solid;
    color: rgb(0, 0, 0);
    border-radius: 10px;
    transition: 0.6s;
    width: 50%;
  }
  .submitbutton2:hover{
    background-color: rgb(0, 0, 0);
    border: 2px #ffd000ce solid;
    color: rgb(255, 196, 0);
    cursor: pointer;
    transform: scale(1.1);
  }
  .error-message{
    color: rgb(255, 46, 46);
    font-weight: 500;
    font-size: 1.2rem;
    align-self: center;
  }
  .success-message{
    color: rgb(52, 255, 79);
    font-weight: 500;
    font-size: 1rem;
    align-self: center;
  }
  .section01reg{
    border-left: 2px solid rgb(255, 217, 0);
  }
</style>