<template>
  <div class="login-container">
    <h2>Login na Agenda</h2>
    <form @submit.prevent="handleLogin" class="login-form">
      <div class="form-group">
        <label for="username">Usuário:</label>
        <input type="text" id="username" v-model="username" required />
      </div>
      <div class="form-group">
        <label for="password">Senha:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit" class="btn-submit">Entrar</button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios'; // Importa o axios
import { useRouter } from 'vue-router'; // Para redirecionamento

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false); // Para feedback visual durante a requisição
const token = ref(null); // Para exibir o token recebido (apenas para este exemplo)

const router = useRouter();

// URL da sua API backend. Certifique-se de que está correta e que o backend está rodando.
const API_URL = 'http://localhost:8080/api/auth/login';

const handleLogin = async () => {
  errorMessage.value = '';
  loading.value = true;
  token.value = null; // Limpa token anterior (se houver, para o exemplo)

  try {
    const response = await axios.post(API_URL, {
      username: username.value,
      password: password.value,
    });

    // Supondo que sua API retorna { "token": "seu_jwt_aqui", "type": "Bearer" }
    const receivedToken = response.data.token;
    token.value = receivedToken; // Apenas para exibir no exemplo

    console.log('Token recebido:', receivedToken);

    // --- PRÓXIMOS PASSOS IMPORTANTES (Gerenciamento de Estado com Pinia) ---
    // 1. Salvar o token de forma segura e acessível globalmente:
    //    Normalmente, você usaria um store do Pinia para isso.
    //    Ex: authStore.setToken(receivedToken); authStore.setUserDetails(decodedTokenData);
    //    O Pinia pode persistir o token no localStorage.
    //
    //    Para este exemplo simples, vamos colocar no localStorage diretamente,
    //    mas para uma aplicação real, use Pinia!
    localStorage.setItem('authToken', receivedToken);
    localStorage.setItem('username', username.value); // Exemplo, você pode decodificar o usuário do token

    // 2. Redirecionar para a página principal ou de compromissos:
    alert('Login bem-sucedido! Redirecionando...'); // Alerta temporário
    router.push('/'); // Ou para '/compromissos' ou a rota desejada após o login

  } catch (error) {
    console.error('Erro no login:', error);
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status code
      // fora do range de 2xx
      if (error.response.data && error.response.data.message) {
        errorMessage.value = `Erro: ${error.response.data.message}`;
      } else if (error.response.status === 401 || error.response.status === 403) {
        // O backend deve retornar 401 para credenciais inválidas no endpoint de login
        errorMessage.value = 'Usuário ou senha inválidos. Verifique suas credenciais.';
      } else {
        errorMessage.value = `Erro do servidor: ${error.response.status} - ${error.response.statusText}`;
      }
    } else if (error.request) {
      // A requisição foi feita mas nenhuma resposta foi recebida
      // `error.request` é uma instância de XMLHttpRequest no browser e uma instância de
      // http.ClientRequest no node.js
      errorMessage.value = 'Não foi possível conectar ao servidor. Verifique sua conexão e se a API está online.';
      console.error('Nenhuma resposta recebida:', error.request);
    } else {
      // Algo aconteceu na configuração da requisição que acionou um Erro
      errorMessage.value = 'Erro ao configurar a requisição de login.';
      console.error('Erro na configuração da requisição:', error.message);
    }
  } finally {
    loading.value = false; // Finaliza o estado de carregamento
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: #ffffff;
  text-align: center;
}

.login-container h2 {
  margin-bottom: 25px;
  color: #333;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="password"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 16px;
}

.form-group input[type="text"]:focus,
.form-group input[type="password"]:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn-submit {
  padding: 12px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s ease-in-out;
}

.btn-submit:hover {
  background-color: #0056b3;
}

.error-message {
  color: #dc3545; /* Vermelho para erros */
  margin-top: 15px;
  font-size: 0.9em;
}
</style>