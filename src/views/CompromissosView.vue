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
      <RouterLink to="/amigos">Meus Amigos</RouterLink> |
      <RouterLink to="/solicitacoes-amizade">Solicitações</RouterLink> |
      <RouterLink to="/encontrar-amigos">Encontrar Amigos</RouterLink> | <span>Olá, {{ authStore.getUsername }}!</span>
      <button @click="handleLogout" class="logout-button">LOGOUT</button>
    </section>

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
import { useRouter, RouterLink } from 'vue-router'; // Adicionado RouterLink
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
import { useFriendStore } from '../stores/friendStore'; // Importar a store de amigos
import CompromissoModal from '../components/CompromissoModal.vue';
import type { CompromissoFormData } from '../components/CompromissoModal.vue';
import type { UsuarioSummaryDTO } from '../types/amizade';
// Interface para os dados como vêm da API do backend
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
const friendStore = useFriendStore(); // Instanciar a store de amigos
const compromissos = ref<ApiCompromisso[]>([]);
const loadingError = ref<string | null>(null);
const fullCalendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const router = useRouter();

// ---- Estado do Modal ----
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const modalInitialData = ref<Partial<CompromissoFormData> | null>(null);
const modalSelectedDate = ref<string | null>(null);
const isCurrentUserTheCreator = ref(false); // NOVO: Para controlar a permissão de edição
// Propriedade computada para a lista de amigos
const amigos = computed(() => friendStore.getFriends);
console.log(amigos);
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
      descricao: comp.descricao, // Armazena a descrição nos dados extras
      local: comp.local,
      participantes: comp.participantes, // Salva participantes nos dados do evento
      criador: comp.criador
    },
  }));
});

// ---- Funções do Modal ----
const openCompromissoModal = (
  mode: 'create' | 'edit',
  data: DateClickArg | EventApi
) => {
  modalMode.value = mode;
  if (mode === 'create') {
    isCurrentUserTheCreator.value = true; // Ao criar um evento, o utilizador logado é sempre o criador
    const clickInfo = data as DateClickArg;
    modalSelectedDate.value = clickInfo.dateStr;
    modalInitialData.value = null;
  } else if (mode === 'edit') {
    const event = data as EventApi;
    const currentUserId = authStore.user?.id;
    const creatorId = event.extendedProps.criador?.id;
    isCurrentUserTheCreator.value = creatorId === currentUserId; // Verifica se o utilizador é o criador
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

const closeCompromissoModal = () => {
  isModalOpen.value = false;
  modalInitialData.value = null;
  modalSelectedDate.value = null;
};

const saveCompromisso = async (data: CompromissoFormData) => {
  // 'data' já vem do modal com o campo 'titulo' e 'amigoIds'
  try {
    if (modalMode.value === 'create') {
      // O objeto 'data' vindo do modal deve corresponder ao CompromissoCreateDTO do backend.
      await apiClient.post('/compromissos', data);
      alert('Compromisso criado e compartilhado com sucesso!');
    } else if (modalMode.value === 'edit' && data.id) {
      if (!isCurrentUserTheCreator.value) {
        alert('Apenas o criador pode editar o compromisso.');
        return;
      }
      // A lógica de atualização precisaria de um DTO de atualização
      // que também aceite uma lista de participantes.
      await apiClient.put(`/compromissos/${data.id}`, data);
      alert('Compromisso atualizado com sucesso!');
    }
    closeCompromissoModal();
    fetchCompromissos(); // Recarrega os eventos no calendário
  } catch (error: any) {
    console.error('Erro ao salvar compromisso:', error);
    alert(`Falha ao salvar compromisso: ${error.response?.data?.message || error.message}`);
  }
};

const deleteCompromisso = async (compromissoId: number | string) => {
   if (!isCurrentUserTheCreator.value) {
    alert('Apenas o criador pode excluir o compromisso.');
    return;
  }
  try {
    // A lógica de permissão de exclusão (ex: só o criador pode excluir)
    // deve ser reforçada no backend.
    await apiClient.delete(`/compromissos/${compromissoId}`);
    alert('Compromisso excluído com sucesso!');
    closeCompromissoModal();
    fetchCompromissos();
  } catch (error: any) {
    console.error('Erro ao excluir compromisso:', error);
    alert(`Falha ao excluir compromisso: ${error.response?.data?.message || error.message}`);
  }
};

// ---- Opções e Callbacks do FullCalendar ----
const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: ptBrLocale,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  },
  events: calendarEvents,
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  height: '90vh',

  dateClick: (clickInfo: DateClickArg) => {
    openCompromissoModal('create', clickInfo);
  },

  eventClick: (clickInfo: EventClickArg) => {
    openCompromissoModal('edit', clickInfo.event);
  },

  eventDrop: async (dropInfo: EventDropArg) => {
    if (!confirm(`Você tem certeza que quer mover "${dropInfo.event.title}" para ${dropInfo.event.startStr}?`)) {
      dropInfo.revert();
    } else {
      try {
        const updatedCompromisso = {
          titulo: dropInfo.event.title,
          descricao: dropInfo.event.extendedProps.descricao,
          dataHoraInicio: dropInfo.event.start?.toISOString(),
          dataHoraFim: dropInfo.event.end?.toISOString(),
          local: dropInfo.event.extendedProps.local,
          amigoIds: dropInfo.event.extendedProps.participantes?.map((p: any) => p.id).filter((id: number) => id !== authStore.user?.id) || []
        };
        await apiClient.put(`/compromissos/${dropInfo.event.id}`, updatedCompromisso);
        alert('Compromisso atualizado (movido)!');
        fetchCompromissos();
      } catch (error: any) {
        alert(`Falha ao mover compromisso: ${error.response?.data?.message || error.message}`);
        dropInfo.revert();
      }
    }
  },

  eventResize: async (resizeInfo: EventResizeDoneArg) => {
    if (!confirm(`Você tem certeza que quer redimensionar "${resizeInfo.event.title}" para terminar em ${resizeInfo.event.endStr}?`)) {
      resizeInfo.revert();
    } else {
       try {
        const updatedCompromisso = {
          titulo: resizeInfo.event.title,
          descricao: resizeInfo.event.extendedProps.descricao,
          dataHoraInicio: resizeInfo.event.start?.toISOString(),
          dataHoraFim: resizeInfo.event.end?.toISOString(),
          local: resizeInfo.event.extendedProps.local,
          amigoIds: resizeInfo.event.extendedProps.participantes?.map((p: any) => p.id).filter((id: number) => id !== authStore.user?.id) || []
        };
        await apiClient.put(`/compromissos/${resizeInfo.event.id}`, updatedCompromisso);
        alert('Compromisso atualizado (redimensionado)!');
        fetchCompromissos();
      } catch (error: any) {
        alert(`Falha ao redimensionar compromisso: ${error.response?.data?.message || error.message}`);
        resizeInfo.revert();
      }
    }
  }
});

