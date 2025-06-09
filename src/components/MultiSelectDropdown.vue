<template>
  <div class="multi-select-container" :class="{ 'is-open': isOpen }" ref="dropdownContainer">
    <div class="select-display" @click="toggleDropdown">
      <span v-if="modelValue.length === 0" class="placeholder">{{ placeholder }}</span>
      <div v-else class="chips-container">
        <span v-for="option in selectedOptions" :key="option.value" class="chip">
          {{ option.text }}
          <span class="chip-remove" @click.stop="removeOption(option.value)">&times;</span>
        </span>
      </div>
      <span class="arrow-indicator">{{ isOpen ? '▲' : '▼' }}</span>
    </div>

    <div v-if="isOpen" class="options-panel">
      <input
        type="text"
        v-model="searchTerm"
        class="search-input"
        placeholder="Buscar..."
        ref="searchInput"
      />
      <ul class="options-list">
        <li v-if="filteredOptions.length === 0" class="no-options-message">
          Nenhum resultado encontrado.
        </li>
        <li v-for="option in filteredOptions" :key="option.value" @click.stop="selectOption(option.value)">
          <input type="checkbox" :checked="isSelected(option.value)" readonly />
          <label>{{ option.text }}</label>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import type { PropType } from 'vue';

interface DropdownOption {
  value: number | string;
  text: string;
}

const props = defineProps({
  options: {
    type: Array as PropType<DropdownOption[]>,
    required: true,
  },
  modelValue: {
    type: Array as PropType<(number | string)[]>,
    required: true,
  },
  placeholder: {
    type: String,
    default: 'Selecione uma ou mais opções',
  },
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const searchTerm = ref('');
const dropdownContainer = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

const filteredOptions = computed(() => {
  if (!searchTerm.value) {
    return props.options;
  }
  return props.options.filter(option =>
    option.text.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const selectedOptions = computed(() => {
    return props.options.filter(option => props.modelValue.includes(option.value));
});

const isSelected = (optionValue: number | string): boolean => {
  return props.modelValue.includes(optionValue);
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectOption = (optionValue: number | string) => {
  const newModelValue = [...props.modelValue];
  const index = newModelValue.indexOf(optionValue);

  if (index > -1) {
    newModelValue.splice(index, 1); // Remove if already selected
  } else {
    newModelValue.push(optionValue); // Add if not selected
  }
  emit('update:modelValue', newModelValue);
};

const removeOption = (optionValue: number | string) => {
    const newModelValue = props.modelValue.filter(v => v !== optionValue);
    emit('update:modelValue', newModelValue);
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
    isOpen.value = false;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
};

watch(isOpen, (newVal) => {
    if (newVal) {
        document.addEventListener('click', handleClickOutside, true); 
    } else {
        document.removeEventListener('click', handleClickOutside, true);
    }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true);
});
</script>

<style scoped>
.multi-select-container {
  position: relative;
  width: 100%;
  font-family: inherit;
}

/* CORREÇÃO: Quando o dropdown está aberto, elevamos todo o seu contentor */
.multi-select-container.is-open {
  z-index: 1002; /* Maior que o z-index do modal-content (1001), mas não precisa de ser excessivamente alto */
}

.select-display {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 43px;
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  cursor: pointer;
  background-color: #555;
  color: white;
}
.placeholder {
  color: #aaa;
}
.chips-container {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    flex-grow: 1;
}
.chip {
    display: flex;
    align-items: center;
    background-color: #007bff;
    color: white;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.9em;
}
.chip-remove {
    margin-left: 8px;
    cursor: pointer;
    font-weight: bold;
}
.chip-remove:hover {
    color: #eee;
}
.arrow-indicator {
  margin-left: auto;
  padding-left: 10px;
}
.options-panel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: rgb(56, 56, 56);
  border: 1px solid #666;
  border-radius: 4px;
  margin-top: 4px;
  z-index: 1050; /* Pode manter um z-index alto aqui por segurança */
  max-height: 250px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}
.search-input {
  width: 100%;
  padding: 10px;
  border: none;
  border-bottom: 1px solid #666;
  box-sizing: border-box;
  background-color: #555;
  color: white;
  font-family: inherit;
}
.options-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.options-list li {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
}
.options-list li:hover {
  background-color: #555;
}
.options-list li input[type="checkbox"] {
  margin-right: 10px;
  pointer-events: none;
}
.no-options-message {
  padding: 10px;
  color: #aaa;
  text-align: center;
}
</style>
