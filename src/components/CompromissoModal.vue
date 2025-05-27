<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h3>{{ mode === 'create' ? 'Novo Compromisso' : 'Editar Compromisso' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="titulo">Título:</label>
          <input type="text" id="titulo" v-model="formData.titulo" required />
        </div>
        <div class="form-group">
          <label for="descricao">Descrição:</label>
          <textarea id="descricao" v-model="formData.descricao" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label for="dataHoraInicio">Início:</label>
          <input type="datetime-local" id="dataHoraInicio" v-model="formData.dataHoraInicio" required />
        </div>
        <div class="form-group">
          <label for="dataHoraFim">Fim:</label>
          <input type="datetime-local" id="dataHoraFim" v-model="formData.dataHoraFim" required />
        </div>
        <div class="form-group">
          <label for="local">Local:</label>
          <input type="text" id="local" v-model="formData.local" />
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <div class="modal-actions">
          <button type="submit" class="btn-save">
            {{ mode === 'create' ? 'Criar' : 'Salvar Alterações' }}
          </button>
          <button v-if="mode === 'edit'" type="button" @click="handleDelete" class="btn-delete">
            Excluir
          </button>
          <button type="button" @click="closeModal" class="btn-cancel">Cancelar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
import type { PropType } from 'vue';

// Interface para os dados do compromisso que o modal manipula
export interface CompromissoFormData {
  id?: number | string;
  titulo: string;
  descricao: string;
  dataHoraInicio: string; // Formato 'YYYY-MM-DDTHH:MM' para datetime-local
  dataHoraFim: string;
  local?: string;
}

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  mode: {
    type: String as PropType<'create' | 'edit'>,
    required: true,
  },
  initialData: {
    type: Object as PropType<Partial<CompromissoFormData> | null>,
    default: null,
  },
  selectedDate: { // Espera-se que seja uma string como "YYYY-MM-DD" do FullCalendar dateClick
    type: String as PropType<string | null>,
    default: null,
  }
});

const emit = defineEmits(['close', 'save', 'delete']);

const formData = ref<CompromissoFormData>({
  titulo: '',
  descricao: '',
  dataHoraInicio: '',
  dataHoraFim: '',
  local: '',
});
const errorMessage = ref<string | null>(null);

watch(() => [props.initialData, props.selectedDate, props.mode], ([newInitialData, newSelectedDate, newMode]) => {
  errorMessage.value = null;
  if (props.isOpen) {
    if (newMode === 'edit' && newInitialData) {
      formData.value = {
        id: newInitialData.id,
        titulo: newInitialData.titulo || '',
        descricao: newInitialData.descricao || '',
        // Ao editar, newInitialData.dataHoraInicio é provavelmente uma string ISO (UTC) ou já formatada.
        // new Date() a converterá para um objeto Date (que internamente é UTC mas métodos são locais).
        // formatDateTimeForInput então pegará os componentes locais desse objeto Date.
        dataHoraInicio: newInitialData.dataHoraInicio ? formatDateTimeForInput(new Date(newInitialData.dataHoraInicio)) : '',
        dataHoraFim: newInitialData.dataHoraFim ? formatDateTimeForInput(new Date(newInitialData.dataHoraFim)) : '',
        local: newInitialData.local || '',
      };
    } else if (newMode === 'create') {
      const defaultHour = 9; // Hora local padrão para início: 09:00
      const defaultMinute = 0;
      let initialDateForModal: Date;

      if (newSelectedDate) {
        // newSelectedDate de dateClick do FullCalendar é geralmente "YYYY-MM-DD" para cliques em dias.
        // Precisamos construir um objeto Date que represente esta data no fuso horário local.
        const parts = newSelectedDate.split('-'); // ex: ["2025", "05", "20"]
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Mês em JavaScript é 0-indexado
          const day = parseInt(parts[2], 10);
          // Cria o objeto Date com a data local e a hora padrão local
          initialDateForModal = new Date(year, month, day, defaultHour, defaultMinute, 0);
        } else {
          // Fallback se newSelectedDate não estiver no formato esperado
          initialDateForModal = new Date();
          initialDateForModal.setHours(defaultHour, defaultMinute, 0, 0);
        }
      } else {
        // Fallback para a data/hora atual se nenhuma data for selecionada
        initialDateForModal = new Date();
        initialDateForModal.setHours(defaultHour, defaultMinute, 0, 0); // Define para a hora padrão local
      }

      const endDate = new Date(initialDateForModal.getTime() + (60 * 60 * 1000)); // Adiciona 1 hora por padrão

      formData.value = {
        titulo: '',
        descricao: '',
        dataHoraInicio: formatDateTimeForInput(initialDateForModal),
        dataHoraFim: formatDateTimeForInput(endDate),
        local: '',
      };
    }
  }
}, { immediate: true, deep: true });

/**
 * Formata um objeto Date para a string 'YYYY-MM-DDTHH:MM'
 * esperada pelo input datetime-local.
 * O objeto Date de entrada já deve representar a data/hora local correta.
 */
const formatDateTimeForInput = (date: Date): string => {
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mês é 0-11, então +1
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const closeModal = () => {
  emit('close');
};

const handleSubmit = () => {
  errorMessage.value = null;
  if (!formData.value.titulo.trim()) {
    errorMessage.value = "O título é obrigatório.";
    return;
  }
  if (!formData.value.dataHoraInicio || !formData.value.dataHoraFim) {
    errorMessage.value = "As datas de início e fim são obrigatórias.";
    return;
  }
  
  // formData.value.dataHoraInicio é uma string como "2025-05-20T09:00" (representando hora local)
  // new Date("YYYY-MM-DDTHH:MM") cria um objeto Date interpretando a string como hora local.
  const inicioDate = new Date(formData.value.dataHoraInicio); 
  const fimDate = new Date(formData.value.dataHoraFim);

  if (fimDate <= inicioDate) {
    errorMessage.value = "A data de término deve ser posterior à data de início.";
    return;
  }

  // Converte para ISO string (que é sempre UTC com 'Z' no final) para enviar ao backend.
  const dataToSend = {
    ...formData.value,
    dataHoraInicio: inicioDate.toISOString(),
    dataHoraFim: fimDate.toISOString(),
  };

  emit('save', dataToSend);
};

const handleDelete = () => {
  if (props.mode === 'edit' && formData.value.id) {
    if (confirm('Tem certeza que deseja excluir este compromisso?')) {
      emit('delete', formData.value.id);
    }
  }
};

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 25px 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: 90%;
  max-width: 500px;
  z-index: 1001;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="datetime-local"],
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-family: inherit;
}

.modal-actions {
  margin-top: 25px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-save, .btn-delete, .btn-cancel {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-save {
  background-color: #007bff;
  color: white;
}
.btn-save:hover {
  background-color: #0056b3;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}
.btn-delete:hover {
  background-color: #c82333;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
}
.btn-cancel:hover {
  background-color: #5a6268;
}

.error-message {
  color: #dc3545;
  margin-top: 10px;
  font-size: 0.9em;
}
</style>