const fetchCompromissos = async () => {
  if (!authStore.isAuthenticated) {
    loadingError.value = "Você precisa estar logado para ver os compromissos.";
    return;
  }
  try {
    loadingError.value = null;
    const response = await apiClient.get<ApiCompromisso[]>('/compromissos');
    compromissos.value = response.data;
    await nextTick();
    const calendarApi = fullCalendarRef.value?.getApi();
    if (calendarApi) {
      calendarApi.refetchEvents();
    }
  } catch (error: any) {
    console.error("Erro ao buscar compromissos:", error);
    loadingError.value = "Falha ao carregar compromissos.";
    if (error.response && error.response.status === 401) {
        authStore.logout();
    }
  }
};

onMounted(() => {
  if (authStore.token === null && localStorage.getItem('authToken')) {
    authStore.initializeAuth();
  }
  fetchCompromissos();
  friendStore.fetchFriends(); // <-- Busca a lista de amigos quando o componente monta
});
</script>

<style scoped>
/* A sua estilização existente é mantida */
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
}
#logodiv {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 0;
  margin-left: 3%;
}
#log-conteiner{
  display: flex;
  flex-direction: row;
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
 .logout-button{
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
  .logout-button:hover{
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
.oculto{
  display: none;
}
@media screen and (max-width: 750px){
    .body {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        width: 100%;
        align-items: center;
        overflow-y: auto;
        padding: 0;
        box-sizing: border-box;
    }
    #rgcolumn {
        flex-direction: column;
        height: auto;
        width: 100%;
        padding-bottom: 2rem;
    }
    #log-conteiner {
        margin-top: 2rem;
        width: 100%;
        height: auto;
    }
    #logodiv {
        display: flex;
        width: 90%;
        margin-top: 2rem;
        margin-left: 0;
        justify-content: center;
    }
    .logout-button {
        display: none;
    }
    #calendar {
        display: flex;
        align-items: center;
        height: auto;
        width: 100%;
        background-color: #1B1B1B;
        padding-top: 1rem;
    }
    .calendar-container {
        width: 100%;
        height: 100%;
        padding: 10px;
        box-sizing: border-box;
    }
    .oculto {
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: auto;
        width: 100%;
        background-color: transparent;
    }
    #secrender {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin: 0;
    }
    button {
        justify-content: center;
        font-size: 1.2rem;
        width: 80%;
        padding: 0 1rem;
        background-color: rgb(0, 0, 0);
        color: white;
        border: none;
        border: 2px white solid;
        border-radius: 20px;
        height: 50px;
        transition: 0.5s;
        font-weight: 500;
        margin: 1.5rem 0;
    }
}
:deep(.fc-toolbar-title) {
  color: #e3e3e3 !important;
  text-transform: capitalize !important;
}
:deep(.fc-col-header-cell-cushion){
  color: #e3e3e3 !important;
  text-transform: capitalize !important;
}
:deep(.fc-daygrid-day-number){
  color: #e3e3e3 !important;
  padding: 15px !important;
}
:deep(.fc-event-time){
  color: #e3e3e3 !important;
}
:deep(.fc-event-title){
  color: #e3e3e3 !important;
}
:deep(.fc-timegrid-slot-label-frame){
  color: #e3e3e3 !important;
}
:deep(.fc-list-event){
  color: #e3e3e3 !important;
}
:deep(.fc-col-header-cell){
  border-bottom: none !important;
}
:deep(.fc-list-day-text){
  color: #e3e3e3 !important;
  text-transform: capitalize !important;
}
:deep(.fc-list-day-cushion){
  background: #121212 !important;
}
:deep(.fc-list-day-side-text){
  color: #e3e3e3 !important;
  text-transform: capitalize !important;
}
</style>
