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
          <button v.if="mode === 'edit'" type="button" @click="handleDelete" class="btn-delete">
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
  titulo: string; // NOVO CAMPO
  descricao: string;
  dataHoraInicio: string;
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
  selectedDate: {
    type: String as PropType<string | null>,
    default: null,
  }
});

const emit = defineEmits(['close', 'save', 'delete']);

const formData = ref<CompromissoFormData>({
  titulo: '', // NOVO CAMPO
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
        titulo: newInitialData.titulo || '', // NOVO CAMPO
        descricao: newInitialData.descricao || '',
        dataHoraInicio: newInitialData.dataHoraInicio ? formatDateTimeForInput(newInitialData.dataHoraInicio) : '',
        dataHoraFim: newInitialData.dataHoraFim ? formatDateTimeForInput(newInitialData.dataHoraFim) : '',
        local: newInitialData.local || '',
      };
    } else if (newMode === 'create') {
      const startDate = newSelectedDate ? new Date(newSelectedDate) : new Date();
      if (startDate.getMinutes() > 0 && startDate.getMinutes() < 30) {
        startDate.setMinutes(30, 0, 0);
      } else if (startDate.getMinutes() > 30) {
        startDate.setHours(startDate.getHours() + 1, 0, 0, 0);
      } else {
         startDate.setMinutes(0,0,0);
      }
      const endDate = new Date(startDate.getTime() + (60 * 60 * 1000)); // Adiciona 1 hora por padrão

      formData.value = {
        titulo: '', // NOVO CAMPO
        descricao: '',
        dataHoraInicio: formatDateTimeForInput(startDate.toISOString()),
        dataHoraFim: formatDateTimeForInput(endDate.toISOString()),
        local: '',
      };
    }
  }
}, { immediate: true, deep: true });

const formatDateTimeForInput = (dateTimeString: string | Date): string => {
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
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
  if (!formData.value.titulo.trim()) { // Validação para o título
    errorMessage.value = "O título é obrigatório.";
    return;
  }
  if (!formData.value.dataHoraInicio || !formData.value.dataHoraFim) {
    errorMessage.value = "As datas de início e fim são obrigatórias.";
    return;
  }
  if (new Date(formData.value.dataHoraFim) <= new Date(formData.value.dataHoraInicio)) {
    errorMessage.value = "A data de término deve ser posterior à data de início.";
    return;
  }

  const dataToSend = {
    ...formData.value,
    dataHoraInicio: new Date(formData.value.dataHoraInicio).toISOString(),
    dataHoraFim: new Date(formData.value.dataHoraFim).toISOString(),
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
.form-group textarea { /* Estilo para textarea */
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-family: inherit; /* Garante que a fonte seja a mesma */
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
