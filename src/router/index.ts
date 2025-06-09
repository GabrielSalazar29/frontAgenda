import { createRouter, createWebHistory, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import { useAuthStore } from '../stores/authStore';
import FriendsListView from '../views/FriendsListView.vue';
import FriendRequestsView from '../views/FriendRequestsView.vue';
import FindUsersView from '../views/FindUsersView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true } // Para redirecionar se já estiver logado
    },
    {
      path: '/registrar',
      name: 'registrar',
      component: RegisterView,
      meta: { requiresGuest: true } // Para redirecionar se já estiver logado
    },
    {
      path: '/compromissos', // Rota protegida de exemplo
      name: 'compromissos',
      // component: CompromissosView, // Seu componente de compromissos
      // Exemplo de lazy loading para o componente de compromissos:
      component: () => import('../views/CompromissosView.vue'), // Crie este arquivo
      meta: { requiresAuth: true } // Marca esta rota como necessitando de autenticação
    }, {
      path: '/amigos',
      name: 'friendsList',
      component: FriendsListView,
      meta: { requiresAuth: true }
    },
    {
      path: '/solicitacoes-amizade',
      name: 'friendRequests',
      component: FriendRequestsView,
      meta: { requiresAuth: true }
    },{
      path: '/encontrar-amigos',
      name: 'findUsers',
      component: FindUsersView,
      meta: { requiresAuth: true }
    },
  ]
});

// Guarda de Navegação Global
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const authStore = useAuthStore(); // Obtém a instância do store DENTRO do guard

  // Tenta inicializar o authStore se ainda não foi,
  // especialmente se o usuário recarregar a página em uma rota protegida.
  // (Embora a chamada em App.vue possa já ter feito isso)
  if (authStore.token === null && localStorage.getItem('authToken')) {
      authStore.initializeAuth();
  }

  const requiresAuth = to.meta.requiresAuth as boolean | undefined;
  const requiresGuest = to.meta.requiresGuest as boolean | undefined;

  if (requiresAuth && !authStore.isAuthenticated) {
    // Se a rota requer autenticação e o usuário não está logado, redireciona para login
    console.log('Redirecionando para /login porque requiresAuth é true e não está autenticado');
    next({ name: 'login', query: { redirect: to.fullPath } }); // Salva a rota original para redirecionar após login
  } else if (requiresGuest && authStore.isAuthenticated) {
    // Se a rota é para "convidados" (como login) e o usuário já está logado, redireciona para home
    console.log('Redirecionando para / porque requiresGuest é true e está autenticado');
    next({ name: 'compromissos' });
  }
  else {
    // Caso contrário, permite a navegação
    next();
  }
});

export default router;