import axios from 'axios'

export const apiClient = axios.create({
  baseURL: 'https://api.hybus.app',
  timeout: 10000,
})
