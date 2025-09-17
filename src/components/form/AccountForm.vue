<script setup lang="ts">
import styles from './accountsForm.module.scss'
import {Account, useAccountsStore} from "@/store/accounts";
import {reactive} from 'vue';
import Question from "@/components/icons/Question.vue";
import Plus from "@/components/icons/Plus.vue";
import Trash from "@/components/icons/Trash.vue";
import Eye from "@/components/icons/Eye.vue";

const store = useAccountsStore();
const {accounts, addAccount, updateAccount, removeAccount} = store;

// Ошибки по id аккаунта
const errors = reactive<{ [key: number]: { label?: string; login?: string; password?: string } }>({});

// Видимость пароля
const showPassword = reactive<{ [key: number]: boolean }>({});
const passwordInputs = reactive<{ [key: number]: string | null }>({});
// Поля input для меток
const labelInputs = reactive<{ [key: number]: string }>({});

// Создание пустого аккаунта
function createEmptyAccount(): Account {
  return {id: Date.now(), label: [], type: 'LDAP', login: '', password: null};
}

// Метки: строка → массив объектов
function stringToLabels(label: string) {
  return label.split(';').map(l => l.trim()).filter(Boolean).map(l => ({text: l}));
}

// Метки: массив объектов → строка для input
function labelsToString(labels: { text: string }[]) {
  return labels.map(l => l.text).join('; ');
}

// Валидация email
function isValidEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Валидация аккаунта
function validate(account: Account) {
  errors[account.id] = {};

  const labelStr = labelsToString(account.label);
  if (labelStr.length > 50) errors[account.id].label = 'Максимум 50 символов';

  if (!account.login) {
    errors[account.id].login = 'Логин обязателен';
  } else if (account.login.length > 100) {
    errors[account.id].login = 'Максимум 100 символов';
  } else if (!isValidEmail(account.login)) {
    errors[account.id].login = 'Введите корректный email';
  } else {
    // Проверка на уникальность логина среди других аккаунтов
    const duplicate = accounts.some(
        a => a.id !== account.id && a.login === account.login
    );
    if (duplicate) errors[account.id].login = 'Логин уже используется';
  }

  if (account.type === 'Local') {
    if (!account.password) errors[account.id].password = 'Пароль обязателен';
    else if (account.password.length > 100) errors[account.id].password = 'Максимум 100 символов';
  }

  return Object.keys(errors[account.id]).length === 0;
}

// Сохранение аккаунта в store + localStorage
function save(account: Account) {
  const index = accounts.findIndex(a => a.id === account.id);
  if (index === -1) return;

  // Берём строку из input
  const labelStr = labelInputs[account.id] || '';

  // Преобразуем в массив объектов, каждый элемент до ;
  const labelsArray = labelStr
      .split(';')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => ({ text: l }));

  // Обновляем account.label
  account.label = labelsArray;

  // Валидация
  if (validate(account)) {
    updateAccount(index, { ...account });
  }

  // Для отладки
  console.log(account.label);
}

// Изменение типа аккаунта
function onTypeChange(account: Account) {
  if (account.type === 'LDAP') account.password = null;
  save(account);
}

// Добавление новой строки
function handleAddAccount() {
  const account = createEmptyAccount();
  addAccount(account);
  errors[account.id] = {};
  showPassword[account.id] = false;
  labelInputs[account.id] = '';
}

// Удаление аккаунта
function handleRemove(id: number) {
  const index = accounts.findIndex(a => a.id === id);
  if (index !== -1) {
    removeAccount(index);
    delete errors[id];
    delete showPassword[id];
    delete labelInputs[id];
  }
}

// Переключение видимости пароля
function togglePassword(id: number) {
  showPassword[id] = !showPassword[id];
}

// Инициализация input для меток при загрузке
accounts.forEach(acc => {
  if (!labelInputs[acc.id]) labelInputs[acc.id] = labelsToString(acc.label);
  passwordInputs[acc.id] = acc.password || '';
});

</script>

<template>
  <div :class="styles.accountForm">
    <div :class="styles.btnBox">
      <span>Учетные записи</span>
      <button :class="styles.noteBtn" @click="handleAddAccount">
        <Plus/>
      </button>
    </div>

    <h3 :class="styles.title">
      <Question/>
      <span>для указания нескольких меток для одной пары логин / пароль используйте разделитель ;</span>
    </h3>
    <div class="tableWrapper" :class="styles.tableWrapper">
      <table>
        <thead>
        <tr>
          <th :class="styles.headingTable" data-label="Метки">Метки</th>
          <th :class="styles.headingTable" data-label="Тип записи">Тип записи</th>
          <th :class="styles.headingTable" data-label="Логин">Логин</th>
          <th :class="styles.headingTable" data-label="Пароль">Пароль</th>
          <th :class="styles.headingTable" data-label="Действия">Действия</th>
        </tr>
        </thead>

        <tbody>
        <tr v-for="account in accounts" :key="account.id">
          <!-- Метка -->
          <td data-label="Метки">
            <div :class="styles.fieldWrapper">
              <input
                  v-model="labelInputs[account.id]"
                  @blur="() => save(account)"
                  :class="[styles.inputField, errors[account.id]?.label ? styles.error : '']"
              />
              <span v-if="errors[account.id]?.label" :class="styles.errorMsg">
                {{ errors[account.id].label }}
              </span>
            </div>
          </td>

          <!-- Тип -->
          <td data-label="Тип записи">
            <div :class="styles.fieldWrapper">
              <select
                  v-model="account.type"
                  @change="onTypeChange(account)"
                  :class="styles.selectInput"
              >
                <option value="LDAP">LDAP</option>
                <option value="Local">Локальная</option>
              </select>
            </div>
          </td>

          <!-- Логин -->
          <td data-label="Логин">
            <div :class="styles.fieldWrapper">
              <input
                  v-model="account.login"
                  @input="validate(account)"
                  @blur="save(account)"
                  :class="[styles.inputField, errors[account.id]?.login ? styles.error : '']"
              />
              <span v-if="errors[account.id]?.login" :class="styles.errorMsg">
                {{ errors[account.id].login }}
              </span>
            </div>
          </td>

          <!-- Пароль -->
          <td data-label="Пароль">
            <div v-if="account.type === 'Local'" :class="styles.fieldWrapper">
              <div :class="styles.passwordEye">
                <input
                    :type="showPassword[account.id] ? 'text' : 'password'"
                    v-model="passwordInputs[account.id]"
                    @input="validate(account)"
                    @blur="() => { account.password = passwordInputs[account.id]; save(account); }"
                    :class="[styles.inputField, errors[account.id]?.password ? styles.error : '']"
                />
                <button type="button" @click="togglePassword(account.id)">
                  <Eye class="icon"/>
                </button>
              </div>
              <span v-if="errors[account.id]?.password" :class="styles.errorMsg">
                {{ errors[account.id].password }}
              </span>
            </div>
          </td>

          <!-- Действия -->
          <td :class="styles.actions" data-label="Действия">
            <button @click="handleRemove(account.id)">
              <Trash/>
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
