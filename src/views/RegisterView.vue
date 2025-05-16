<template>
  <section id="section02">

    <div id="logodiv">
      <div id="textlogodiv">
        <h3 id="h3sec1" class="textdivs1">Agenda</h3>
        <h1 id="h1sec1" class="textdivs1">de Compromissos</h1>
      </div>
      <img src="../assets/logowhite.png" alt="logomarca do projeto">
    </div>
   

    <div id="divsec2">
        <form @submit.prevent="handleRegistrar" class="login-form">
            <label class="label">Usuário:</label>
            <input type="text" class="input" id="username" v-model="username" required :disabled="loading" />
            <label class="label">Senha:</label>
            <input type="password" class="input" id="password" v-model="password" required :disabled="loading" />
            <div class="footerForm">
                <button type="submit" :disabled="loading">
                    {{ loading ? 'Registrando...' : 'Registrar' }}
                </button>
            </div>
        </form>
         <div id="register">
          <label> Ja possui conta? </label>
          <a class="link" @click="handleLogin"> Logar.</a>
         </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../services/api';

const username = ref<string>(''); // Tipagem explícita
const password = ref<string>(''); // Tipagem explícita
const loading = ref<boolean>(false);
const router = useRouter();

const handleRegistrar = async () => {
  loading.value = true;

  try {
    const response = await apiClient.post( 
        `/usuarios/registrar`,
        {
          username: username.value,
          password: password.value
        }
      );

    router.push('/compromissos');
    
  } catch (error) {
    
    console.error('Falha no registro:', error);
  }finally{
    loading.value = false
  }
};

const handleLogin = () => {
  router.push('/'); // Redireciona para a página de login após o logout
};
</script>
