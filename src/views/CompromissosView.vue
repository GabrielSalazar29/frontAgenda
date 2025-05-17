<template>
  <div class="calendar-container">
    <FullCalendar :options="calendarOptions" />
  </div>
  <button @click="handleLogout" class="logout-button">LOGOUT</button>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions, EventInput } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br'; // Para tradução
import { RouterLink, RouterView, useRouter } from 'vue-router';
// Importe seus serviços e store
import apiClient from '../services/api';
import { useAuthStore } from '../stores/authStore';



interface ApiCompromisso {
  id: number;
  descricao: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  local?: string;
}

const authStore = useAuthStore();
const compromissos = ref<ApiCompromisso[]>([]);
const loadingError = ref<string | null>(null);
const router = useRouter();

const handleLogout = () => {
    authStore.logout(); // Chama a ação de logout da store Pinia
    router.push('/'); // Redireciona para a página de login após o logout
  };

const calendarEvents = computed<EventInput[]>(() => {
  return compromissos.value.map(comp => ({
    id: String(comp.id),
    title: comp.descricao,
    start: comp.dataHoraInicio,
    end: comp.dataHoraFim,
    extendedProps: {
      local: comp.local
    },
  }));
});

const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
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
  locale: ptBrLocale, // Usando o locale importado

  dateClick: (info) => {
    alert('Data clicada: ' + info.dateStr);
  },
  eventClick: (info) => {
    alert('Compromisso clicado: ' + info.event.title + '\nLocal: ' + info.event.extendedProps.local);
  },
});

const fetchCompromissos = async () => {
  if (!authStore.isAuthenticated || !authStore.getToken) {
    loadingError.value = "Você precisa estar logado para ver os compromissos.";
    return;
  }
  try {
    loadingError.value = null;
    const response = await apiClient.get<ApiCompromisso[]>('/compromissos');
    compromissos.value = response.data;
  } catch (error: any) {
    console.error("Erro ao buscar compromissos:", error);
    loadingError.value = "Falha ao carregar compromissos.";
    if (error.response && error.response.status === 401) {
        authStore.logout();
        // O router guard deve redirecionar
    }
  }
};

onMounted(() => {
  fetchCompromissos();
});
</script>

<style scoped>

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

.calendar-container {
  width: 100%;
  height: calc(100vh - 120px); /* Ajuste conforme necessário */
  padding: 10px;
  box-sizing: border-box;
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