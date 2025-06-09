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
          <h2> Logado como: {{  authStore.getUsername?.charAt(0).toUpperCase() + authStore.getUsername?.slice(1) }}. </h2>
      </div>
       <RouterLink to="/amigos">Meus Amigos</RouterLink> |
        <RouterLink to="/solicitacoes-amizade">Solicitações</RouterLink> |
        <RouterLink to="/encontrar-amigos">Encontrar Amigos</RouterLink> | <span>Olá, {{ authStore.getUsername }}!</span>
      <button @click="handleLogout" class="logout-button">LOGOUT</button>

    </section>

  <section id="calendar">
    <div class="calendar-container">
      <FullCalendar :options="calendarOptions" />
    </div>
  </section>

  <section id="secrender" class="oculto">
      <button @click="handleLogout" id="button-logout" class="oculto">LOGOUT</button>
  </section>
</div>


<CompromissoModal
   :is-open="isModalOpen"
   :mode="modalMode"
   :initial-data="modalInitialData"
   :selected-date="modalSelectedDate"
   @close="closeCompromissoModal"
   @save="saveCompromisso"
   @delete="deleteCompromisso"
 />


</template>
<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import type { CalendarApi, CalendarOptions, EventApi, EventInput, EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction'; // DateClickArg e EventResizeDoneArg do interactionPlugin

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { useRouter } from 'vue-router';
import apiClient from '../services/api';
import { useAuthStore } from '../stores/authStore';
import CompromissoModal from '../components/CompromissoModal.vue';
import type { CompromissoFormData } from '../components/CompromissoModal.vue';

interface ApiCompromisso {
  id: number;
  titulo: string;
  descricao: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  local?: string;
  usuario?: { id: number; username: string };
}

const authStore = useAuthStore();
const compromissos = ref<ApiCompromisso[]>([]);
const loadingError = ref<string | null>(null);
const fullCalendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);
const router = useRouter();

const handleLogout = () => {
    authStore.logout(); // Chama a ação de logout da store Pinia
    router.push('/'); // Redireciona para a página de login após o logout
  };
// ---- Estado do Modal ----
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const modalInitialData = ref<Partial<CompromissoFormData> | null>(null);
const modalSelectedDate = ref<string | null>(null);

const calendarEvents = computed<EventInput[]>(() => {
  return compromissos.value.map(comp => ({
    id: String(comp.id),
    title: comp.titulo,
    descricao: comp.descricao,
    start: comp.dataHoraInicio,
    end: comp.dataHoraFim,
    extendedProps: {
      local: comp.local,
    },
  }));
});

// ---- Funções do Modal ----
const openCompromissoModal = (
  mode: 'create' | 'edit',
  data: DateClickArg | EventApi // Tipo mais específico para os dados de entrada
) => {
  modalMode.value = mode;
  if (mode === 'create') {
    // Para o modo 'create', esperamos um DateClickArg
    const clickInfo = data as DateClickArg; // Type assertion
    modalSelectedDate.value = clickInfo.dateStr;
    modalInitialData.value = null; // Limpa dados de edição
  } else if (mode === 'edit') {
    // Para o modo 'edit', esperamos um EventApi
    const event = data as EventApi; // Type assertion
    modalInitialData.value = {
      id: event.id,
      titulo: event.title,
      descricao: event.extendedProps.descricao,
      dataHoraInicio: event.startStr, // ou event.start?.toISOString()
      dataHoraFim: event.endStr,     // ou event.end?.toISOString()
      local: event.extendedProps.local,
    };
    modalSelectedDate.value = null; // Limpa data de criação
  }
  isModalOpen.value = true;
};

const closeCompromissoModal = () => {
  isModalOpen.value = false;
  modalInitialData.value = null;
  modalSelectedDate.value = null;
};

const saveCompromisso = async (data: CompromissoFormData) => {
  try {
    if (modalMode.value === 'create') {
      const { id, ...createData } = data;
      await apiClient.post('/compromissos', createData);
      alert('Compromisso criado com sucesso!');
    } else if (modalMode.value === 'edit' && data.id) {
      await apiClient.put(`/compromissos/${data.id}`, data);
      alert('Compromisso atualizado com sucesso!');
    }
    closeCompromissoModal();
    fetchCompromissos();
  } catch (error: any) {
    console.error('Erro ao salvar compromisso:', error);
    alert(`Falha ao salvar compromisso: ${error.response?.data?.message || error.message}`);
  }
};

