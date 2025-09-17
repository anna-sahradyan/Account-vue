import { defineStore } from 'pinia'
import { ref} from 'vue'

export interface Account {
    id: number
    label: { text: string }[]
    type: 'LDAP' | 'Local'
    login: string
    password: string | null
}

export const useAccountsStore = defineStore('accounts', () => {
    const accounts = ref<Account[]>(JSON.parse(localStorage.getItem('accounts') || '[]'))

    function saveAccounts() {
        localStorage.setItem('accounts', JSON.stringify(accounts.value))
    }

    function addAccount(account: Account) {
        accounts.value.push(account)
        saveAccounts()
    }

    function updateAccount(index: number, account: Account) {
        accounts.value[index] = account
        saveAccounts()
    }

    function removeAccount(index: number) {
        accounts.value.splice(index, 1)
        saveAccounts()
    }

    return { accounts, addAccount, updateAccount, removeAccount }
})
