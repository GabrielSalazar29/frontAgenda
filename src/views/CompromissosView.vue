<template>


<body>
    <section id="rgcolumn">


      <div id="logodiv">
        <img src="../assets/logowhite.png" alt="logomarca do projeto">
        <div id="textlogodiv" class="textlogodiv">
          <h3 id="h3sec1" class="textdivs1">Agenda</h3>
          <h1 id="h1sec1" class="textdivs1">de Compromissos</h1>
        </div>
      </div>

      <h2> Logado como: Negão. </h2>
      <div class="little"> 
        <h3 class="textlittle">Calendário</h3>
        <div class="littlebox">

        </div>
      </div>

      <div class="little"> 
        <h3 class="textlittle">Mais importantes</h3>
        <div class="littlebox">
          
        </div>
      </div>

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

</body>
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


body {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  background-color: ;
}

  #rgcolumn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    height: rem;
    width: 45rem;
    background-color: #0D0C0C;
  }

  #logodiv {
    margin-top: 2rem;
}
h2{
  width: 80%;
  margin: 2rem;
  color: white;
}
#calendar{
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color:#1B1B1B;
}

.little{
  display: flex;
  flex-direction: column;
  width: 80%;
  height: 20rem;
  margin: 2rem;
  color: white;
}

.textlittle {
  padding-left: 1rem;
  font-size: 1.4rem;
  padding-bottom: 0.3rem;
}

.littlebox{
  background-color: #1D1D1D;
  width: auto;
  height: 100%;
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
    transition: 0.5s;
    font-weight: 500;
    margin: 3rem;
  }
  
  .logout-button:hover{
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

.oculto{
  display: none;
}

@media screen and (max-width: 950px){
  body{
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  #rgcolumn{
    width: 100%;
    padding-bottom: 4rem;
  }
  #logodiv{
    display: flex;
    width: 80%;
  }
  .logout-button{
    display: None;
  }
  #calendar{
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color:#1B1B1B;
  }

  
  .oculto{
    display: flex;
    flex-direction: column;
    justify-items: center;
    height: 12vh;
  }

  button{
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
    margin: 3rem;
  }

  button:hover{
    transition: 0.5s;
    box-shadow: rgb(255, 198, 11) 0px 0px 5px 0px;
    cursor: pointer;
    transform: scale(1.03);
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