const deleteCompromisso = async (compromissoId: number | string) => {
  try {
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
    console.log('Date clicked:', clickInfo.dateStr);
    openCompromissoModal('create', clickInfo); // clickInfo é DateClickArg
  },

  eventClick: (clickInfo: EventClickArg) => {
    console.log('Event clicked:', clickInfo.event.id, clickInfo.event.title);
    openCompromissoModal('edit', clickInfo.event); // clickInfo.event é EventApi
  },

  eventDrop: async (dropInfo: EventDropArg) => {
    console.log('Event dropped:', dropInfo.event.id, dropInfo.event.startStr, dropInfo.event.endStr);
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
        };
        await apiClient.put(`/compromissos/${dropInfo.event.id}`, updatedCompromisso);
        alert('Compromisso atualizado (movido)!');
        fetchCompromissos();
      } catch (error: any) {
        console.error('Erro ao mover compromisso:', error);
        alert(`Falha ao mover compromisso: ${error.response?.data?.message || error.message}`);
        dropInfo.revert();
      }
    }
  },

  eventResize: async (resizeInfo: EventResizeDoneArg) => {
    console.log('Event resized:', resizeInfo.event.id, resizeInfo.event.startStr, resizeInfo.event.endStr);
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
        };
        await apiClient.put(`/compromissos/${resizeInfo.event.id}`, updatedCompromisso);
        alert('Compromisso atualizado (redimensionado)!');
        fetchCompromissos();
      } catch (error: any) {
        console.error('Erro ao redimensionar compromisso:', error);
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
    console.log("Compromissos carregados:", compromissos.value);
    await nextTick();
    // const calendarApi = fullCalendarRef.value?.getApi();
    // if (calendarApi) {
      // A reatividade do 'events' com 'calendarEvents' (computed) deve ser suficiente.
    // }
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
});

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
        /* Remover justify-content: space-between; se ainda estiver aqui */
        min-height: 100vh; /* Manter min-height para permitir rolagem */
        width: 100%;
        align-items: center;
        overflow-y: auto; /* Manter para controlar o scroll em telas menores */
        padding: 0;
        box-sizing: border-box;
    }

    #rgcolumn {
        flex-direction: column;
        height: auto; /* Permite que a altura se ajuste ao conteúdo */
        width: 100%;
        /* Ajustar margins/paddings para evitar espaçamento excessivo */
        padding-bottom: 2rem; /* Adicionar um pequeno padding na parte inferior para espaçamento */
    }

    #log-conteiner {
        margin-top: 2rem; /* Reduzir a margem superior */
        width: 100%;
        height: auto; /* Ajustar a altura para ser flexível */
    }

    #logodiv {
        display: flex;
        width: 90%; /* Ajustar para ocupar mais largura */
        margin-top: 2rem; /* Reduzir a margem superior */
        margin-left: 0;
        justify-content: center; /* Centralizar logo */
    }

    /* Manter .logout-button display: none; se for a intenção */
    .logout-button {
        display: none;
    }

    #calendar {
        display: flex;
        align-items: center;
        height: auto; /* Remover height fixo, deixar flex-grow lidar com a altura */
        width: 100%;
        background-color: #1B1B1B;
        padding-top: 1rem; /* Adicionar um pequeno padding superior para espaçamento */
    }

    .calendar-container {
        width: 100%;
        height: 100%; /* Ocupa a altura total do seu pai (#calendar) */
        padding: 10px;
        box-sizing: border-box;
    }

    .oculto {
        display: flex;
        flex-direction: column;
        justify-content: center; /* Usar justify-content ao invés de justify-items */
        height: auto; /* Deixar a altura flexível */
        width: 100%;
        /* Adicionar padding ou margin para espaçamento */
        background-color: transparent;
    }

    #secrender {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin: 0; /* Reduzir margem superior */
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
        margin: 1.5rem 0; /* Ajustar as margens para cima/baixo */

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
