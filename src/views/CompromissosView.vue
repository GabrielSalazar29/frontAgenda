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

    <!-- O resto do seu template permanece igual -->
    <section id="calendar">
      <div class="calendar-container">
        <FullCalendar :options="calendarOptions" ref="fullCalendarRef" />
      </div>
    </section>

    <section id="secrender" class="oculto">
      <button @click="handleLogout" id="button-logout" class="oculto">LOGOUT</button>
    </section>

    <CompromissoModal
      :is-open="isModalOpen"
      :mode="modalMode"
      :initial-data="modalInitialData"
      :selected-date="modalSelectedDate"
      :amigos="amigos"
      :is-creator="isCurrentUserTheCreator"
      @close="closeCompromissoModal"
      @save="saveCompromisso"
      @delete="deleteCompromisso"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import FullCalendar from '@fullcalendar/vue3';
import type { CalendarApi, CalendarOptions, EventApi, EventInput, EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

import apiClient from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useFriendStore } from '../stores/friendStore';
import CompromissoModal from '../components/CompromissoModal.vue';
import type { CompromissoFormData } from '../components/CompromissoModal.vue';
import type { UsuarioSummaryDTO } from '../types/amizade';
import { useToast } from "vue-toastification";

const toast = useToast();

interface ApiCompromisso {
  id: number;
  titulo: string;
  descricao: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  local?: string;
  participantes?: UsuarioSummaryDTO[];
  criador?: UsuarioSummaryDTO;
}

const authStore = useAuthStore();
const friendStore = useFriendStore();
const compromissos = ref<ApiCompromisso[]>([]);
const loadingError = ref<string | null>(null);
const fullCalendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const router = useRouter();

// ---- LÓGICA DO MENU HAMBURGER ----
const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};
// ---- FIM DA LÓGICA DO MENU ----

// ---- Estado do Modal ----
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const modalInitialData = ref<Partial<CompromissoFormData> | null>(null);
const modalSelectedDate = ref<string | null>(null);
const isCurrentUserTheCreator = ref(false);
const amigos = computed(() => friendStore.getFriends);

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};

const calendarEvents = computed<EventInput[]>(() => {
  return compromissos.value.map(comp => ({
    id: String(comp.id),
    title: comp.titulo,
    start: comp.dataHoraInicio,
    end: comp.dataHoraFim,
    extendedProps: {
      descricao: comp.descricao,
      local: comp.local,
      participantes: comp.participantes,
      criador: comp.criador
    },
  }));
});

