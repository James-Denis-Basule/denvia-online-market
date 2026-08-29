import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || 'http://localhost:5500/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.message;

    if (
      typeof serverMessage === 'string' &&
      serverMessage.trim()
    ) {
      return serverMessage;
    }

    if (error.response?.status === 503) {
      return 'The service is temporarily unavailable. Please try again shortly.';
    }

    if (error.response?.status === 401) {
      return 'Your session has expired. Please log in again.';
    }

    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error.response?.status === 404) {
      return 'The requested resource could not be found.';
    }

    if (error.response?.status === 409) {
      return 'This information already exists.';
    }

    if (error.response?.status === 400) {
      return 'Please check the information you entered.';
    }

    if (!error.response) {
      return 'Unable to connect to the server. Please check your connection and try again.';
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export default api;