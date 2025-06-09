<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h3>{{ mode === 'create' ? 'Novo Compromisso' : 'Editar Compromisso' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="titulo">Título:</label>
          <input type="text" id="titulo" v-model="formData.titulo" :disabled="!isCreator" required />
        </div>
        <div class="form-group">
          <label for="descricao">Descrição:</label>
          <textarea id="descricao" v-model="formData.descricao" rows="3" :disabled="!isCreator"></textarea>
        </div>
        <div class="form-group">
          <label for="dataHoraInicio">Início:</label>
          <input type="datetime-local" id="dataHoraInicio" v-model="formData.dataHoraInicio" :disabled="!isCreator" required />
        </div>
        <div class="form-group">
          <label for="dataHoraFim">Fim:</label>
          <input type="datetime-local" id="dataHoraFim" v-model="formData.dataHoraFim" :disabled="!isCreator" required />
        </div>
        <div class="form-group">
          <label for="local">Local:</label>
          <input type="text" id="local" v-model="formData.local" :disabled="!isCreator"/>
        </div>

        <!-- CAMPO DE PARTICIPANTES ATUALIZADO PARA USAR O NOVO COMPONENTE -->
        <div class="form-group">
          <template v-if="isCreator">
              <label for="convidados">Convidar Amigos:</label>
            <MultiSelectDropdown
                id="convidados"
                :options="amigosOptions"
                v-model="formData.amigoIds"
                placeholder="Selecione os amigos..."
            />
            </template>
            <template v-else>
              <label for="convidados">Participantes</label>
                <ul class="participants-list">
                    <li v-for="participante in initialData.participantes" :key="participante.id">
                        {{ participante.username }} {{ participante.id === initialData.criador?.id ? '(Criador)' : '' }}
                    </li>
                </ul>
            </template>
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <div class="modal-actions">
          <template v-if="isCreator">
            <button type="submit" class="btn-save">
              {{ mode === 'create' ? 'Criar' : 'Salvar Alterações' }}
            </button>
            <button v-if="mode === 'edit'" type="button" @click="handleDelete" class="btn-delete">
              Excluir
            </button>
          </template>
          <button type="button" @click="closeModal" class="btn-cancel"> {{ isCreator ? 'Cancelar' : 'Fechar' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, defineProps, defineEmits } from 'vue';
import type { PropType } from 'vue';
import type { UsuarioSummaryDTO } from '../types/amizade';
import MultiSelectDropdown from './MultiSelectDropdown.vue';

export interface CompromissoFormData {
  id?: number | string;
  titulo: string;
  descricao: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  local?: string;
  amigoIds?: number[];
  participantes?: UsuarioSummaryDTO[];
  criador?: UsuarioSummaryDTO;
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
  },
  amigos: {
    type: Array as PropType<UsuarioSummaryDTO[]>,
    default: () => []
  },
  isCreator: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['close', 'save', 'delete']);

const formData = ref<CompromissoFormData>({
  titulo: '',
  descricao: '',
  dataHoraInicio: '',
  dataHoraFim: '',
  local: '',
  amigoIds: []
});
const errorMessage = ref<string | null>(null);

const amigosOptions = computed(() => {
    return props.amigos.map(amigo => ({
        value: amigo.id,
        text: amigo.username,
    }));
});

watch(() => props.isOpen, (newIsOpen) => {
    if (newIsOpen) {
        errorMessage.value = null;
        if (props.mode === 'edit' && props.initialData) {
            const creatorId = props.initialData.criador?.id;
            formData.value = {
                id: props.initialData.id,
                titulo: props.initialData.titulo || '',
                descricao: props.initialData.descricao || '',
                dataHoraInicio: props.initialData.dataHoraInicio ? formatDateTimeForInput(new Date(props.initialData.dataHoraInicio)) : '',
                dataHoraFim: props.initialData.dataHoraFim ? formatDateTimeForInput(new Date(props.initialData.dataHoraFim)) : '',
                local: props.initialData.local || '',
                amigoIds: props.initialData.participantes?.map((p) => p.id).filter(id => id !== creatorId) || [], 
            };
        } else if (props.mode === 'create') {
            const defaultHour = 9;
            let initialDateForModal: Date;
            if (props.selectedDate) {
                const parts = props.selectedDate.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    initialDateForModal = new Date(year, month, day, defaultHour, 0, 0);
                } else {
                    initialDateForModal = new Date();
                    initialDateForModal.setHours(defaultHour, 0, 0, 0);
                }
            } else {
                initialDateForModal = new Date();
                initialDateForModal.setHours(defaultHour, 0, 0, 0);
            }
            const endDate = new Date(initialDateForModal.getTime() + (60 * 60 * 1000));
            formData.value = {
                titulo: '',
                descricao: '',
                dataHoraInicio: formatDateTimeForInput(initialDateForModal),
                dataHoraFim: formatDateTimeForInput(endDate),
                local: '',
                amigoIds: [],
            };
        }
    }
}, { immediate: true });

const formatDateTimeForInput = (date: Date): string => {
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
  if (!props.isCreator) {
    closeModal();
    return;
  }
  errorMessage.value = null;
  if (!formData.value.titulo.trim()) {
    errorMessage.value = "O título é obrigatório.";
    return;
  }
  if (!formData.value.dataHoraInicio || !formData.value.dataHoraFim) {
    errorMessage.value = "As datas de início e fim são obrigatórias.";
    return;
  }
  const inicioDate = new Date(formData.value.dataHoraInicio);
  const fimDate = new Date(formData.value.dataHoraFim);
  if (fimDate <= inicioDate) {
    errorMessage.value = "A data de término deve ser posterior à data de início.";
    return;
  }

  const dataToSend = {
    ...formData.value,
    dataHoraInicio: inicioDate.toISOString(),
    dataHoraFim: fimDate.toISOString(),
  };
  emit('save', dataToSend);
};

const handleDelete = () => {
  if (props.mode === 'edit' && props.initialData?.id) {
    if (confirm('Tem certeza que deseja excluir este compromisso?')) {
      emit('delete', props.initialData.id);
    }
  }
};
</script>

<style scoped>
/* Estilização mantida, com adições para o select */
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
  background-color: rgb(56, 56, 56);
  padding: 25px 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  z-index: 1001;
  color: white;
  font-family:Verdana, Geneva, Tahoma, sans-serif;
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
  font-size: 1em;
  background-color: #555;
  color: white;
}
small {
    display: block;
    margin-top: 5px;
    color: #ccc;
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
  color: #ff8a8a; /* Vermelho mais claro para contraste */
  margin-top: 10px;
  font-size: 0.9em;
}
</style>