// ---- Funções do Modal (sem alterações) ----
const openCompromissoModal = (mode: 'create' | 'edit', data: DateClickArg | EventApi) => {
  modalMode.value = mode;
  if (mode === 'create') {
    isCurrentUserTheCreator.value = true;
    const clickInfo = data as DateClickArg;
    modalSelectedDate.value = clickInfo.dateStr;
    modalInitialData.value = null;
  } else if (mode === 'edit') {
    const event = data as EventApi;
    const currentUserId = authStore.user?.id;
    const creatorId = event.extendedProps.criador?.id;
    isCurrentUserTheCreator.value = creatorId === currentUserId;
    modalInitialData.value = {
      id: event.id,
      titulo: event.title,
      descricao: event.extendedProps.descricao,
      dataHoraInicio: event.startStr,
      dataHoraFim: event.endStr,
      local: event.extendedProps.local,
      amigoIds: event.extendedProps.participantes?.map((p: any) => p.id).filter((id: number) => id !== creatorId) || [],
      participantes: event.extendedProps.participantes,
      criador: event.extendedProps.criador
    };
    modalSelectedDate.value = null;
  }
  isModalOpen.value = true;
};
const closeCompromissoModal = () => { isModalOpen.value = false; modalInitialData.value = null; modalSelectedDate.value = null; };
const saveCompromisso = async (data: CompromissoFormData) => { try { if (modalMode.value === 'create') { await apiClient.post('/compromissos', data); toast.success("Compromisso criado com sucesso!"); } else if (modalMode.value === 'edit' && data.id) { if (!isCurrentUserTheCreator.value) { toast.error('Apenas o criador pode editar o compromisso.'); return; } await apiClient.put(`/compromissos/${data.id}`, data); toast.success('Compromisso atualizado com sucesso!'); } closeCompromissoModal(); fetchCompromissos(); } catch (error: any) { console.error('Erro ao salvar compromisso:', error); toast.error(`Falha ao salvar compromisso: ${error.response?.data?.message || error.message}`); } };
const deleteCompromisso = async (compromissoId: number | string) => { if (!isCurrentUserTheCreator.value) { toast.error('Apenas o criador pode excluir o compromisso.'); return; } try { await apiClient.delete(`/compromissos/${compromissoId}`); toast.success('Compromisso excluído com sucesso!'); closeCompromissoModal(); fetchCompromissos(); } catch (error: any) { console.error('Erro ao excluir compromisso:', error); toast.error(`Falha ao excluir compromisso: ${error.response?.data?.message || error.message}`); } };
const calendarOptions = ref<CalendarOptions>({ plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin], initialView: 'dayGridMonth', locale: ptBrLocale, headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }, events: calendarEvents, editable: true, selectable: true, selectMirror: true, dayMaxEvents: true, weekends: true, height: '90vh', dateClick: (clickInfo: DateClickArg) => { openCompromissoModal('create', clickInfo); }, eventClick: (clickInfo: EventClickArg) => { openCompromissoModal('edit', clickInfo.event); }, eventDrop: async (dropInfo: EventDropArg) => { if (!confirm(`Você tem certeza que quer mover "${dropInfo.event.title}" para ${dropInfo.event.startStr}?`)) { dropInfo.revert(); } else { try { const updatedCompromisso = { titulo: dropInfo.event.title, descricao: dropInfo.event.extendedProps.descricao, dataHoraInicio: dropInfo.event.start?.toISOString(), dataHoraFim: dropInfo.event.end?.toISOString(), local: dropInfo.event.extendedProps.local, amigoIds: dropInfo.event.extendedProps.participantes?.map((p: any) => p.id).filter((id: number) => id !== authStore.user?.id) || [] }; await apiClient.put(`/compromissos/${dropInfo.event.id}`, updatedCompromisso); toast.success('Compromisso atualizado (movido)!'); fetchCompromissos(); } catch (error: any) { toast.error(`Falha ao mover compromisso: ${error.response?.data?.message || error.message}`); dropInfo.revert(); } } }, eventResize: async (resizeInfo: EventResizeDoneArg) => { if (!confirm(`Você tem certeza que quer redimensionar "${resizeInfo.event.title}" para terminar em ${resizeInfo.event.endStr}?`)) { resizeInfo.revert(); } else { try { const updatedCompromisso = { titulo: resizeInfo.event.title, descricao: resizeInfo.event.extendedProps.descricao, dataHoraInicio: resizeInfo.event.start?.toISOString(), dataHoraFim: resizeInfo.event.end?.toISOString(), local: resizeInfo.event.extendedProps.local, amigoIds: resizeInfo.event.extendedProps.participantes?.map((p: any) => p.id).filter((id: number) => id !== authStore.user?.id) || [] }; await apiClient.put(`/compromissos/${resizeInfo.event.id}`, updatedCompromisso); toast.success('Compromisso atualizado (redimensionado)!'); fetchCompromissos(); } catch (error: any) { toast.error(`Falha ao redimensionar compromisso: ${error.response?.data?.message || error.message}`); resizeInfo.revert(); } } } });
const fetchCompromissos = async () => { if (!authStore.isAuthenticated) { loadingError.value = "Você precisa estar logado para ver os compromissos."; return; } try { loadingError.value = null; const response = await apiClient.get<ApiCompromisso[]>('/compromissos'); compromissos.value = response.data; await nextTick(); const calendarApi = fullCalendarRef.value?.getApi(); if (calendarApi) { calendarApi.refetchEvents(); } } catch (error: any) { console.error("Erro ao buscar compromissos:", error); loadingError.value = "Falha ao carregar compromissos."; if (error.response && error.response.status === 401) { authStore.logout(); } } };
onMounted(() => { if (authStore.token === null && localStorage.getItem('authToken')) { authStore.initializeAuth(); } fetchCompromissos(); friendStore.fetchFriends(); });
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
#calendar {
    display: flex;
    align-items: center;
    width: 100%;
    height: auto;
    background-color: #1B1B1B;
    flex-grow: 1;
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
}
.calendar-container {
    width: 100%;
    padding: 10px;
    padding-bottom: 0;
    box-sizing: border-box;
    overflow: hidden;
}
.oculto{ display: none; }

/* --- ESTILOS DO MENU HAMBURGER (Versão 3) --- */
.hamburger-menu {
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

/* Estilos :deep para o FullCalendar (sem alterações) */
:deep(.fc-toolbar-title) { color: #e3e3e3 !important; text-transform: capitalize !important; }
:deep(.fc-col-header-cell-cushion){ color: #e3e3e3 !important; text-transform: capitalize !important; }
:deep(.fc-daygrid-day-number){ color: #e3e3e3 !important; padding: 15px !important; }
:deep(.fc-event-time){ color: #e3e3e3 !important; }
:deep(.fc-event-title){ color: #e3e3e3 !important; }
:deep(.fc-timegrid-slot-label-frame){ color: #e3e3e3 !important; }
:deep(.fc-list-event){ color: #e3e3e3 !important; }
:deep(.fc-col-header-cell){ border-bottom: none !important; }
:deep(.fc-list-day-text){ color: #e3e3e3 !important; text-transform: capitalize !important; }
:deep(.fc-list-day-cushion){ background: #121212 !important; }
:deep(.fc-list-day-side-text){ color: #e3e3e3 !important; text-transform: capitalize !important; }
</style>
